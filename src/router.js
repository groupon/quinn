'use strict';

var _ = require('lodash');

var HTTP_VERBS = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD' ];

function matchRoute(req, method, path) {
  if (req.method === method &&
      req.url === path) {
    return true;
  }
  return false;
}

class Router {
  constructor(request) {
    this._request = request;
    this._response = undefined;

    var verb, i;
    for (i = 0; i < HTTP_VERBS.length; ++i) {
      verb = HTTP_VERBS[i];
      this[verb] = this.tryRoute.bind(this, verb);
    }
  }

  getResponse() {
    return this._response;
  }

  tryRoute(method, path, handler) {
    if (this._response !== undefined) return;

    if (typeof handler !== 'function') {
      throw new Error('Expected function as handler');
    }

    var req = this._request;
    var match = matchRoute(req, method, path);
    if (match) {
      this._response = handler(req);
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
