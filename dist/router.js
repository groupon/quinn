'use strict';

var HTTP_VERBS = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD' ];

function matchRoute(req, method, path) {
  if (req.method === method &&
      req.url === path) {
    return true;
  }
  return false;
}


  function Router(request) {
    this.$Router_request = request;
    this.$Router_response = undefined;

    var verb, i;
    for (i = 0; i < HTTP_VERBS.length; ++i) {
      verb = HTTP_VERBS[i];
      this[verb] = this.tryRoute.bind(this, verb);
    }
  }

  Router.prototype.getResponse=function() {
    return this.$Router_response;
  };

  Router.prototype.tryRoute=function(method, path, handler) {
    if (this.$Router_response !== undefined) return;

    if (typeof handler !== 'function') {
      throw new Error('Expected function as handler');
    }

    var req = this.$Router_request;
    var match = matchRoute(req, method, path);
    if (match) {
      this.$Router_response = handler(req);
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
