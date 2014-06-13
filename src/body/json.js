/**
 * We need to disallow munging private properties since _read is part of our
 * interface with ReadableStream
 *
 * @preventMunge
 */
'use strict';

import {Readable} from 'readable-stream';
import {resolve, all} from 'bluebird';
import {zipObject, isObject, isRegExp} from 'lodash';

function resolveObject(obj) {
  var keys = Object.keys(obj);
  var values = keys.map( key => obj[key] );
  return all(values).map(resolveDeep).then( resolvedValues =>
    zipObject(keys, resolvedValues)
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

class JSONBody extends Readable {
  constructor(data, opts) {
    super(opts);

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
