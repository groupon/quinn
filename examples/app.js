'use strict';

var Bluebird = require('bluebird');
var all = Bluebird.all;

var router = require('quinn-router');
var respond = require('quinn-respond');

var route = router.route;

function firstHandler() {
  var handlers = Array.prototype.slice.call(arguments);
  function _tryFirst(idx, req, params) {
    var handler = handlers[idx];
    ++idx;
    return Bluebird.try(handler, [req, params])
      .then(function(res) {
        if (res === undefined && idx < handlers.length) {
          return _tryFirst(idx, req, params);
        } else {
          return res;
        }
      });
  }

  return function(req, params) {
    return _tryFirst(0, req, params);
  };
}

var baseApp = route(function(router) {
  var GET = router.GET;

  GET('/', function() {
    return 'Root level route';
  });

  GET('/hello/{name}', function(req, params) {
    return 'Hello, ' + params.name;
  });

  GET('/json', function() {
    return respond.json({ error: 'Invalid parameters' })
      .status(400);
  });

  GET('/nested', function() {
    // This simulates return values from other actions
    return all([ respond.json({ a: 42 }), respond('foo') ])
      .spread(function(data, text) {
        return {
          data: data,
          text: text,
          now: new Date()
        };
      })
      .then(respond.json);
  });
});

var app = firstHandler(
  baseApp,
  require('./modules/flickr').handler
);

module.exports = app;

if (require.main === module) {
  var http = require('http');
  var quinn = require('../');

  var server = http.createServer(quinn(app));
  server.listen(3000);
}
