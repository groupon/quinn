/*global describe, it, after */
'use strict';

var http = require('http');
var assert = require('assert');

var Bluebird = require('bluebird');

var quinn = require('../');

var router = require('quinn-router');
var route = router.route;

var respond = require('quinn-respond');

var Cookies = require('../dist/cookies');
var getCookie = Cookies.getCookie;
var setCookie = Cookies.setCookie;

var DEFAULT_TYPE = 'text/plain; charset=utf-8';

describe('quinn.boots', function() {
  describe('starting a simple server', function() {
    var server = null;
    it('starts', function(done) {
      server = http.createServer(quinn(route(function(app) {
        app.GET('/test', function(req, params) {
          var myCookie = getCookie(req, 'foo');
          return params.testParam + ' ' + myCookie;
        }, function(req, parsedUrl) {
          return { testParam: parsedUrl.query.a };
        });

        app.GET('/throws', function() {
          throw new Error('Fatality');
        });

        app.GET('/hello/{name}', function(req, params) {
          return respond('Hello, ' + params.name + '!').status(201);
        });

        app.GET('/cookie', function() {
          return setCookie(respond('ok'), 'name', 'jane', {
            maxAge: 3600,
            domain: '.example.com',
            path: '/',
            httpOnly: true
          });
        });
      })));
      server.listen(0, done);
    });

    function getPath(path) {
      return new Bluebird(function(resolve, reject) {
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
      return new Bluebird(function(resolve, reject) {
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
          var firstLine = body.split('\n').shift();
          assert.equal(firstLine, 'Error: Fatality', body);
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
          assert.equal(body, 'Cannot GET /nirvana\n');
        })
      );
    });

    it('supports route parameters', function() {
      return (
        getPath('/hello/world')
        .then(function(res) {
          assert.equal(res.statusCode, 201);
          assert.equal(res.headers['content-type'], DEFAULT_TYPE);
          assert(res.headers['content-length']);
          return readBody(res);
        })
        .then(function(body) {
          assert.equal(body, 'Hello, world!');
        })
      );
    });

    it('can set cookies', function() {
      return getPath('/cookie')
        .then(function(res) {
          assert.equal(res.statusCode, 200);
          assert(Array.isArray(res.headers['set-cookie']));
          assert.equal(res.headers['set-cookie'].length, 1);
          assert.equal(res.headers['set-cookie'][0],
            'name=jane; Max-Age=3600; Domain=.example.com; Path=/; HttpOnly');
        });
    });

    after(function() {
      if (server) server.close();
    });
  });
});
