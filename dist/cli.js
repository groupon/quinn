'use strict';

var Path = require('path');
var Http = require('http');

var minimist = require('minimist');

var quinn = require('./quinn');

var commands = {};

commands.server = function(argv) {
  var modulePath = Path.resolve(process.cwd(), argv._.shift() || '.');
  var port = argv.port || argv.p || process.env.PORT || 3000;
  var verbose = argv.verbose;

  var app = require(modulePath);

  var server = Http.createServer(quinn(app));
  server.listen(port, function() {
    if (verbose) {
      console.error('Listening', this.address());
    }
  });
};

commands.help = function() {
  console.error([
    'Usage:',
    '  quinn <cmd> [ <params> ]* [ <args> ]*',
    '',
    'Commands:',
    '  server         # Tries to start the current directory as a quinn app',
    '  server <path>  # Starts the given module as a quinn app'
  ].join('\n'));
};

function run(rawArgv) {
  var argv = minimist(rawArgv);
  var cmd = argv._.shift() || 'help';

  if (argv.v || argv.version) {
    return console.log(require('../package.json').version);
  }

  switch (cmd) {
  case 's':
  case 'serve':
  case 'server':
    return commands.server(argv);

  case 'help':
    return commands.help(argv);

  default:
    // TODO: be smarter about this
    return commands.help(argv);
  }
} module.exports.run = run;
