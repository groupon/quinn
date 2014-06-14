'use strict';

var createNamespace = require('continuation-local-storage').createNamespace;

var requestContextNS = createNamespace('quinn:requestContext');
var routeContextNS = createNamespace('quinn:routeContext');

function getRequestContextNS() {
  return requestContextNS;
} module.exports.getRequestContextNS = getRequestContextNS;

function getFromRequestContext(key) {
  return requestContextNS.get(key);
} module.exports.getFromRequestContext = getFromRequestContext;

function setInRequestContext(key, value) {
  return requestContextNS.set(key, value);
} module.exports.setInRequestContext = setInRequestContext;

function inRouteContext(fn) {
  return routeContextNS.run(fn);
} module.exports.inRouteContext = inRouteContext;

function setInRouteContext(key, value) {
  return routeContextNS.set(key, value);
} module.exports.setInRouteContext = setInRouteContext;

function getFromRouteContext(key) {
  return routeContextNS.get(key);
} module.exports.getFromRouteContext = getFromRouteContext;
