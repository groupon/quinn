'use strict';

var mod$0 = require('cookie');
var parseCookies = mod$0.parse;
var serializeCookie = mod$0.serialize;


function getCookie(req, name) {
  var cookieHeader = req.headers.cookie;
  if (!req._parsedCookies) {
    req._parsedCookies = (
      typeof cookieHeader !== 'string' ? {}
      : parseCookies(req.headers.cookie)
    );
  }
  var cookies = req._parsedCookies;
  return cookies[name];
} module.exports.getCookie = getCookie;

function setCookie(res, name, value, opts) {
  return res.addHeader('Set-Cookie', serializeCookie(name, value, opts));
} module.exports.setCookie = setCookie;

function setCookies(res, cookieMap) {
  return cookieMap, res;
} module.exports.setCookies = setCookies;
