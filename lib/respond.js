/*
 * Copyright (c) 2019, Groupon, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of GROUPON nor the names of its contributors may be
 * used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

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

    return super.pipe(
      res,
      options
    );
  }
}

function respond(props) {
  return new VirtualResponse(props || {});
}

function json(obj, visitor, indent) {
  return respond({
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj, visitor, indent),
  });
}

module.exports = respond;
module.exports['default'] = respond;
module.exports.respond = respond;
module.exports.json = json;
