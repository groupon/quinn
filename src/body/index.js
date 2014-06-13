'use strict';

import BufferBody from './buffer';
import JSONBody from './json';

export function toStream(body) {
  if (typeof body.pipe === 'function') { // duck type readable stream
    return body;
  } else if (Buffer.isBuffer(body) || body === null) {
    return new BufferBody(body);
  } else {
    return new BufferBody(new Buffer(String(body), 'utf8'));
  }
}

export {BufferBody, JSONBody};
