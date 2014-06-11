'use strict';

import {matchRoute} from './router/compile';

var HTTP_VERBS = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD' ];

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

  tryRoute(method, pattern, handler) {
    if (this._response !== undefined) return;

    if (typeof handler !== 'function') {
      throw new Error('Expected function as handler');
    }

    var req = this._request;
    var matchedReq = matchRoute(req, method, pattern);
    if (matchedReq !== null) {
      this._response = handler(matchedReq);
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
