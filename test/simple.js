/*global describe, it, after */
'use strict';

var http = require('http');
var assert = require('assert');

var Promise = require('bluebird');

var quinn = require('../');
var routes = quinn.routes;
var getCookie = require('../dist/cookies').getCookie;

var DEFAULT_TYPE = 'text/plain; charset=utf-8';

describe('quinn.boots', function() {
  describe('starting a simple server', function() {
    var server = null;
    it('starts', function(done) {
      server = http.createServer(quinn(routes(function(app) {
        app.GET('/test', function(req) {
          var myCookie = getCookie(req, 'foo');
          return req.query.a + ' ' + myCookie;
        });
        app.GET('/throws', function() {
          throw new Error('Fatality');
        });
        app.GET('/hello/{name}', function(req) {
          return 'Hello, ' + req.params.name + '!';
        });
      })));
      server.listen(0, done);
    });

    function getPath(path) {
      return new Promise(function(resolve, reject) {
        http.get({
          host: '127.0.0.1',
          port: server.address().port,
          path: path,
          headers: {
            Cookie: 'foo=zapp; bar=xyz'
          }
        })
        .on('response', function(res) {
          resolve(res);
        })
        .on('error', reject);
      });
    }

    function readBody(res) {
      return new Promise(function(resolve, reject) {
        var body = '';
        res.on('data', function(chunk) { body += chunk.toString(); });
        res.on('end', function() {
          resolve(body);
        });
        res.on('error', reject);
      });
    }

    it('serves requests', function() {
      return (
        getPath('/test?a=ok')
        .then(function(res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers['content-type'], DEFAULT_TYPE);
          assert.equal(res.headers['content-length'], '7');
          return readBody(res);
        })
        .then(function(body) {
          assert.equal(body, 'ok zapp');
        })
      );
    });

    it('shows errors', function() {
      return (
        getPath('/throws')
        .then(function(res) {
          assert.equal(res.statusCode, 500);
          assert.equal(res.headers['content-type'], DEFAULT_TYPE);
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
          assert.equal(res.headers['content-type'], DEFAULT_TYPE);
          assert(res.headers['content-length']);
          return readBody(res);
        })
        .then(function(body) {
          assert.equal(body, 'Cannot GET /nirvana');
        })
      );
    });

    it('supports route parameters', function() {
      return (
        getPath('/hello/world')
        .then(function(res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers['content-type'], DEFAULT_TYPE);
          assert(res.headers['content-length']);
          return readBody(res);
        })
        .then(function(body) {
          assert.equal(body, 'Hello, world!');
        })
      );
    });

    after(function() {
      if (server) server.close();
    });
  });
});
