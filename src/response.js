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

function pipeHeaders(headers, res) {
  each(headers, (header, name) => {
    res.setHeader(name, header);
  });
}

export class QuinnResponse {
  constructor(props, isResolved) {
    this.statusCode = props.statusCode || 200;
    this.headers = caseless(props.headers || {});
    this.body = props.body || null; // null === empty body
    this._isResolved = !!isResolved;
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

  applyDefaults() {
    if (!this.hasHeader('Content-Type')) {
      this.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }

    if (this.body !== null && this.body.getByteSize) {
      this.setHeader('Content-Length', this.body.getByteSize());
    }
  }

  setStatusCode(code) {
    return this.statusCode = code, this;
  }

  pipe(res) {
    this.resolved().then( resolved => {
      resolved.applyDefaults();

      res.statusCode = resolved.statusCode;
      pipeHeaders(resolved.headers.dict, res);
      resolved.body.pipe(res);
      return resolved;
    });
  }

  hasHeader(name) {
    return this.headers.has(name);
  }

  getHeader(name) {
    return this.headers.get(name);
  }

  setHeader(name, value) {
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
