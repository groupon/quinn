/**
 * We need to disallow munging private properties since _read is part of our
 * interface with ReadableStream
 *
 * @preventMunge
 */
'use strict';

var Readable = require('readable-stream').Readable;

for(var Readable____Key in Readable){if(Readable.hasOwnProperty(Readable____Key)){BufferBody[Readable____Key]=Readable[Readable____Key];}}var ____SuperProtoOfReadable=Readable===null?null:Readable.prototype;BufferBody.prototype=Object.create(____SuperProtoOfReadable);BufferBody.prototype.constructor=BufferBody;BufferBody.__superConstructor__=Readable;
  function BufferBody(buffer, opts) {
    Readable.call(this,opts);
    this._buffer = buffer;
  }

  BufferBody.prototype._read=function() {
    this.push(this._buffer);
    this._buffer = null;
  };

  BufferBody.prototype.toJSON=function() {
    return this._buffer.toString('utf8');
  };

  BufferBody.prototype.toBuffer=function() {
    return this._buffer;
  };

  BufferBody.prototype.getByteSize=function() {
    if (this._buffer === null) {
      return 0;
    } else {
      return this._buffer.length;
    }
  };


module.exports = BufferBody;
