/**
 * We need to disallow munging private properties since _read is part of our
 * interface with ReadableStream
 *
 * @preventMunge
 */
'use strict';

var Readable = require('readable-stream').Readable;
var resolve = require('bluebird').resolve;
var resolveDeep = require('resolve-deep');

for(var Readable____Key in Readable){if(Readable.hasOwnProperty(Readable____Key)){JSONBody[Readable____Key]=Readable[Readable____Key];}}var ____SuperProtoOfReadable=Readable===null?null:Readable.prototype;JSONBody.prototype=Object.create(____SuperProtoOfReadable);JSONBody.prototype.constructor=JSONBody;JSONBody.__superConstructor__=Readable;
  function JSONBody(data) {
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
