'use strict';

const assert = require('assert');

const express = require('express');

const quinn = require('../express');
const respond = require('../respond');

const withTestApp = require('./test-app');

const app = express();

app.get(
  '/',
  quinn(() => {
    return respond().body('ok');
  })
);

app.get(
  '/invalid',
  quinn(() => {
    return respond().body('invalid').status(400);
  })
);

app.get(
  '/throw',
  quinn(() => {
    throw new Error('Some Error');
  })
);

app.get(
  '/delayed',
  quinn(req => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (req.query.fail) {
          reject(new Error('Forced Delayed Error'));
        } else {
          resolve(respond().body('delayed ok'));
        }
      }, req.query.ms || 150);
    });
  })
);

describe('quinn:express', () => {
  const $ = withTestApp(app),
    describeRequest = $.describeRequest,
    assertStatusCode = $.assertStatusCode,
    itContains = $.itContains,
    itSends = $.itSends;

  describeRequest('GET', '/', () => {
    assertStatusCode(200);
    itSends('ok');
  });

  describeRequest('GET', '/non-existing', () => {
    assertStatusCode(404);
    // The exact message depends on express
    itContains('Cannot GET /non-existing');
  });

  describeRequest('GET', '/invalid', () => {
    assertStatusCode(400);
    itSends('invalid');
  });

  describeRequest('GET', '/throw', () => {
    assertStatusCode(500);

    it('sends the error stack', function () {
      assert.notEqual(this.response.body.indexOf('Error: Some Error'), -1);
    });
  });

  describeRequest('GET', '/delayed?ms=100', () => {
    assertStatusCode(200);
    itSends('delayed ok');
  });

  describeRequest('GET', '/delayed?ms=100&fail=true', () => {
    assertStatusCode(500);

    it('sends the delayed error stack', function () {
      assert.notEqual(
        this.response.body.indexOf('Error: Forced Delayed Error'),
        -1
      );
    });
  });
});
