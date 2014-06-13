/**
 * We need to disallow munging private properties since _read is part of our
 * interface with ReadableStream
 *
 * @preventMunge
 */
'use strict';

import {Readable} from 'readable-stream';

class BufferReadStream extends Readable {
  constructor(buffer, opts) {
    super(opts);
    this._buffer = buffer;
  }

  _read() {
    this.push(this._buffer);
    this._buffer = null;
  }

  getByteSize() {
    if (this._buffer === null) {
      return 0;
    } else {
      return this._buffer.length;
    }
  }
}

export default BufferReadStream;
