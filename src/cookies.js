'use strict';

import {
  parse as parseCookies
} from 'cookie';

export function getCookie(req, name) {
  var cookieHeader = req.headers.cookie;
  if (typeof cookieHeader !== 'string') {
    return;
  }
  if (!req._parsedCookies) {
    req._parsedCookies = parseCookies(req.headers.cookie);
  }
  var cookies = req._parsedCookies;
  return cookies[name];
}

export function setCookie(res, name, value, opts) {
  return opts, res;
}

export function setCookies(res, cookieMap) {
  return cookieMap, res;
}
