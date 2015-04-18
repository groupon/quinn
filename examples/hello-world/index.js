'use strict'; // just for jshint

import { createServer } from 'http';

import quinn from '../../';
import respond from '../../respond';

import Gofer from 'gofer';

function handle(request) {
  if (request.url === '/foo') return;
  return require('fs')
    .createReadStream('.travis.yml')
    .pipe(respond({
      statusCode: 200,
      headers: {
        'X-Req-User-Agent': request.headers['user-agent'] || 'Unknown',
        'X-Foo': 'Bar'
      }
    }));
}

async function fetchAndPrint(gofer, urlPath) {
  const res = await gofer.fetch(urlPath).getResponse();
  console.log(`Response for ${urlPath} (${res.statusCode}):
---
${res.body}
...`);
}

const server = createServer(quinn(handle))
  .listen(async () => {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const gofer = new Gofer({ globalDefaults: { baseUrl, maxStatusCode: 500 } });

    await fetchAndPrint(gofer, '/foo');

    console.log('\n===\n');

    await fetchAndPrint(gofer, '/bar');

    server.close();
  });
