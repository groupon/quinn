'use strict';
var quinn = require('../');
var routes = quinn.routes;

var server = http.createServer(quinn(routes(function(app) {
  app.GET('/', function() {
    return 'live edited!';
  });
  app.GET('/zapp', function() {
    return 'added while running!';
  });
  app.GET('/foo', function() {
    return 'bar';
  });
})));
server.listen(3000);
