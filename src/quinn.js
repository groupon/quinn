'use strict';

import Promise from 'bluebird';
import {partial} from 'lodash';

import respond from 'quinn-respond';

import {getRequestContextNS} from './context';

function pipeTo(target, src) {
  if (src === undefined) return;
  src.pipe(target);
  return src;
}

function defaultErrorHandler(req, err) {
  if (err) {
    return ServerError(err.stack);
  } else {
    return NotFound(`Cannot ${req.method} ${req.url}\n`);
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
  if (typeof errorHandler !== 'function') {
    errorHandler = undefined;
  }

  if (typeof fatalHandler !== 'function') {
    fatalHandler = defaultFatalHandler;
  }

  return getRequestContextNS().bind(function handleRequest(req, res, pass) {
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

    Promise.try(handler, [req])
    .then(
      gracefulRespond,
      gracefulError
    )
    .then(respond)
    .then(r => r.resolved())
    .then(partial(pipeTo, res))
    .then(forward, pass)
    .catch(partial(fatalHandler, req))
    .catch(partial(defaultFatalHandler, req));
  });
}

export function ServerError(props) {
  return respond(props).status(500);
}

export function NotFound(props) {
  return respond(props).status(404);
}
