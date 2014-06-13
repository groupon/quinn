#!/usr/bin/env node
'use strict';

function getDefaultVisitors(name) {
  return (
    require(
      'jstransform/visitors/es6-' + name + '-visitors'
    ).visitorList
  );
}

var arrow = getDefaultVisitors('arrow-function');
var classes = getDefaultVisitors('class');
var transform = require('es6-module-jstransform');
var concat = require('concat-stream');

process.stdin.pipe(concat(function(data) {
  var transformed = transform(data.toString('utf8'), {
    sourceMap: false
  }, [].concat(
    arrow,
    classes
  ));
  process.stdout.write(transformed.code);
}));
