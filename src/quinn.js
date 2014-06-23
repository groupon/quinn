'use strict';

import {partial} from 'lodash';
import resolveDeep from 'resolve-deep';
import Debug from 'debug';
import Bluebird from 'bluebird';

import respond from 'quinn-respond';
import {notFound, internalServerError} from 'quinn-respond';

import {getRequestContextNS} from './context';

var debug = Debug('quinn:core');

function pipeTo(target, src) {
  if (src === undefined) return;
  src.pipe(target);
  return src;
}

function defaultErrorHandler(req, err) {
  return err ?
    internalServerError(err.stack) :
    notFound(`Cannot ${req.method} ${req.url}\n`);
}

function defaultFatalHandler(req, err) {
  setTimeout(() => { throw err; });
}

function quinn(handler, errorHandler, fatalHandler) {
  debug('init');
  if (typeof errorHandler !== 'function') {
    errorHandler = undefined;
  }

  if (typeof fatalHandler !== 'function') {
    fatalHandler = defaultFatalHandler;
  }

  return getRequestContextNS().bind(function handleRequest(req, res) {
    var url = req.url;
    debug('handleRequest', url);

    var gracefulError = (
      (errorHandler && partial(errorHandler, req)) ||
      partial(defaultErrorHandler, req)
    );

    function gracefulRespond(res) {
      debug('found? %j', res !== undefined, url);
      return res === undefined ? gracefulError() : res;
    }

    runRequestHandlerRaw(handler, req, {})
    .then(gracefulRespond, gracefulError)
    .then(respond)
    .then(r => r.resolved())
    .then(partial(pipeTo, res))
    .catch(partial(fatalHandler, req))
    .catch(partial(defaultFatalHandler, req));
  });
}
quinn.version = require('../package.json').version;
export default quinn;

export function runRequestHandlerRaw(handler, req, params) {
  return resolveDeep(params).then(partial(handler, req));
}

export function runRequestHandler(handler, req, params) {
  return runRequestHandlerRaw(handler, req, params)
    .then(respond);
}

function allValidHandlers(handlerArray) {
  if (handlerArray.length < 1) {
    return false;
  }
  return handlerArray.every(function(handler) {
    return typeof handler === 'function';
  });
}

export function firstHandler() {
  var handlers = Array.prototype.slice.call(arguments);

  if (!allValidHandlers(handlers)) {
    var err = new Error('Usage: firstHandler(handler1, handler2, ...)');
    return function() {
      return Bluebird.reject(err);
    };
  }

  function _tryFirst(idx, req, params) {
    var handler = handlers[idx];
    ++idx;
    return Bluebird.try(handler, [req, params])
      .then(function(res) {
        if (res === undefined && idx < handlers.length) {
          return _tryFirst(idx, req, params);
        } else {
          return res;
        }
      });
  }

  return function(req, params) {
    return _tryFirst(0, req, params);
  };
}
