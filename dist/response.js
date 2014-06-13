'use strict';

var STATUS_CODES = require('http').STATUS_CODES;

var caseless = require('caseless');
var mod$0 = require('bluebird');var isPromise = mod$0.isPromise;var all = mod$0.all;
var mod$1 = require('lodash');var zipObject = mod$1.zipObject;var each = mod$1.each;
var toStream = require('./body').toStream;

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
  var values = headerKeys.map( function(key)  {return headers[key];} );
  return all(values).then( function(resolvedValues) 
    {return zipObject(headerKeys, resolvedValues);}
  );
}


  function QuinnResponse(props, isResolved) {
    this.statusCode = props.statusCode || 200;
    this.headers = caseless(props.headers || {});
    this.body = props.body || null; // null === empty body
    this.$QuinnResponse0 = !!isResolved;

    if (this.$QuinnResponse0)
      this.$QuinnResponse1();
  }

  QuinnResponse.prototype.resolved=function() {
    return all([
      this.statusCode,
      resolvedHeaders(this.headers.dict),
      this.body
    ]).spread( function(statusCode, headers, body)  {
      return new QuinnResponse({
        statusCode: statusCode,
        headers: headers,
        body: toStream(body)
      }, true);
    });
  };

  QuinnResponse.prototype.$QuinnResponse1=function() {
    if (!this.hasHeader('Content-Type'))
      this.header('Content-Type', 'text/plain; charset=utf-8');

    if (this.body !== null && typeof this.body.getByteSize === 'function')
      this.header('Content-Length', this.body.getByteSize());
  };

  QuinnResponse.prototype.status=function(code) {
    return this.statusCode = code, this;
  };

  QuinnResponse.prototype.pipe=function(res) {
    if (!this.$QuinnResponse0)
      return this.resolved().then( function(r)  {return r.pipe(res);} );

    res.statusCode = this.statusCode;
    each(this.headers.dict, function(header, name)  {
      res.setHeader(name, header);
    });
    this.body.pipe(res);
  };

  QuinnResponse.prototype.hasHeader=function(name) {
    return this.headers.has(name);
  };

  QuinnResponse.prototype.getHeader=function(name) {
    return this.headers.get(name);
  };

  QuinnResponse.prototype.header=function(name, value) {
    return this.headers.set(name, value), this;
  };

  QuinnResponse.prototype.addHeader=function(name, value) {
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
  };
module.exports.QuinnResponse = QuinnResponse;

function toResponse(props) {
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
} module.exports.toResponse = toResponse;
