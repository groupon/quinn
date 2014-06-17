'use strict';

var mod$0 = require('lodash');var memoize = mod$0.memoize;var isRegExp = mod$0.isRegExp;

var RESERVED_CHARACTER = /([.?*+^$[\]\\(){}-])/g;
var ROUTE_SEGMENT = /((\{[a-z_$][a-z0-9_$]*\})|[*.+()])/ig;

function escapeRegExp(symbol) {
  return String(symbol).replace(RESERVED_CHARACTER, '\\$1');
}

/**
 * Compiles the given route pattern into a RegExp that can be used to match
 * it. The route may contain named keys in the form of a valid JavaScript
 * identifier wrapped in curlies (e.g. "{name}", "{_name}", or "{$name}" are all
 * valid keys). If it does, these keys will be added to the given keys array.
 *
 * If the route contains the special "*" symbol, it will automatically create a
 * key named "splat" and will substituted with a "(.*?)" pattern in the
 * resulting RegExp.
 */
function _compileRoute(pattern) {
  var segments = [];
  var regexp;

  if (isRegExp(pattern)) {
    regexp = pattern;
  } else {
    var regExpPattern = pattern.replace(ROUTE_SEGMENT, function(m)  {
      if (m === '*') {
        segments.push('splat');
        return '(.*?)';
      } else if (m === '.' || m === '+' || m === '(' || m === ')') {
        return escapeRegExp(m);
      } else {
        segments.push(m.substr(1, m.length - 2));
        return '([^./?#]+)';
      }
    });

    regexp = new RegExp('^' + regExpPattern + '$');
  }

  return function(pathname) {
    var match = pathname.match(regexp);
    if (match === null) return null;
    var pathParams = {};
    segments.forEach( function(name, idx)  {
      pathParams[name] = match[idx + 1];
    });
    return pathParams;
  };
} module.exports._compileRoute = _compileRoute;

var compileRoute = memoize(_compileRoute);

function matchRoute(reqMethod, parsedUrl, method, pattern) {
  if (method !== 'ALL' && reqMethod !== method) {
    return null;
  }

  var params = compileRoute(pattern)(parsedUrl.pathname);
  if (params !== null) {
    return params;
  }
  return null;
} module.exports.matchRoute = matchRoute;
