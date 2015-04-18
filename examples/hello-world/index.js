'use strict';

const createApp = require('../../');
const respond = require('../../respond');

function makeRequest(url) {
  return new Promise(function(resolve, reject) {
    require('http')
      .request(url)
      .on('error', reject)
      .on('response', function(res) {
        res.on('error', reject);
        res.setEncoding('utf8');
        res.body = '';
        res.on('data', function(chunk) { res.body += chunk; });
        res.on('end', function() { resolve(res); });
      })
      .end();
  });
}

function handle(request) {
  if (request.url === '/foo') return;
  return require('fs')
    .createReadStream('.travis.yml')
    .pipe(respond({
      statusCode: 200,
      headers: {
        'X-Req-User-Agent': request.headers['user-agent'] || 'Unknown',
        'X-Foo': 'Bar'
      }
    }));
}

const app = createApp(handle);

require('http')
  .createServer(app)
  .listen(function() {
    const port = this.address().port;
    console.log('Listening on http://127.0.0.1:%d', port);
    makeRequest('http://127.0.0.1:' + port + '/bar').then(function(res) {
      console.log('Response: %d %j', res.statusCode, res.body, res.headers);
      process.exit(0);
    });
  });