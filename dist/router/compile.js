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
  var properties = {};
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

  segments.forEach( function(name, idx)  {
    properties[name] = {
      get: function() {
        return this[idx + 1];
      }
    };
  }.bind(this));

  return function(pathname) {
    var match = pathname.match(regexp);
    if (match === null) return null;
    return Object.create(match, properties);
  };
} module.exports._compileRoute = _compileRoute;

var compileRoute = memoize(_compileRoute);

function matchRoute(req, method, pattern) {
  if (method !== 'ALL' && req.method !== method) {
    return null;
  }

  var params = compileRoute(pattern)(req.pathname);
  if (params !== null) {
    return Object.create(req, { params: { value: params } });
  }
  return null;
} module.exports.matchRoute = matchRoute;
