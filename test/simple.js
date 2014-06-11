
var http = require('http');
var assert = require('assert');

var quinn = require('../');
var routes = quinn.routes;

describe('quinn.boots', function() {
  describe('starting a simple server', function() {
    var server = null;
    it('starts', function(done) {
      server = http.createServer(quinn(routes(function(app) {
        app.GET('/test', function() {
          return 'ok';
        });
      })));
      server.listen(0, done);
    });

    it('serves requests', function(done) {
      var url = 'http://127.0.0.1:' + server.address().port + '/test';
      http.get(url).on('response', function(res) {
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-type'], 'text/plain');
        assert.equal(res.headers['content-length'], '2');
        done();
      });
    });

    after(function() {
      if (server) server.close();
    });
  });
});
