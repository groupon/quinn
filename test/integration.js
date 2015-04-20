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
      return respond().body('invalid').status(400);

    case '/throw':
      throw new Error('Some Error');

    case '/json':
      return respond.json({ ok: true });

    case '/delayed':
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          if (parsed.query.fail) {
            reject(new Error('Forced Delayed Error'));
          } else {
            resolve(respond().body('delayed ok'));
          }
        }, parsed.query.ms || 150);
      });
  }
}

describe('quinn:integration', function() {
  const _$ = withTestApp(quinn(handler)),
        describeRequest = _$.describeRequest,
        assertStatusCode = _$.assertStatusCode,
        itSends = _$.itSends;

  describeRequest('GET', '/', function() {
    assertStatusCode(200);
    itSends('ok');
  });

  describeRequest('GET', '/non-existing', function() {
    assertStatusCode(404);
    itSends('Not Found\n');
  });

  describeRequest('GET', '/invalid', function() {
    assertStatusCode(400);
    itSends('invalid');
  });

  describeRequest('GET', '/throw', function() {
    assertStatusCode(500);
    itSends('Internal Server Error\n');
  });

  describeRequest('GET', '/json', function() {
    assertStatusCode(200);
    itSends('{"ok":true}');

    it('has type application/json', function() {
      assert.equal(
        'application/json; charset=utf-8',
        this.response.headers['content-type']);
    });

    it('includes content length', function() {
      assert.equal(
        '11',
        this.response.headers['content-length']);
    });
  });

  describeRequest('GET', '/delayed?ms=100', function() {
    assertStatusCode(200);
    itSends('delayed ok');
  });

  describeRequest('GET', '/delayed?ms=100&fail=true', function() {
    assertStatusCode(500);
    itSends('Internal Server Error\n');
  });
});
