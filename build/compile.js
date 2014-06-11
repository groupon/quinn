#!/usr/bin/env node
var es6ArrowFuncVisitors = require('jstransform/visitors/es6-arrow-function-visitors').visitorList;
var es6ClassVisitors = require('jstransform/visitors/es6-class-visitors').visitorList;
var transform = require('es6-module-jstransform');
var concat = require('concat-stream');

process.stdin.pipe(concat(function(data) {
  var transformed = transform(data.toString('utf8'), {
    sourceMap: false
  }, [].concat(
    es6ClassVisitors,
    es6ArrowFuncVisitors
  ));
  process.stdout.write(transformed.code);
}));
