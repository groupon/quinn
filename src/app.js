'use strict';

const NOT_FOUND = new Buffer('Not found', 'utf8');
const INTERNAL_ERROR = new Buffer('Internal Server Error', 'utf8');

function sendNotFound(res) {
  res.statusCode = 404;
  res.end(NOT_FOUND);
}

function sendFatalError(res, err) {
  try { console.error(err.stack); } catch (_) {}
  try {
    res.statusCode = 500;
    res.end(INTERNAL_ERROR);
  } catch (_) {}
  return Promise.reject(err);
}

function runApplication(handler, req, res) {
  return Promise.resolve(req)
    .then(handler)
    .then(function(vres) {
      if (vres === undefined) return sendNotFound(res);

      return new Promise(function(resolve, reject) {
        vres.on('error', reject);
        vres.on('end', function() { resolve(vres); });
        vres.pipe(res);
      });
    })
    .then(null, function(err) { return sendFatalError(res, err); });
}

function createApp(handler) {
  return function(req, res) {
    return runApplication(handler, req, res);
  };
}

module.exports = createApp;
module.exports['default'] = createApp;
