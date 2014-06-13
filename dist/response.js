'use strict';

var caseless = require('caseless');
var mod$0 = require('bluebird');var all = mod$0.all;var resolve = mod$0.resolve;
var mod$1 = require('lodash');var zipObject = mod$1.zipObject;var each = mod$1.each;var isObject = mod$1.isObject;
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
  }

  QuinnResponse.prototype.resolved=function() {
    if (this.$QuinnResponse0) return resolve(this);
    return this.resolvedBody().then( function(body)  {
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
        function(headers)  {return new QuinnResponse({
          statusCode: this.statusCode,
          headers: headers,
          body: body
        }, true);}.bind(this)
      );
    }.bind(this));
  };

  QuinnResponse.prototype.resolvedBody=function() {
    if (this.$QuinnResponse0) return resolve(this.body);
    return resolve(this.body).then(toStream);
  };

  QuinnResponse.prototype.status=function(code) {
    return this.statusCode = code, this;
  };

  QuinnResponse.prototype.toJSON=function() {
    return this.resolvedBody().then(function(body)  {return body.toJSON();});
  };

  QuinnResponse.prototype.toBuffer=function() {
    return this.resolvedBody().then(function(body)  {return body.toBuffer();});
  };

  QuinnResponse.prototype.pipe=function(res) {
    if (!this.$QuinnResponse0) {
      this.resolved().then( function(r)  {return r.pipe(res);} );
    } else {
      if (res.setHeader) {
        res.statusCode = this.statusCode;
        each(this.headers.dict, function(header, name)  {
          res.setHeader(name, header);
        });
      }
      this.body.pipe(res);
    }
    return res;
  };

  QuinnResponse.prototype.hasHeader=function(name) {
    return this.headers.has(name);
  };

  QuinnResponse.prototype.getHeader=function(name) {
    return this.headers.get(name);
  };

  QuinnResponse.prototype.header=function(name, value) {
    if (value === undefined)
      return this.headers.del(name), this;
    else
      return this.headers.set(name, value), this;
  };

  QuinnResponse.prototype.addHeader=function(name, value) {
    var oldValue = this.headers.get(name);
    this.headers.set(name, all(oldValue, value).spread(concatHeaders));
    return this;
  };


module.exports = QuinnResponse;
