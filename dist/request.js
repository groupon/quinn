'use strict';

var parseUrl = require('url').parse;

function parseRequestUrl(req) {
  var patchedReq = req;

  var parsed = patchedReq.parsedUrl = parseUrl(req.url, true);
  patchedReq.pathname = parsed.pathname;
  patchedReq.query = parsed.query;

  return patchedReq;
} module.exports.parseRequestUrl = parseRequestUrl;
