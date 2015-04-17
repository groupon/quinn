'use strict';

function sendFatalError(res, err) {
  try { console.error(err.stack); } catch (_) {}
  try {
    res.statusCode = 500;
    res.end('Internal Server Error');
  } catch (_) {}
  return Promise.reject(err);
}

function runApplication(handler, req, res) {
  new Promise(resolve => resolve(handler(req)))
    .then(vres => {
      return new Promise((resolve, reject) => {
        vres.on('error', reject);
        vres.on('end', resolve);
        vres.pipe(res);
      });
    })
    .then(null, err => sendFatalError(res, err));
}

function createApp(handler) {
  return (req, res) => runApplication(handler, req, res);
}

module.exports = createApp;
module.exports['default'] = createApp;
