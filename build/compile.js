#!/usr/bin/env node
'use strict';

function getDefaultVisitors(name) {
  return (
    require(
      'jstransform/visitors/es6-' + name + '-visitors'
    ).visitorList
  );
}

var transform = require('jstransform').transform;
var arrow = getDefaultVisitors('arrow-function');
var classes = getDefaultVisitors('class');
var modules = require('es6-module-jstransform').visitorList;
var concat = require('concat-stream');

process.stdin.pipe(concat(function(data) {
  var transformed = transform([].concat(
    modules,
    arrow,
    classes
  ), data.toString('utf8'), {
    sourceMap: false,
    minify: true
  });
  process.stdout.write(transformed.code);
}));
