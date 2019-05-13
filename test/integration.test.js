'use strict';

const fs = require('fs');
const path = require('path');
const parseUrl = require('url').parse;
const assert = require('assert');

const quinn = require('../');
const respond = require('../respond');

const withTestApp = require('./test-app');

function handler(req) {
  const parsed = parseUrl(req.url, true);
  switch (parsed.pathname) {
    case '/ok':
      return respond().body('ok');

    case '/redirect':
      return respond({
        statusCode: 302,
        headers: { Location: '/post-redirect' },
      });

    case '/post-redirect':
      return respond({ statusCode: 201 }).body('redirected');

    case '/invalid':
      return respond()
        .body('invalid')
        .status(400);

    case '/throw':
      throw new Error('Some Error');

    case '/json':
      return respond.json({ ok: true });

    case '/file-stream':
      return respond(
        fs.createReadStream(path.resolve(__dirname, 'mocha.opts'))
      );

    case '/delayed':
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (parsed.query.fail) {
            reject(new Error('Forced Delayed Error'));
          } else {
            resolve(respond().body('delayed ok'));
          }
        }, parsed.query.ms || 150);
      });

    case '/lazy-body':
      return respond((request, response) => {
        response.setHeader('x-side-effect', '1');
        return request.url;
      });

    default:
      return; // eslint-disable-line consistent-return
  }
}

describe('quinn:integration', () => {
  const $ = withTestApp(quinn(handler)),
    describeRequest = $.describeRequest,
    assertStatusCode = $.assertStatusCode,
    itSends = $.itSends;

  describeRequest('GET', '/ok', () => {
    assertStatusCode(200);
    itSends('ok');
  });

  describeRequest('GET', '/redirect', () => {
    assertStatusCode(201);
    itSends('redirected');
  });

  describeRequest('GET', '/file-stream', () => {
    assertStatusCode(200);
    itSends('--recursive\n');
  });

  describeRequest('GET', '/lazy-body?answer=42', () => {
    assertStatusCode(200);
    itSends('/lazy-body?answer=42');

    it('has a custom header', function() {
      assert.equal(this.response.headers['x-side-effect'], '1');
    });
  });

  describeRequest('GET', '/non-existing', () => {
    assertStatusCode(404);
    itSends('Not Found\n');
  });

  describeRequest('GET', '/invalid', () => {
    assertStatusCode(400);
    itSends('invalid');
  });

  describeRequest('GET', '/throw', () => {
    assertStatusCode(500);
    itSends('Internal Server Error\n');
  });

  describeRequest('GET', '/json', () => {
    assertStatusCode(200);
    itSends('{"ok":true}');

    it('has type application/json', function() {
      assert.equal(
        'application/json; charset=utf-8',
        this.response.headers['content-type']
      );
    });

    it('includes content length', function() {
      assert.equal('11', this.response.headers['content-length']);
    });
  });

  describeRequest('GET', '/delayed?ms=100', () => {
    assertStatusCode(200);
    itSends('delayed ok');
  });

  describeRequest('GET', '/delayed?ms=100&fail=true', () => {
    assertStatusCode(500);
    itSends('Internal Server Error\n');
  });
});
