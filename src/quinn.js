'use strict';

import {STATUS_CODES} from 'http';

import default as Promise from 'bluebird';
import {partial} from 'lodash';

import {routes} from './router';

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

function PlainText(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': body.length
    },
    body: body
  };
}

function pipeHeaders(src, dest) {
  var key;
  for (key in src.headers) {
    dest.setHeader(key, src.headers[key]);
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
  console.error('[%s] %s %s\n%s',
    new Date().toISOString(), req.method, req.url, err.stack
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
    .then(partial(pipeResponse, req, destination, pass))
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
  return inner(req).then(partial(addCookie, 'sid', 'my-value'));
}

export default quinn;
export {routes as routes};
