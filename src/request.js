'use strict';

import { parse as parseUrl } from 'url';

export function parseRequestUrl(req) {
  var patchedReq = req;

  var parsed = patchedReq.parsedUrl = parseUrl(req.url, true);
  patchedReq.pathname = parsed.pathname;
  patchedReq.query = parsed.query;

  return patchedReq;
}
