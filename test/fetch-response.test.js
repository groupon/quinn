'use strict';

const quinn = require('../');

const withTestApp = require('./test-app');

function handler(req) {
  if (req.url === '/') {
    return new Response('<html>Hello World</html>', {
      headers: {'Content-Type': 'text/html; charset=UTF-8'},
    });
  }

  if (req.url === '/something.txt') {
    return new Response('some test', {
      headers: {'Content-Type': 'text/plain; charset=UTF-8'},
    });
  }
  throw new Error('Unsupported url');
}

describe.only('Using global Response constructor', () => {
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
