
var parseUrl = require('url').parse;

function parseRequestUrl(req, next) {
  var patchedReq = req;

  var parsed = req.parsedUrl = parseUrl(req.url, true);
  req.pathname = parsed.pathname;
  req.query = parsed.query;

  return next(patchedReq);
} module.exports.parseRequestUrl = parseRequestUrl;
