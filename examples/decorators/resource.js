'use strict';

const QUINN_FUNCTION = Symbol('QUINN_FUNCTION');

function routeDispatch(method, pathname, handler) {
  const wrapped = function(req) {
    if (req.method !== method) return;
    if (req.url !== pathname) return;
    return handler(req);
  };
  wrapped[QUINN_FUNCTION] = true;
  return wrapped;
}

function route(method, pathname) {
  return function(object, propertyName, descriptor) {
    if (descriptor === undefined && typeof object === 'function') {
      // Case 1: GET `/path` (handler)
      return routeDispatch(method, pathname, object);
    }
    // Case 2: @GET `/path` method() {}
    const wrapped = routeDispatch(method, pathname, descriptor.value);
    Object.assign(wrapped, { method, pathname });
    return {
      value: wrapped,
      enumerable: descriptor.enumerable,
      configurable: descriptor.configurable,
      writable: descriptor.writable
    };
  }
}

export function GET([ pathname ]) {
  return route('GET', pathname);
}

export function PUT([ pathname ]) {
  return route('PUT', pathname);
}

function parseResource(resource) {
  const resourceName =
    (typeof resource.name === 'string' && resource.name) ||
    (resource.constructor && resource.constructor.name) || 'Unknown';

  if (resource === null || resource === Object.prototype) { return []; }
  return Object.getOwnPropertyNames(resource)
    .map(function(propName) {
      const descriptor = Object.getOwnPropertyDescriptor(resource, propName);
      return { propName, descriptor };
    })
    .filter(function({ descriptor }) {
      return !!descriptor &&
        typeof descriptor.value === 'function' &&
        descriptor.value[QUINN_FUNCTION] === true;
    })
    .map(function({ descriptor: { value }, propName }) {
      return Object.assign(value, { resourceName, actionName: propName });
    })
    .concat(parseResource(Object.getPrototypeOf(resource)));
}

export function extractHandlers(...resources) {
  const handlers = resources.map(parseResource);
  return [].concat(...handlers);
}
