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

const { PassThrough } = require('stream');
const { httpify } = require('caseless');

function isStream(value) {
  return !!value && typeof value.pipe === 'function';
}

function isLazy(value) {
  return typeof value === 'function';
}

const isData =
  typeof Uint8Array === 'function'
    ? function isData(value) {
        return typeof value === 'string' || value instanceof Uint8Array;
      }
    : function isData(value) {
        return typeof value === 'string';
      };

function isBody(value) {
  return value === null || isData(value) || isStream(value) || isLazy(value);
}

function getDefaultBody() {
  return '';
}

class VirtualResponse extends PassThrough {
  constructor({ statusCode = 200, headers = {}, body }) {
    super();

    this.statusCode = statusCode;
    this.bodyFactory = null;
    this.cachedError = null;

    httpify(this, headers);
    if (isBody(body)) {
      this.body(body);
    } else {
      this.bodyFactory = getDefaultBody.bind(null, this);
    }
  }

  error(e) {
    // throw error! but maybe make it possible for this to be delayed until
    // after the stream is flowing.
    this.emit('error', e);
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
    if (typeof body === 'function') {
      this.bodyFactory = body;
      return this;
    }
    this.bodyFactory = null;

    if (typeof body === 'string') body = Buffer.from(body);
    if (body === null) body = Buffer.alloc(0);

    if (body instanceof Buffer) {
      this.body = body;
      this.header('Content-Length', body.length);
      this.end(body);
    } else if (isStream(body)) {
      if (typeof body.on === 'function') {
        body.on('error', e => {
          this.error(e);
        });
      }
      body.pipe(this);
    } else {
      throw new TypeError('Body has to be a string or a Buffer');
    }
    return this;
  }

  forwardTo(req, res) {
    return new Promise((resolve, reject) => {
      this.on('error', reject);
      const cachedError = this.cachedError;
      this.cachedError = null;
      if (cachedError !== null) {
        this.emit('error', cachedError);
      }

      if (this.bodyFactory !== null) {
        const factory = this.bodyFactory;
        this.bodyFactory = null;
        this.body(factory(req, res));
      }

      req.on('error', this.error.bind(this));
      res.on('error', this.error.bind(this));

      this.pipe(res);
      res.on('finish', resolve.bind(null, res));
    });
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

function respond(props = {}) {
  if (props instanceof VirtualResponse) return props;

  if (isBody(props)) {
    return new VirtualResponse({ body: props });
  }

  return new VirtualResponse(props);
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
