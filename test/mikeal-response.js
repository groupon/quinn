'use strict';

const response = require('response');

const quinn = require('../');

const withTestApp = require('./test-app');

function handler(req) {
  if (req.url === '/') return response.html('<html>Hello World</html>');
  if (req.url === '/sitemap.html') {
    var f = fs.createReadStream('sitemap')
    return f.pipe(response.html());
  }
  if (req.url === '/something.json') return response.json({test:1});
  if (req.url === '/something.txt') return response.txt('some test');
}

describe('Using mikeal/response', function() {
  const _$ = withTestApp(quinn(handler)),
        describeRequest = _$.describeRequest,
        assertStatusCode = _$.assertStatusCode,
        itSends = _$.itSends;

  describeRequest('GET', '/', function() {
    assertStatusCode(200);
    itSends('<html>Hello World</html>');
  });

  describeRequest('GET', '/something.txt', function() {
    assertStatusCode(200);
    itSends('some test');
  });
});
