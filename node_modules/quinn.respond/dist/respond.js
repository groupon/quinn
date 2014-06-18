'use strict';

var STATUS_CODES = require('http').STATUS_CODES;

var QuinnResponse = require('./response');
var mod$0 = require('./body');var JSONBody = mod$0.JSONBody;var BufferBody = mod$0.BufferBody;

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

module.exports = respond;

module.exports.JSONBody = JSONBody;module.exports.BufferBody = BufferBody;

function json(data) {
  if (data === undefined)
    return;

  return respond({
    body: new JSONBody(data),
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
} module.exports.json = json;

function text(data) {
  if (data === undefined)
    return;

  return respond({
    body: new BufferBody(data),
    headers: {
      'Content-Type': 'text/plain; charset=utf8'
    }
  });
} module.exports.text = text;

/**
 * Helpers: status code
 *
 * This is not complete but should cover the most common response codes.
 * If someone needs more, writing .status(418) shouldn't be too much to ask.
 */

/* 20x */
function ok(props) {
  return respond(props).status(200);
} module.exports.ok = ok;

function created(props) {
  return respond(props).status(201);
} module.exports.created = created;

function accepted(props) {
  return respond(props).status(202);
} module.exports.accepted = accepted;

/* 30x */
function movedPermanently(props) {
  return respond(props).status(301);
} module.exports.movedPermanently = movedPermanently;

function found(props) {
  return respond(props).status(302);
} module.exports.found = found;

function redirect(location, code) {
  return respond('')
    .header('Location', location)
    .status(code || 302);
} module.exports.redirect = redirect;

/* 40x */
function badRequest(props) {
  return respond(props).status(400);
} module.exports.badRequest = badRequest;

function unauthorized(props) {
  return respond(props).status(401);
} module.exports.unauthorized = unauthorized;

function forbidden(props) {
  return respond(props).status(403);
} module.exports.forbidden = forbidden;

function notFound(props) {
  return respond(props).status(404);
} module.exports.notFound = notFound;

/* 50x */
function internalServerError(props) {
  return respond(props).status(500);
} module.exports.internalServerError = internalServerError;

function notImplemented(props) {
  return respond(props).status(501);
} module.exports.notImplemented = notImplemented;

function badGateway(props) {
  return respond(props).status(502);
} module.exports.badGateway = badGateway;

function serviceUnavailable(props) {
  return respond(props).status(503);
} module.exports.serviceUnavailable = serviceUnavailable;

function gatewayTimeout(props) {
  return respond(props).status(504);
} module.exports.gatewayTimeout = gatewayTimeout;
