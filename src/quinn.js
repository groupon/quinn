'use strict';

import {STATUS_CODES} from 'http';

import Promise from 'bluebird';
import {partial, each, clone} from 'lodash';

import {routes} from './router';
import {parseRequestUrl} from './request';

function pipeHeaders(src, dest) {
  each(src.headers, (header, name) => {
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
  setTimeout(() => {
    throw err;
  });
}

export default function quinn(handler, errorHandler, fatalHandler) {
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

export function applyResponseDefaults(response) {
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
}

export function NotFound(req) {
  return {
    statusCode: 404,
    body: 'Cannot ' + req.method + ' ' + req.url
  };
}

export {routes};
