'use strict';

const express = require('express');

const quinn = require('../../express');
const respond = require('../../respond');

const app = express();
app.get('/quinn-route', quinn(function(req) {
  return respond({ body: 'Hello World!\n' })
}));

const port = process.env.PORT || 3000;
app.listen(port, function() {
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log('Listening on %s', baseUrl);
});
