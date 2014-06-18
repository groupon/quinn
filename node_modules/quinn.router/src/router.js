'use strict';

import { parse as parseUrl } from 'url';
import { METHODS } from 'http';

// Not all node versions supports this
if (METHODS === undefined) METHODS = require('./methods');

import Bluebird from 'bluebird';
import {partial} from 'lodash';
import resolveDeep from 'resolve-deep';

import {matchRoute} from './compile';

function defaultParamsParser(req, parsedUrl, pathParams) {
  return pathParams;
}

class Router {
  constructor(request) {
    this._request = request;
    this._response = undefined;

    this._parsedUrl = parseUrl(request.url, true);

    var verb, i;
    for (i = 0; i < METHODS.length; ++i) {
      verb = METHODS[i];
      this[verb] = this.tryRoute.bind(this, verb);
    }
  }

  getResponse() {
    return this._response;
  }

  tryRoute(method, pattern, handler, paramsParser) {
    if (this._response !== undefined) return;

    if (typeof handler !== 'function') {
      throw new Error('Expected function as handler');
    }

    if (paramsParser === undefined) paramsParser = defaultParamsParser;
    if (typeof paramsParser !== 'function') {
      throw new Error('Expected function as paramsParser');
    }

    var req = this._request;
    var pathParams = matchRoute(req.method, this._parsedUrl, method, pattern);
    if (pathParams !== null) {
      var params = Bluebird.try(
        paramsParser, [ req, this._parsedUrl, pathParams ]);

      this._response = resolveDeep(params).then(partial(handler, req));
    }
    return this;
  }
}

export function route(routeDef) {
  return function(req) {
    var router = new Router(req);
    routeDef(router);
    return router.getResponse();
  };
}
