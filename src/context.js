'use strict';

import {createNamespace} from 'continuation-local-storage';

var requestContextNS = createNamespace('quinn:requestContext');

export function getRequestContextNS() {
  return requestContextNS;
}

export function getFromRequestContext(key) {
  return requestContextNS.get(key);
}

export function setInRequestContext(key, value) {
  return requestContextNS.set(key, value);
}

export function lazyCalcForRequest(key, fn, req) {
  var value = getFromRequestContext(key);
  if (value === undefined) {
    setInRequestContext(key, value = fn(req));
  }
  return value;
}
