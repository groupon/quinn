'use strict';

import {STATUS_CODES} from 'http';

import QuinnResponse from './response';
import {JSONBody, BufferBody} from './body';

function respond(props) {
  if (props === undefined) {
    return;
  } else if (props instanceof QuinnResponse) {
    return props;
  } else if (Buffer.isBuffer(props)) {
    return new QuinnResponse({ body: props });
  } else if (typeof props === 'number') {
    return new QuinnResponse({
      statusCode: props,
      body: STATUS_CODES[props]
    });
  } else if (typeof props === 'object' && props !== null){
    return new QuinnResponse(props);
  } else {
    return new QuinnResponse({ body: props });
  }
}

export default respond;

export {JSONBody, BufferBody};

export function json(data) {
  if (data === undefined)
    return;

  return respond({
    body: new JSONBody(data),
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export function text(data) {
  if (data === undefined)
    return;

  return respond({
    body: new BufferBody(data),
    headers: {
      'Content-Type': 'text/plain; charset=utf8'
    }
  });
}

/**
 * Helpers: status code
 *
 * This is not complete but should cover the most common response codes.
 * If someone needs more, writing .status(418) shouldn't be too much to ask.
 */

/* 20x */
export function ok(props) {
  return respond(props).status(200);
}

export function created(props) {
  return respond(props).status(201);
}

export function accepted(props) {
  return respond(props).status(202);
}

/* 30x */
export function movedPermanently(props) {
  return respond(props).status(301);
}

export function found(props) {
  return respond(props).status(302);
}

export function redirect(location, code) {
  return respond('')
    .header('Location', location)
    .status(code || 302);
}

/* 40x */
export function badRequest(props) {
  return respond(props).status(400);
}

export function unauthorized(props) {
  return respond(props).status(401);
}

export function forbidden(props) {
  return respond(props).status(403);
}

export function notFound(props) {
  return respond(props).status(404);
}

/* 50x */
export function internalServerError(props) {
  return respond(props).status(500);
}

export function notImplemented(props) {
  return respond(props).status(501);
}

export function badGateway(props) {
  return respond(props).status(502);
}

export function serviceUnavailable(props) {
  return respond(props).status(503);
}

export function gatewayTimeout(props) {
  return respond(props).status(504);
}
