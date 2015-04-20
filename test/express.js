'use strict';

const parseUrl = require('url').parse;
const assert = require('assert');

const express = require('express');

const quinn = require('../express');
const respond = require('../respond');

const withTestApp = require('./test-app');

const app = express();

app.get('/', quinn(function(req) {
  return respond().body('ok');
}));

app.get('/invalid', quinn(function(req) {
  return respond().body('invalid').status(400);
}));

app.get('/throw', quinn(function(req) {
  throw new Error('Some Error');
}));

app.get('/delayed', quinn(function(req) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      if (req.query.fail) {
        reject(new Error('Forced Delayed Error'));
      } else {
        resolve(respond().body('delayed ok'));
      }
    }, req.query.ms || 150);
  });
}));

describe('quinn:express', function() {
  const _$ = withTestApp(app),
        describeRequest = _$.describeRequest,
        assertStatusCode = _$.assertStatusCode,
        itSends = _$.itSends;

  describeRequest('GET', '/', function() {
    assertStatusCode(200);
    itSends('ok');
  });

  describeRequest('GET', '/non-existing', function() {
    assertStatusCode(404);
    // The exact message depends on express
    itSends('Cannot GET /non-existing\n');
  });

  describeRequest('GET', '/invalid', function() {
    assertStatusCode(400);
    itSends('invalid');
  });

  describeRequest('GET', '/throw', function() {
    assertStatusCode(500);

    it('sends the error stack', function() {
      assert.equal(this.response.body.indexOf('Error: Some Error'), 0);
    });
  });

  describeRequest('GET', '/delayed?ms=100', function() {
    assertStatusCode(200);
    itSends('delayed ok');
  });

  describeRequest('GET', '/delayed?ms=100&fail=true', function() {
    assertStatusCode(500);

    it('sends the error stack', function() {
      assert.equal(this.response.body.indexOf('Error: Forced Delayed Error'), 0);
    });
  });
});
