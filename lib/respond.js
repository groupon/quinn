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

/**
 * @typedef {import('http').IncomingMessage} IncomingMessage
 * @typedef {import('http').ServerResponse} ServerResponse
 * @typedef {() => any} QuinnHandler
 * @typedef {any} QuinnBody
 * @typedef {(() => QuinnBody) | ((req: IncomingMessage, res: ServerResponse) => QuinnBody) | null} QuinnBodyFactory
 */

/**
 * @param {any} value
 */
function isStream(value) {
  return !!value && typeof value.pipe === 'function';
}

/**
 * @param {unknown} value
 */
function isLazy(value) {
  return typeof value === 'function';
}

/**
 * @type {(value: any) => boolean}
 */
const isData =
  typeof Uint8Array === 'function'
    ? function isData(value) {
        return typeof value === 'string' || value instanceof Uint8Array;
      }
    : function isData(value) {
        return typeof value === 'string';
      };

/**
 * @param {any} value
 */
function isBody(value) {
  return value === null || isData(value) || isStream(value) || isLazy(value);
}

function getDefaultBody() {
  return '';
}

class VirtualResponse extends PassThrough {
  /**
   *
   * @param {{ statusCode?: number, headers?: object, body?: any }} options
   */
  constructor({ statusCode = 200, headers = {}, body }) {
    super();

    this.statusCode = statusCode;
    /** @type {QuinnBodyFactory} */
    this.bodyFactory = null;
    /** @type {Error | null} */
    this.cachedError = null;

    httpify(this, headers);

    if (isBody(body)) {
      this.body(body);
    } else {
      this.bodyFactory = getDefaultBody.bind(null, this);
    }
  }

  /**
   * @param {Error} e
   */
  error(e) {
    // throw error! but maybe make it possible for this to be delayed until
    // after the stream is flowing.
    this.emit('error', e);
  }

  /**
   * @param {number} code
   */
  status(code) {
    this.statusCode = code;
    return this;
  }

  /**
   * @param {string} name
   * @param {string | string[]} value
   */
  header(name, value) {
    // @ts-ignore Typescript doesn't understand `httpify(this)`
    this.setHeader(name, value);
    return this;
  }

  /**
   * @param {QuinnBody} body
   */
  body(body) {
    if (typeof body === 'function') {
      this.bodyFactory = body;
      return this;
    }
    this.bodyFactory = null;

    if (typeof body === 'string') body = Buffer.from(body);
    if (body === null) body = Buffer.alloc(0);

    if (body instanceof Buffer) {
      // @ts-ignore
      this.body = body;
      this.header('Content-Length', `${body.length}`);
      this.end(body);
    } else if (isStream(body)) {
      if (typeof body.on === 'function') {
        body.on('error', (/** @type {Error} */ e) => {
          this.error(e);
        });
      }
      body.pipe(this);
    } else {
      throw new TypeError('Body has to be a string or a Buffer');
    }
    return this;
  }

  /**
   * @param {IncomingMessage} req
   * @param {ServerResponse} res
   */
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

  /**
   * @template {NodeJS.WritableStream} T
   * @param {T} res
   * @param {{ end?: boolean }} [options]
   * @returns {T}
   */
  pipe(res, options) {
    // @ts-ignore
    res.statusCode = this.statusCode;

    // @ts-ignore Typescript doesn't like type narrowing like this
    if (typeof res.setHeader === 'function') {
      // @ts-ignore Typescript can't understand `httpify(this)` above
      const headers = this.headers;
      const headerNames = Object.keys(headers);
      for (let i = 0; i < headerNames.length; ++i) {
        const name = headerNames[i];
        // @ts-ignore Typescript doesn't let us cast `res` to ServerResponse
        res.setHeader(name, headers[name]);
      }
    }

    return super.pipe(res, options);
  }
}

function respond(props = {}) {
  if (props instanceof VirtualResponse) return props;

  if (isBody(props)) {
    return new VirtualResponse({ body: /** @type {QuinnBody} */ (props) });
  }

  return new VirtualResponse(props);
}

/**
 * @param {any} obj
 * @param {(key: string, value: any) => any} [visitor]
 * @param {string | number} [indent]
 */
function json(obj, visitor, indent) {
  return respond({
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj, visitor, indent),
  });
}

module.exports = respond;
module.exports.default = respond;
module.exports.respond = respond;
module.exports.json = json;
