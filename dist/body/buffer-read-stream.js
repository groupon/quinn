/**
 * We need to disallow munging private properties since _read is part of our
 * interface with ReadableStream
 *
 * @preventMunge
 */
'use strict';

var Readable = require('readable-stream').Readable;

for(var Readable____Key in Readable){if(Readable.hasOwnProperty(Readable____Key)){BufferReadStream[Readable____Key]=Readable[Readable____Key];}}var ____SuperProtoOfReadable=Readable===null?null:Readable.prototype;BufferReadStream.prototype=Object.create(____SuperProtoOfReadable);BufferReadStream.prototype.constructor=BufferReadStream;BufferReadStream.__superConstructor__=Readable;
  function BufferReadStream(buffer, opts) {
    Readable.call(this,opts);
    this._buffer = buffer;
  }

  BufferReadStream.prototype._read=function() {
    this.push(this._buffer);
    this._buffer = null;
  };

  BufferReadStream.prototype.getByteSize=function() {
    if (this._buffer === null) {
      return 0;
    } else {
      return this._buffer.length;
    }
  };


module.exports = BufferReadStream;
