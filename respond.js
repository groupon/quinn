'use strict';

const Stream = require('stream');
const httpify = require('caseless').httpify;

class VirtualResponse extends Stream.PassThrough {
  constructor(props) {
    super();

    this.statusCode = props.statusCode || 200;

    httpify(this, props.headers);
    if ('body' in props) this.body(props.body);
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  header(name, value) {
    this.setHeader(name, value);
    return this;
  }

  body(body) {
    if (typeof body === 'string') body = new Buffer(body);

    if (body instanceof Buffer) {
      this.body = body;
      this.header('Content-Length', body.length);
      this.end(body);
    } else {
      throw new TypeError('Body has to be a string or a Buffer');
    }
    return this;
  }

  pipe(res, options) {
    res.statusCode = this.statusCode;

    if (typeof res.setHeader === 'function') {
      const headers = this.headers;
      const headerNames = Object.keys(headers);
      for (let i = 0; i < headerNames.length; ++i) {
        const name = headerNames[i];
        res.setHeader(name, headers[name]);
      }
    }

    return super.pipe(res, options);
  }
}

function respond(props) {
  return new VirtualResponse(props || {});
}

function json(obj, visitor, indent) {
  return respond({
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj, visitor, indent)
  });
}

module.exports = respond;
module.exports['default'] = respond;
module.exports.respond = respond;
module.exports.json = json;
