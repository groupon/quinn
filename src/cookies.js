'use strict';

import {
  parse as parseCookies,
  serialize as serializeCookie
} from 'cookie';

export function getCookie(req, name) {
  var cookieHeader = req.headers.cookie;
  if (!req._parsedCookies) {
    req._parsedCookies = (
      typeof cookieHeader !== 'string' ? {}
      : parseCookies(req.headers.cookie)
    );
  }
  var cookies = req._parsedCookies;
  return cookies[name];
}

export function setCookie(res, name, value, opts) {
  return res.addHeader('Set-Cookie', serializeCookie(name, value, opts));
}

export function setCookies(res, cookieMap) {
  return cookieMap, res;
}
