
import { parse as parseUrl } from 'url';

export function parseRequestUrl(req, next) {
  var patchedReq = req;

  var parsed = req.parsedUrl = parseUrl(req.url, true);
  req.pathname = parsed.pathname;
  req.query = parsed.query;

  return next(patchedReq);
}
