'use strict';

const NOT_FOUND = new Buffer('Not Found\n', 'utf8');
const INTERNAL_ERROR = new Buffer('Internal Server Error\n', 'utf8');

function sendNotFound(res) {
  res.statusCode = 404;
  res.end(NOT_FOUND);
}

function sendFatalError(res, err) {
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
      if (vres === undefined) return;

      return new Promise(function(resolve, reject) {
        res.on('error', reject);
        res.on('finish', function() { resolve(vres); });
        vres.pipe(res);
      });
    });
}

function createApp(handler) {
  return function(req, res) {
    return runApplication(handler, req, res)
      .then(function(result) {
        if (result === undefined) return sendNotFound(res);
        return result;
      })
      .then(null, function(err) { return sendFatalError(res, err); });
  };
}

module.exports = createApp;
createApp['default'] = createApp;
createApp.runApplication = runApplication;
