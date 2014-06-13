'use strict';

import caseless from 'caseless';
import {all, resolve} from 'bluebird';
import {zipObject, each} from 'lodash';
import {toStream} from './body';

function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

function concatHeaders(old, newValue) {
  if (old === undefined) {
    return newValue;
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
    return resolve(this.body).then(toStream).then( body => {
      if (!this.hasHeader('Content-Type'))
        this.header('Content-Type', 'text/plain; charset=utf-8');

      if (typeof body.getByteSize === 'function') {
        this.header('Content-Length', body.getByteSize());
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

  status(code) {
    return this.statusCode = code, this;
  }

  toJSON() {
    return this.resolved().then(r => r.body.toJSON());
  }

  toBuffer() {
    return this.resolved().then(r => r.body.toBuffer());
  }

  pipe(res) {
    if (!this._isResolved)
      return this.resolved().then( r => r.pipe(res) );

    res.statusCode = this.statusCode;
    each(this.headers.dict, (header, name) => {
      res.setHeader(name, header);
    });
    this.body.pipe(res);
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
    this.headers.set(name, all(oldValue, value).spread(concatHeaders));
    return this;
  }
}

export default QuinnResponse;
