'use strict';

var http = require('http');

var Promise = require('bluebird');

function Router(req) {
  var response = undefined;

  return {
    GET: function(path, handler) {
      if (typeof handler !== 'function') {
        throw new Error('Expected function as handler');
      }
      if (response === undefined &&
          req.method === 'GET' &&
          req.url === path) {
        response = handler(req);
      }
      return this;
    },
    getResponse: function() { return response; }
  }
}

function routes(routeDef) {
  return function(req) {
    var router = Router(req);
    routeDef(router);
    return router.getResponse();
  };
}

function NotFound(req) {
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'text/plain' },
    body: 'Cannot ' + req.method + ' ' + req.url
  }
}

function ServerError(req, err) {
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'text/plain' },
    body: err.stack
  }
}

function quinn(handler) {
  return function handleRequest(req, res, next) {
    Promise.cast(handler(req))
    .catch(function(err) {
      if (typeof next !== 'function') {
        return ServerError(req, err);
      }
      return Promise.reject(err);
    })
    .then(function(response) {
      if (response === undefined) {
        if (typeof next === 'function') {
          next();
          return;
        } else {
          response = NotFound(req);
        }
      }
      // send response
      if (typeof response === 'string') {
        var body = new Buffer(response, 'utf8');
        response = {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': body.length
          },
          body: body
        }
      } else if (typeof response === 'number') {
        var body = new Buffer(
          http.STATUS_CODES[response],
          'utf8'
        );
        response = {
          statusCode: response,
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': body.length
          },
          body: body
        }
      }
      res.statusCode = response.statusCode;
      for (var key in response.headers) {
        res.setHeader(key, response.headers[key]);
      }
      res.end(response.body);
    }).catch(next);
  };
}

module.exports = quinn;
quinn.routes = routes;

if (require.main === module) {
  var server = http.createServer(quinn(routes(function(app) {
    app.GET('/', function() {
      return 'live edited!';
    });
    app.GET('/zapp', function() {
      return 'added while running!';
    });
    app.GET('/foo', function() {
      return 'bar';
    });
  })));
  server.listen(3000);
}
