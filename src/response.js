'use strict';

import {STATUS_CODES} from 'http';

import caseless from 'caseless';
import {isPromise, all} from 'bluebird';
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

export class QuinnResponse {
  constructor(props, isResolved) {
    this.statusCode = props.statusCode || 200;
    this.headers = caseless(props.headers || {});
    this.body = props.body || null; // null === empty body
    this._isResolved = !!isResolved;

    if (this._isResolved)
      this._ensureDefaults();
  }

  resolved() {
    return all([
      this.statusCode,
      resolvedHeaders(this.headers.dict),
      this.body
    ]).spread( (statusCode, headers, body) => {
      return new QuinnResponse({
        statusCode: statusCode,
        headers: headers,
        body: toStream(body)
      }, true);
    });
  }

  _ensureDefaults() {
    if (!this.hasHeader('Content-Type'))
      this.header('Content-Type', 'text/plain; charset=utf-8');

    if (this.body !== null && this.body.getByteSize)
      this.header('Content-Length', this.body.getByteSize());
  }

  status(code) {
    return this.statusCode = code, this;
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
    return this.headers.set(name, value), this;
  }

  addHeader(name, value) {
    var oldValue = this.headers.get(name);
    if (isPromise(oldValue) || isPromise(value)) {
      this.headers.set(
        name,
        all(oldValue, value).spread(concatHeaders)
      );
    } else {
      this.headers.set(name, concatHeaders(oldValue, value));
    }
    return this;
  }
}

export function toResponse(props) {
  if (props === undefined) {
    return;
  } else if (props instanceof QuinnResponse) {
    return props;
  } else if (Buffer.isBuffer(props)) {
    return new QuinnResponse({ body: props });
  } else if (typeof props === 'number') {
    return new QuinnResponse({
      statusCode: props,
      body: new Buffer(STATUS_CODES[props], 'ascii')
    });
  } else if (typeof props === 'object' && props !== null){
    return new QuinnResponse(props);
  } else {
    return new QuinnResponse({ body: new Buffer(props, 'utf8') });
  }
}
