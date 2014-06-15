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
var modules = require('es6-module-jstransform');
// var destruct = require('es6-destructuring-jstransform');

module.exports = function quinnCompile(source, options) {
  // Needed to reset the counter that generate unique ids.
  // We don't want compilation order to affect the resulting files.
  modules.__resetModuleState();

  options = options || {};
  if (options.sourceMap === undefined) {
    options.sourceMap = false;
  }
  if (options.minify === undefined) {
    options.minify = true;
  }
  return transform(
    [].concat(
      modules.visitorList,
      // destruct.visitorList, // buggy :(
      arrow,
      classes,
      templates,
      restParam
    ),
    source.toString('utf8'),
    options
  );
};
