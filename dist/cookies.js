'use strict';


var parseCookies = require('cookie').parse;


function getCookie(req, name) {
  var cookieHeader = req.headers.cookie;
  if (typeof cookieHeader !== 'string') {
    return;
  }
  if (!req._parsedCookies) {
    req._parsedCookies = parseCookies(req.headers.cookie);
  }
  var cookies = req._parsedCookies;
  return cookies[name];
} module.exports.getCookie = getCookie;

function setCookie(res, name, value, opts) {
  return res;
} module.exports.setCookie = setCookie;

function setCookies(res, cookieMap) {
  return res;
} module.exports.setCookies = setCookies;
