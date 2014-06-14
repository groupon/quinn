/**
 * We need to disallow munging private properties since _read is part of our
 * interface with ReadableStream
 *
 * @preventMunge
 */
'use strict';

var Readable = require('readable-stream').Readable;
var mod$0 = require('bluebird');var resolve = mod$0.resolve;var all = mod$0.all;
var mod$1 = require('lodash');var zipObject = mod$1.zipObject;var isObject = mod$1.isObject;var isRegExp = mod$1.isRegExp;

function resolveObject(obj) {
  var keys = Object.keys(obj);
  var values = keys.map( function(key)  {return obj[key];} );
  return all(values).map(resolveDeep).then( function(resolvedValues) 
    {return zipObject(keys, resolvedValues);}
  );
}

function resolveDeep(value) {
  if (Array.isArray(value))
    return all(value).map(resolveDeep);

  if (isRegExp(value)) {
    return resolve(value.toString());
  }

  if (isObject(value)) {
    if (typeof value.toJSON === 'function') {
      return resolve(value.toJSON()).then(resolveDeep);
    } else {
      return resolveObject(value);
    }
  }

  return resolve(value);
}

for(var Readable____Key in Readable){if(Readable.hasOwnProperty(Readable____Key)){JSONBody[Readable____Key]=Readable[Readable____Key];}}var ____SuperProtoOfReadable=Readable===null?null:Readable.prototype;JSONBody.prototype=Object.create(____SuperProtoOfReadable);JSONBody.prototype.constructor=JSONBody;JSONBody.__superConstructor__=Readable;
  function JSONBody(data, opts) {
    Readable.call(this,opts);

    this._data = data;
    this._stringified = undefined;
  }

  JSONBody.prototype.toBuffer=function() {
    if (this._stringified === undefined) {
      this._stringified = resolve(this.toJSON()).then(resolveDeep).then(
        function(data)  {return new Buffer(JSON.stringify(data), 'utf8');}
      );
    }
    return this._stringified;
  };

  JSONBody.prototype._read=function() {
    this.toBuffer().then( function(buffer)  {
      this.push(buffer);
      this.push(null);
    }.bind(this));
  };

  JSONBody.prototype.toJSON=function() {
    return this._data;
  };

  JSONBody.prototype.getByteSize=function() {
    return this.toBuffer().then( function(buffer)  {return buffer.length;} );
  };


module.exports = JSONBody;
