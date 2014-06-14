'use strict';

import caseless from 'caseless';
import {all, resolve, join} from 'bluebird';
import {zipObject, each, isObject} from 'lodash';
import {toStream} from './body';

function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

function concatHeaders(old, newValue) {
  if (old === undefined) {
    return toArray(newValue);
  }
  return toArray(old).concat(toArray(newValue));
}

function resolvedHeaders(headers) {
  var headerKeys = Object.keys(headers);
  var values = headerKeys.map( key => headers[key] );
  return all(values).then( resolvedValues =>
    zipObject(headerKeys, resolvedValues)
  );
}

class QuinnResponse {
  constructor(props, isResolved) {
    this.statusCode = props.statusCode || 200;
    this.headers = caseless(props.headers || {});
    this.body = props.body || null; // null === empty body

    this._isResolved = !!isResolved;
  }

  resolved() {
    if (this._isResolved) return resolve(this);
    return this.resolvedBody().then( body => {
      if (!this.hasHeader('Content-Type'))
        this.header('Content-Type', 'text/plain; charset=utf-8');

      if (typeof body.getByteSize === 'function') {
        this.header('Content-Length', body.getByteSize());
      } else {
        // TODO: Handle content-length for other kinds of streams..?
      }

      if (isObject(body.headers)) {
        // TODO: Assume this is an attempt to pipe through in incoming response
        // Important: exclude Host, Content-Length, and other dangerous headers
      }

      if (typeof body.path === 'string') {
        // TODO: Try guessing Content-Type based on this property
        // Idea by @mikeal:
        // https://github.com/mikeal/response/blob/0bb9b978cd120d69c9369faf385b11c974ab35a5/index.js#L22
      }

      return resolvedHeaders(this.headers.dict).then(
        headers => new QuinnResponse({
          statusCode: this.statusCode,
          headers: headers,
          body: body
        }, true)
      );
    });
  }

  resolvedBody() {
    if (this._isResolved) return resolve(this.body);
    return resolve(this.body).then(toStream);
  }

  status(code) {
    return this.statusCode = code, this;
  }

  toJSON() {
    return this.resolvedBody().then(body => body.toJSON());
  }

  toBuffer() {
    return this.resolvedBody().then(body => body.toBuffer());
  }

  pipe(res) {
    if (!this._isResolved) {
      this.resolved().then( r => r.pipe(res) );
    } else {
      if (res.setHeader) {
        res.statusCode = this.statusCode;
        each(this.headers.dict, (header, name) => {
          res.setHeader(name, header);
        });
      }
      this.body.pipe(res);
    }
    return res;
  }

  hasHeader(name) {
    return this.headers.has(name);
  }

  getHeader(name) {
    return this.headers.get(name);
  }

  header(name, value) {
    if (value === undefined)
      return this.headers.del(name), this;
    else
      return this.headers.set(name, value), this;
  }

  addHeader(name, value) {
    var oldValue = this.headers.get(name);
    this.headers.set(name, join(oldValue, value, concatHeaders));
    return this;
  }
}

export default QuinnResponse;
