'use strict';

const parseUrl = require('url').parse;
const assert = require('assert');

const quinn = require('../');
const respond = require('../respond');

const withTestApp = require('./test-app');

function handler(req) {
  const parsed = parseUrl(req.url, true);
  switch (parsed.pathname) {
    case '/':
      return respond().body('ok');

    case '/invalid':
      return respond()
        .body('invalid')
        .status(400);

    case '/throw':
      throw new Error('Some Error');

    case '/json':
      return respond.json({ ok: true });

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

    default:
      return; // eslint-disable-line consistent-return
  }
}

describe('quinn:integration', () => {
  const $ = withTestApp(quinn(handler)),
    describeRequest = $.describeRequest,
    assertStatusCode = $.assertStatusCode,
    itSends = $.itSends;

  describeRequest('GET', '/', () => {
    assertStatusCode(200);
    itSends('ok');
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
