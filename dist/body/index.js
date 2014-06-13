'use strict';

var BufferBody = require('./buffer');
var JSONBody = require('./json');

function toStream(body) {
  if (typeof body.pipe === 'function') { // duck type readable stream
    return body;
  } else if (Buffer.isBuffer(body) || body === null) {
    return new BufferBody(body);
  } else {
    return new BufferBody(new Buffer(String(body), 'utf8'));
  }
} module.exports.toStream = toStream;

module.exports.BufferBody = BufferBody;module.exports.JSONBody = JSONBody;
