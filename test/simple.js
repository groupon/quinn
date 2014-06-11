
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
        app.GET('/throws', function() {
          throw new Error('Fatality');
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

    it('shows errors', function(done) {
      var url = 'http://127.0.0.1:' + server.address().port + '/throws';
      http.get(url).on('response', function(res) {
        assert.equal(res.statusCode, 500);
        assert.equal(res.headers['content-type'], 'text/plain');
        assert(res.headers['content-length']);
        var body = '';
        res.on('data', function(chunk) { body += chunk.toString() });
        res.on('end', function() {
          assert.equal(body.substr(0, 15), 'Error: Fatality');
          done();
        });
      });
    });

    it('sends 404s', function(done) {
      var url = 'http://127.0.0.1:' + server.address().port + '/nirvana';
      http.get(url).on('response', function(res) {
        assert.equal(res.statusCode, 404);
        assert.equal(res.headers['content-type'], 'text/plain');
        assert(res.headers['content-length']);
        var body = '';
        res.on('data', function(chunk) { body += chunk.toString() });
        res.on('end', function() {
          assert.equal(body, 'Cannot GET /nirvana');
          done();
        });
      });
    });

    after(function() {
      if (server) server.close();
    });
  });
});
