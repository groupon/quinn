'use strict';

var createNamespace = require('continuation-local-storage').createNamespace;

var requestContextNS = createNamespace('quinn:requestContext');

function getRequestContextNS() {
  return requestContextNS;
} module.exports.getRequestContextNS = getRequestContextNS;

function getFromRequestContext(key) {
  return requestContextNS.get(key);
} module.exports.getFromRequestContext = getFromRequestContext;

function setInRequestContext(key, value) {
  return requestContextNS.set(key, value);
} module.exports.setInRequestContext = setInRequestContext;
