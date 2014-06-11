'use strict';

var STATUS_CODES = require('http').STATUS_CODES;

var Promise = require('bluebird');
var mod$0 = require('lodash');var partial = mod$0.partial;var each = mod$0.each;

var routes = require('./router').routes;
var parseRequestUrl = require('./request').parseRequestUrl;

function pipeHeaders(src, dest) {
  each(src.headers, function(header, name)  {
    dest.setHeader(name, header);
  });
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
    response = PlainText(200, new Buffer(response, 'utf8'));
  } else if (typeof response === 'number') {
    response = PlainText(response, new Buffer(
      STATUS_CODES[response],
      'utf8'
    ));
  }
  destination.statusCode = response.statusCode;
  pipeHeaders(response, destination);
  destination.end(response.body);
}

function defaultErrorHandler(req, err) {
  return ServerError(req, err.stack);
}

module.exports = function quinn(handler, errorHandler) {
  if (typeof reportError !== 'function') {
    errorHandler = defaultErrorHandler;
  }

  return function handleRequest(req, destination, pass) {
    Promise.try(partial(parseRequestUrl, req, handler))
    .catch(function(err) {
      if (typeof pass !== 'function') {
        return errorHandler(req, err);
      }
      return Promise.reject(err);
    })
    .then(partial(pipeResponse, req, destination, pass))
    .catch(pass)
    .nodeify(function(err) {
      if (err) throw err;
    });
  };
}

function PlainText(statusCode, body) {
  if (!Buffer.isBuffer(body)) {
    body = new Buffer(body);
  }

  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': body.length
    },
    body: body
  };
} module.exports.PlainText = PlainText;

function NotFound(req) {
  return PlainText(
    404, 'Cannot ' + req.method + ' ' + req.url
  );
} module.exports.NotFound = NotFound;

function ServerError(req, body) {
  return PlainText(
    500, body
  );
} module.exports.ServerError = ServerError;

module.exports.routes = routes;
