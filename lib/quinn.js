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

const respond = require('./respond');

/**
 * @typedef {import('http').IncomingMessage} IncomingMessage
 * @typedef {import('http').ServerResponse} ServerResponse
 * @typedef {() => any} QuinnHandler
 */

const NOT_FOUND = Buffer.from('Not Found\n', 'utf8');
const INTERNAL_ERROR = Buffer.from('Internal Server Error\n', 'utf8');

/**
 * @param {ServerResponse} res
 */
function sendNotFound(res) {
  res.statusCode = 404;
  res.end(NOT_FOUND);
}

/**
 * @param {ServerResponse} res
 * @param {Error} err
 */
function sendFatalError(res, err) {
  try {
    res.statusCode = 500;
    res.end(INTERNAL_ERROR);
  } catch (e) {
    /* ignored */
  }
  return Promise.reject(err);
}

/**
 * @param {QuinnHandler} handler
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 */
function runApplication(handler, req, res) {
  return Promise.resolve(req)
    .then(handler)
    .then(vres => {
      if (vres === undefined) return vres;

      return respond(vres)
        .forwardTo(req, res)
        .then(() => vres);
    });
}

/**
 * @param {QuinnHandler} handler
 */
function createApp(handler) {
  /**
   * @param {IncomingMessage} req
   * @param {ServerResponse} res
   */
  function requestListener(req, res) {
    return runApplication(handler, req, res)
      .then(result => {
        if (result === undefined) return sendNotFound(res);
        return result;
      })
      .then(null, err => {
        return sendFatalError(res, err);
      });
  }
  return requestListener;
}

module.exports = createApp;
createApp.default = createApp;
createApp.createApp = createApp;
createApp.respond = respond;
createApp.runApplication = runApplication;
