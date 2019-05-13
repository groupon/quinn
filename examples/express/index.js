'use strict';

const express = require('express');

const quinn = require('../../express');
const respond = require('../../respond');

const app = express();
app.get(
  '/quinn-route',
  quinn(() => {
    return respond({ body: 'Hello World!\n' });
  })
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  const baseUrl = `http://127.0.0.1:${port}`;
  // eslint-disable-next-line no-console
  console.log('Listening on %s', baseUrl);
});
