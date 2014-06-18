'use strict';

var parseUrl = require('url').parse;
var METHODS = require('http').METHODS;

// Not all node versions supports this
if (METHODS === undefined) METHODS = require('./methods');

var Bluebird = require('bluebird');
var partial = require('lodash').partial;
var resolveDeep = require('resolve-deep');

var matchRoute = require('./compile').matchRoute;

function defaultParamsParser(req, parsedUrl, pathParams) {
  return pathParams;
}


  function Router(request) {
    this.$Router0 = request;
    this.$Router1 = undefined;

    this.$Router2 = parseUrl(request.url, true);

    var verb, i;
    for (i = 0; i < METHODS.length; ++i) {
      verb = METHODS[i];
      this[verb] = this.tryRoute.bind(this, verb);
    }
  }

  Router.prototype.getResponse=function() {
    return this.$Router1;
  };

  Router.prototype.tryRoute=function(method, pattern, handler, paramsParser) {
    if (this.$Router1 !== undefined) return;

    if (typeof handler !== 'function') {
      throw new Error('Expected function as handler');
    }

    if (paramsParser === undefined) paramsParser = defaultParamsParser;
    if (typeof paramsParser !== 'function') {
      throw new Error('Expected function as paramsParser');
    }

    var req = this.$Router0;
    var pathParams = matchRoute(req.method, this.$Router2, method, pattern);
    if (pathParams !== null) {
      var params = Bluebird.try(
        paramsParser, [ req, this.$Router2, pathParams ]);

      this.$Router1 = resolveDeep(params).then(partial(handler, req));
    }
    return this;
  };


function route(routeDef) {
  return function(req) {
    var router = new Router(req);
    routeDef(router);
    return router.getResponse();
  };
} module.exports.route = route;
