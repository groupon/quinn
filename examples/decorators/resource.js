'use strict';

const QUINN_FUNCTION = Symbol('QUINN_FUNCTION');

function routeDispatch(method, pathname, handler) {
  const wrapped = function(req) {
    if (req.method !== method) return;
    if (req.url !== pathname) return;
    return handler.call(this, req);
  };
  Object.assign(wrapped, { method, pathname });
  wrapped[QUINN_FUNCTION] = true;
  return wrapped;
}

function route(method, pathname) {
  return function(object, propertyName, descriptor) {
    if (descriptor === undefined && typeof object === 'function') {
      // Case 1: GET `/path` (handler)
      return routeDispatch(method, pathname, object, null);
    }
    // Case 2: @GET `/path` method() {}
    return {
      value: routeDispatch(method, pathname, descriptor.value),
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

function parseResource(resource, context) {
  if (context === undefined) context = resource;

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
      return Object.assign(value.bind(context), {
        actionName: propName,
        resourceName
      });
    })
    .concat(parseResource(Object.getPrototypeOf(resource), context));
}

export function extractHandlers(...resources) {
  const handlers = resources.map(r => parseResource(r));
  return [].concat(...handlers);
}
