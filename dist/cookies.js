'use strict';

var mod$0 = require('cookie');
var parseCookies = mod$0.parse;
var serializeCookie = mod$0.serialize;

var partial = require('lodash').partial;

var lazyCalcForRequest = require('./context').lazyCalcForRequest;

function _getCookies(req) {
  var cookieHeader = req.headers.cookie;
  return (
    typeof cookieHeader !== 'string' ? {}
    : parseCookies(req.headers.cookie)
  );
}

var getCookies = partial(lazyCalcForRequest, 'cookies', _getCookies);

module.exports.getCookies = getCookies;

function getCookie(req, name) {
  var cookies = getCookies(req);
  return cookies[name];
} module.exports.getCookie = getCookie;

function setCookie(res, name, value, opts) {
  return res.addHeader('Set-Cookie', serializeCookie(name, value, opts));
} module.exports.setCookie = setCookie;

function setCookies(res, cookieMap) {
  return cookieMap, res;
} module.exports.setCookies = setCookies;
