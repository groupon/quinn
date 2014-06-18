/**
 * We need to disallow munging private properties since _read is part of our
 * interface with ReadableStream
 *
 * @preventMunge
 */
'use strict';

import {Readable} from 'readable-stream';
import {resolve} from 'bluebird';
import resolveDeep from 'resolve-deep';

class JSONBody extends Readable {
  constructor(data) {
    this._data = data;
    this._stringified = undefined;
  }

  toBuffer() {
    if (this._stringified === undefined) {
      this._stringified = resolve(this.toJSON()).then(resolveDeep).then(
        data => new Buffer(JSON.stringify(data), 'utf8')
      );
    }
    return this._stringified;
  }

  _read() {
    this.toBuffer().then( buffer => {
      this.push(buffer);
      this.push(null);
    });
  }

  toJSON() {
    return this._data;
  }

  getByteSize() {
    return this.toBuffer().then( buffer => buffer.length );
  }
}

export default JSONBody;
