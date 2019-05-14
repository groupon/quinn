'use strict'; // just for jshint

import { createServer } from 'http';

import quinn from '../../';
import respond from '../../respond';

import Gofer from 'gofer';

function handle({ url, headers }) {
  if (url === '/foo') return;
  return require('fs')
    .createReadStream('.travis.yml')
    .pipe(respond({
      statusCode: 200,
      headers: {
        'X-Req-User-Agent': headers['user-agent'] || 'Unknown',
        'X-Foo': 'Bar'
      }
    }));
}

async function fetchAndPrint(gofer, urlPath, options = {}) {
  const { statusCode, body } = await gofer.fetch(urlPath, options);
  console.log(`Response for ${urlPath} (${statusCode}):
---
${body}
...`);
}

const server = createServer(quinn(handle))
  .listen(async () => {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const gofer = new Gofer({ globalDefaults: { baseUrl } });

    try {
      await gofer.fetch('/foo');
    } catch (err) {
      console.log(err);
    }

    console.log('\n===\n');

    await fetchAndPrint(gofer, '/bar');

    server.close();
  });
