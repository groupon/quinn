'use strict';

var parseUrl = require('url').parse;

var matchRoute = require('./router/compile').matchRoute;
var mod$0 = require('./context');var inRouteContext = mod$0.inRouteContext;var getFromRouteContext = mod$0.getFromRouteContext;

var HTTP_VERBS = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD' ];


  function Router(request) {
    this.$Router0 = request;
    this.$Router1 = undefined;

    this.$Router2 = parseUrl(request.url, true);

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
    var params = matchRoute(req.method, this.$Router2, method, pattern);
    if (params !== null) {
      inRouteContext( function(ctx)  {
        ctx.params = params;
        ctx.parsedUrl = this.$Router2;
        ctx.query = ctx.parsedUrl.query;
        ctx.pathname = ctx.parsedUrl.pathname;
        this.$Router1 = handler(req);
      }.bind(this));
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
