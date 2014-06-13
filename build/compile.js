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
var templates = getDefaultVisitors('template');
var restParam = getDefaultVisitors('rest-param');
var modules = require('es6-module-jstransform').visitorList;
// var destruct = require('es6-destructuring-jstransform').visitorList;
var concat = require('concat-stream');

process.stdin.pipe(concat(function(data) {
  var transformed = transform([].concat(
    modules,
    // destruct, // buggy :(
    arrow,
    classes,
    templates,
    restParam
  ), data.toString('utf8'), {
    sourceMap: false,
    minify: true
  });
  process.stdout.write(transformed.code);
}));
