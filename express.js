'use strict';

const runApplication = require('./').runApplication;

function quinnExpress(handler) {
  return function(req, res, next) {
    function forwardError(err) {
      setImmediate(function() { next(err); });
    }

    function callNext(result) {
      if (result === undefined) setImmediate(next);
      return result;
    }

    return runApplication(handler, req, res)
      .then(callNext)
      .then(null, forwardError);
  };
}

module.exports = quinnExpress;
quinnExpress['default'] = quinnExpress;
