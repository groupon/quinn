'use strict';

import { parse as parseUrl } from 'url';

import {matchRoute} from './router/compile';
import {inRouteContext, getFromRouteContext} from './context';

var HTTP_VERBS = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD' ];

class Router {
  constructor(request) {
    this._request = request;
    this._response = undefined;

    this._parsedUrl = parseUrl(request.url, true);

    var verb, i;
    for (i = 0; i < HTTP_VERBS.length; ++i) {
      verb = HTTP_VERBS[i];
      this[verb] = this.tryRoute.bind(this, verb);
    }
  }

  getResponse() {
    return this._response;
  }

  tryRoute(method, pattern, handler) {
    if (this._response !== undefined) return;

    if (typeof handler !== 'function') {
      throw new Error('Expected function as handler');
    }

    var req = this._request;
    var params = matchRoute(req.method, this._parsedUrl, method, pattern);
    if (params !== null) {
      inRouteContext( ctx => {
        ctx.params = params;
        ctx.parsedUrl = this._parsedUrl;
        ctx.query = ctx.parsedUrl.query;
        ctx.pathname = ctx.parsedUrl.pathname;
        this._response = handler(req);
      });
    }
    return this;
  }
}

export function routes(routeDef) {
  return function(req) {
    var router = new Router(req);
    routeDef(router);
    return router.getResponse();
  };
}

routes.getQuery = function(name) {
  var query = getFromRouteContext('query');
  if (name === undefined) return query;
  return query[name];
};

routes.getParam = function(name) {
  var params = getFromRouteContext('params');
  if (name === undefined) return params;
  return params[name];
};

routes.getParams = routes.getParam;
