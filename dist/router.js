'use strict';

var matchRoute = require('./router/compile').matchRoute;

var HTTP_VERBS = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD' ];


  function Router(request) {
    this.$Router0 = request;
    this.$Router1 = undefined;

    var verb, i;
    for (i = 0; i < HTTP_VERBS.length; ++i) {
      verb = HTTP_VERBS[i];
      this[verb] = this.tryRoute.bind(this, verb);
    }
  }

  Router.prototype.getResponse=function() {
    return this.$Router1;
  };

  Router.prototype.tryRoute=function(method, pattern, handler) {
    if (this.$Router1 !== undefined) return;

    if (typeof handler !== 'function') {
      throw new Error('Expected function as handler');
    }

    var req = this.$Router0;
    var matchedReq = matchRoute(req, method, pattern);
    if (matchedReq !== null) {
      this.$Router1 = handler(matchedReq);
    }
    return this;
  };


function routes(routeDef) {
  return function(req) {
    var router = new Router(req);
    routeDef(router);
    return router.getResponse();
  };
} module.exports.routes = routes;
