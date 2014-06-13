'use strict';

var BufferReadStream = require('./buffer-read-stream');

function toStream(body) {
  if (typeof body.pipe === 'function') { // duck type readable stream
    return body;
  } else if (Buffer.isBuffer(body) || body === null) {
    return new BufferReadStream(body);
  } else {
    return new BufferReadStream(new Buffer(String(body), 'utf8'));
  }
} module.exports.toStream = toStream;
