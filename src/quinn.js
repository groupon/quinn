'use strict';

import Promise from 'bluebird';
import {partial} from 'lodash';

import {routes} from './router';
import {parseRequestUrl} from './request';
import {toResponse} from './response';

function pipeTo(target, src) {
  if (src === undefined) return;
  src.pipe(target);
  return src;
}

function defaultErrorHandler(req, err) {
  if (err) {
    return ServerError(err.stack);
  } else {
    return NotFound('Cannot ' + req.method + ' ' + req.url + '\n');
  }
}

function defaultFatalHandler(req, err) {
  setTimeout(() => {
    throw err;
  });
}

function callIfUndefined(fn, value) {
  if (value === undefined) {
    return fn();
  } else {
    return value;
  }
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
    var gracefulError = (
      (errorHandler && partial(errorHandler, req)) ||
      (!hasPass && partial(defaultErrorHandler, req)) ||
      undefined
    );

    var gracefulRespond = (
      (gracefulError && partial(callIfUndefined, gracefulError)) ||
      undefined
    );

    var forward = (
      (hasPass && partial(callIfUndefined, pass)) ||
      undefined
    );

    Promise.try(parseRequestUrl, [req])
    .then(handler)
    .then(
      gracefulRespond,
      gracefulError
    )
    .then(toResponse)
    .then(r => r.resolved())
    .then(partial(pipeTo, destination))
    .then(forward, pass)
    .catch(partial(fatalHandler, req))
    .catch(partial(defaultFatalHandler, req));
  };
}

export {toResponse};

export function ServerError(props) {
  return toResponse(props).status(500);
}

export function NotFound(props) {
  return toResponse(props).status(404);
}

export {routes};
