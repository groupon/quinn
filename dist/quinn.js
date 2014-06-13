'use strict';

var STATUS_CODES = require('http').STATUS_CODES;

var Promise = require('bluebird');
var mod$0 = require('lodash');var partial = mod$0.partial;var each = mod$0.each;var clone = mod$0.clone;

var routes = require('./router').routes;
var parseRequestUrl = require('./request').parseRequestUrl;

function pipeHeaders(src, dest) {
  each(src.headers, function(header, name)  {
    dest.setHeader(name, header);
  });
}

function pipeResponse(destination, response) {
  if (response === undefined) return;

  // Send response
  destination.statusCode = response.statusCode;
  pipeHeaders(response, destination);
  destination.end(response.body);
}

function defaultErrorHandler(req, err) {
  return {
    statusCode: 500,
    body: err.stack
  };
}

function defaultFatalHandler(req, err) {
  setTimeout(function()  {
    throw err;
  });
}

module.exports = function quinn(handler, errorHandler, fatalHandler) {
  if (typeof reportError !== 'function') {
    errorHandler = defaultErrorHandler;
  }

  if (typeof fatalHandler !== 'function') {
    fatalHandler = defaultFatalHandler;
  }

  return function handleRequest(req, destination, pass) {
    var hasPass = typeof pass === 'function';
    Promise.try(parseRequestUrl, [req])
    .then(handler)
    .then(
      function(response) {
        if (response === undefined) {
          if (hasPass) {
            return pass(), undefined;
          } else {
            return NotFound(req);
          }
        } else {
          return response;
        }
      },
      function(err) {
        if (!hasPass) {
          return errorHandler(req, err);
        } else {
          return Promise.reject(err);
        }
      }
    )
    .then(applyResponseDefaults)
    .then(partial(pipeResponse, destination))
    .catch(pass)
    .catch(partial(fatalHandler, req))
    .catch(partial(defaultFatalHandler, req));
  };
}

function applyResponseDefaults(response) {
  if (response === undefined) return;

  if (typeof response === 'string') {
    response = { body: new Buffer(response, 'utf8') };
  } else if (Buffer.isBuffer(response)) {
    response = { body: response };
  } else if (typeof response === 'number') {
    response = {
      statusCode: response,
      body: new Buffer(STATUS_CODES[response], 'ascii')
    };
  }

  var body = response.body || new Buffer();
  var bodyIsStream = typeof body.pipe === 'function';
  if (!bodyIsStream && !Buffer.isBuffer(body)) {
    body = new Buffer(body, 'utf8');
  }

  var headers = response.headers ? clone(response.headers) : {};
  var statusCode = response.statusCode || 200;

  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'text/plain';
  }

  if (!bodyIsStream && !headers['Content-Length']) {
    headers['Content-Length'] = body.length;
  }

  return {
    statusCode: statusCode,
    headers: headers,
    body: body
  };
} module.exports.applyResponseDefaults = applyResponseDefaults;

function NotFound(req) {
  return {
    statusCode: 404,
    body: 'Cannot ' + req.method + ' ' + req.url
  };
} module.exports.NotFound = NotFound;

module.exports.routes = routes;
