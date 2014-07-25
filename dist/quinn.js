'use strict';

var partial = require('lodash').partial;
var resolveDeep = require('resolve-deep');
var Debug = require('debug');
var Bluebird = require('bluebird');

var respond = require('quinn-respond');

var getRequestContextNS = require('./context').getRequestContextNS;

var debug = Debug('quinn:core');

function pipeTo(target, src) {
  if (src === undefined) return;

  return new Bluebird(function(resolve, reject) {
    src.on('error', reject);

    src.on('end', resolve);

    src.pipe(target);
  });
}

function defaultErrorHandler(req, err) {
  return err ?
    respond.text(err.stack).status(500) :
    respond.text(("Cannot " + req.method + " " + req.url + "\n")).status(404);
}

function defaultFatalHandler(req, res, err) {
  res.statusCode = 500;
  try {
    res.end('Internal server error');
  } catch (writeErr) {
  }
}

function applyDefaults(res) {
  if (!res.hasHeader('Content-Type')) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  }
  return res;
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
    .then(applyDefaults)
    .then(partial(pipeTo, res))
    .catch(partial(fatalHandler, req, res))
    .catch(partial(defaultFatalHandler, req, res));
  });
}
quinn.version = require('../package.json').version;
module.exports = quinn;

function runRequestHandlerRaw(handler, req, params) {
  return resolveDeep(params).then(partial(handler, req));
} module.exports.runRequestHandlerRaw = runRequestHandlerRaw;

function runRequestHandler(handler, req, params) {
  return runRequestHandlerRaw(handler, req, params)
    .then(respond);
} module.exports.runRequestHandler = runRequestHandler;

function allValidHandlers(handlerArray) {
  if (handlerArray.length < 1) {
    return false;
  }
  return handlerArray.every(function(handler) {
    return typeof handler === 'function';
  });
}

function firstHandler() {
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
} module.exports.firstHandler = firstHandler;
