#!/usr/bin/env node
'use strict';

var concat = require('concat-stream');
var mkdirp = require('mkdirp');
var glob = require('glob');

var compile = require('./quinnc');

var FS = require('fs');
var Path = require('path');

var inputPath = process.argv[2];
var outputPath = process.argv[3];

var compileFromStdin = process.argv.length < 3 || inputPath === '-';
var compileToStdout = process.argv.length < 4;

if (compileFromStdin) inputPath = 0;
if (compileToStdout) outputPath = 1;

var inputStat = compileFromStdin ? {
  isFile: function() { return true; },
  isDirectory: function() { return false; }
} : FS.statSync(inputPath);

var outputStat;
try {
  outputStat = compileToStdout ? {
    isFile: function() { return true; },
    isDirectory: function() { return false; }
  } : FS.statSync(outputPath);
} catch(err) {
  if (err.code !== 'ENOENT') throw err;

  // If the target doesn't exist, it can be anything we want it to be!
  outputStat = {
    isFile: function() { return true; },
    isDirectory: function() { return true; }
  };
}

function doCompile(from, to, done) {
  var inStream = from === 0 ? process.stdin : FS.createReadStream(from);

  function withDirectory(cb) {
    if (to === 1) cb();
    else mkdirp(Path.dirname(to), cb);
  }

  withDirectory(function(err) {
    if (err) return done(err);

    inStream.pipe(concat(function(data) {
      var outStream = to === 1 ? process.stdout : FS.createWriteStream(to);
      outStream.write(compile(data).code);
      if (to !== 1) outStream.end();
    }));
  });
}

if (inputStat.isFile()) {
  if (!outputStat.isFile()) {
    throw new Error('Target exists and is not a file: ' + outputPath);
  }

  doCompile(inputPath, outputPath, function(err) {
    if (err) throw err;
  });
} else if (inputStat.isDirectory()) {
  if (!outputStat.isDirectory()) {
    throw new Error('Target exists and is not a directory: ' + outputPath);
  }

  glob('**/*.{js,jsx}', {
    cwd: inputPath
  }, function(err, matches) {
    if (err) throw err;

    matches.forEach(function(match) {
      var sourceFile = Path.resolve(inputPath, match);
      var outputFile = Path.resolve(outputPath, match);

      // Default: do not compile if target is newer than source
      var sourceFileMTime = FS.statSync(sourceFile).mtime.getTime();
      var outputFileMTime = (function() {
        try { return FS.statSync(outputFile).mtime.getTime(); }
        catch (err) {
          if (err.code === 'ENOENT') return 0;
          throw err;
        }
      })();

      if (outputFileMTime > sourceFileMTime)
        return;

      console.error('Compiling ' + sourceFile);
      doCompile(sourceFile, outputFile, function(err) {
        if (err) throw err;
      });
    });
  });
} else {
  throw new Error(
    'Don\'t know what to do with this kind of input.\n' +
    JSON.stringify(inputStat)
  );
}
