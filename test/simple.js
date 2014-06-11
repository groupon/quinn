
var http = require('http');
var assert = require('assert');

var Promise = require('bluebird');

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

    function getPath(path, callback, onError) {
      return new Promise(function(resolve, reject) {
        var url = 'http://127.0.0.1:' + server.address().port + path;
        http.get(url)
        .on('response', function(res) {
          resolve(res);
        })
        .on('error', reject);
      });
    }

    function readBody(res) {
      return new Promise(function(resolve, reject) {
        var body = '';
        res.on('data', function(chunk) { body += chunk.toString() });
        res.on('end', function() {
          resolve(body);
        });
      });
    }

    it('serves requests', function() {
      return (
        getPath('/test')
        .then(function(res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers['content-type'], 'text/plain');
          assert.equal(res.headers['content-length'], '2');
        })
      );
    });

    it('shows errors', function() {
      return (
        getPath('/throws')
        .then(function(res) {
          assert.equal(res.statusCode, 500);
          assert.equal(res.headers['content-type'], 'text/plain');
          assert(res.headers['content-length']);
          return readBody(res);
        })
        .then(function(body) {
          assert.equal(body.substr(0, 15), 'Error: Fatality');
        })
      );
    });

    it('sends 404s', function() {
      return (
        getPath('/nirvana')
        .then(function(res) {
          assert.equal(res.statusCode, 404);
          assert.equal(res.headers['content-type'], 'text/plain');
          assert(res.headers['content-length']);
          return readBody(res);
        })
        .then(function(body) {
          assert.equal(body, 'Cannot GET /nirvana');
        })
      );
    });

    after(function() {
      if (server) server.close();
    });
  });
});
