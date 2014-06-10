'use strict';

var http = require('http');

var Promise = require('bluebird');
var _ = require('lodash');

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

function ServerError(req, body) {
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'text/plain' },
    body: body
  }
}

function pipeResponse(req, destination, pass, response) {
  if (response === undefined) {
    if (typeof pass === 'function') {
      pass();
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
  destination.statusCode = response.statusCode;
  for (var key in response.headers) {
    destination.setHeader(key, response.headers[key]);
  }
  destination.end(response.body);
}

function defaultErrorHandler(req, err) {
  console.error('[%s] %s %s\n%s',
    Date.now().toISOString(), req.method, req.url, err.stack
  );
  return ServerError(req, err.stack);
}

function quinn(handler, errorHandler) {
  if (typeof reportError !== 'function') {
    errorHandler = defaultErrorHandler;
  }

  return function handleRequest(req, destination, pass) {
    Promise.try(handler, [req])
    .catch(function(err) {
      if (typeof pass !== 'function') {
        return errorHandler(req, err);
      }
      return Promise.reject(err);
    })
    .then(_.partial(pipeResponse, req, destination, pass))
    .catch(pass)
    .nodeify(function(err) {
      if (err) throw err;
    });
  };
}

function addCookie(name, value, opts, response) {
  response.headers['Cookie'].push('foo!');
  return response;
}

function sessionMiddleware(inner, req) {
  return inner(req).then(_.partial(addCookie, 'sid', 'my-value'));
}

module.exports = quinn;
quinn.routes = routes;
