'use strict';

import {STATUS_CODES} from 'http';

import default as Promise from 'bluebird';
import {partial} from 'lodash';

import {routes} from './router';

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

export default function quinn(handler, errorHandler) {
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

export function PlainText(statusCode, body) {
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
}

export function NotFound(req) {
  return PlainText(
    404, 'Cannot ' + req.method + ' ' + req.url
  );
}

export function ServerError(req, body) {
  return PlainText(
    500, body
  );
}

export {routes};
