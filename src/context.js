'use strict';

import {createNamespace} from 'continuation-local-storage';

var requestContextNS = createNamespace('quinn:requestContext');
var routeContextNS = createNamespace('quinn:routeContext');

export function getRequestContextNS() {
  return requestContextNS;
}

export function getFromRequestContext(key) {
  return requestContextNS.get(key);
}

export function setInRequestContext(key, value) {
  return requestContextNS.set(key, value);
}

export function inRouteContext(fn) {
  return routeContextNS.run(fn);
}

export function setInRouteContext(key, value) {
  return routeContextNS.set(key, value);
}

export function getFromRouteContext(key) {
  return routeContextNS.get(key);
}
