'use strict';

import {
  parse as parseCookies,
  serialize as serializeCookie
} from 'cookie';
import {partial} from 'lodash';

import {lazyCalcForRequest} from './context';

function _getCookies(req) {
  var cookieHeader = req.headers.cookie;
  return (
    typeof cookieHeader !== 'string' ? {}
    : parseCookies(req.headers.cookie)
  );
}

var getCookies = partial(lazyCalcForRequest, 'cookies', _getCookies);

export {getCookies};

export function getCookie(req, name) {
  var cookies = getCookies(req);
  return cookies[name];
}

export function setCookie(res, name, value, opts) {
  return res.addHeader('Set-Cookie', serializeCookie(name, value, opts));
}

export function setCookies(res, cookieMap) {
  return cookieMap, res;
}
