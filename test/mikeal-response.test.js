'use strict';

const response = require('response');

const quinn = require('../');

const withTestApp = require('./test-app');

function handler(req) {
  if (req.url === '/') return response.html('<html>Hello World</html>');
  if (req.url === '/something.json') return response.json({ test: 1 });
  if (req.url === '/something.txt') return response.txt('some test');
  throw new Error('Unsupported url');
}

describe('Using mikeal/response', () => {
  const $ = withTestApp(quinn(handler)),
    describeRequest = $.describeRequest,
    assertStatusCode = $.assertStatusCode,
    itSends = $.itSends;

  describeRequest('GET', '/', () => {
    assertStatusCode(200);
    itSends('<html>Hello World</html>');
  });

  describeRequest('GET', '/something.txt', () => {
    assertStatusCode(200);
    itSends('some test');
  });
});
