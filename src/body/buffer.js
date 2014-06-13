/**
 * We need to disallow munging private properties since _read is part of our
 * interface with ReadableStream
 *
 * @preventMunge
 */
'use strict';

import {Readable} from 'readable-stream';

class BufferBody extends Readable {
  constructor(buffer, opts) {
    super(opts);
    this._buffer = buffer;
  }

  _read() {
    this.push(this._buffer);
    this._buffer = null;
  }

  toJSON() {
    return this._buffer.toString('utf8');
  }

  toBuffer() {
    return this._buffer;
  }

  getByteSize() {
    if (this._buffer === null) {
      return 0;
    } else {
      return this._buffer.length;
    }
  }
}

export default BufferBody;
