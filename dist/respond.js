'use strict';

var STATUS_CODES = require('http').STATUS_CODES;

var QuinnResponse = require('./response');
var JSONBody = require('./body/json');

function respond(props) {
  if (props === undefined) {
    return;
  } else if (props instanceof QuinnResponse) {
    return props;
  } else if (Buffer.isBuffer(props)) {
    return new QuinnResponse({ body: props });
  } else if (typeof props === 'number') {
    return new QuinnResponse({
      statusCode: props,
      body: STATUS_CODES[props]
    });
  } else if (typeof props === 'object' && props !== null){
    return new QuinnResponse(props);
  } else {
    return new QuinnResponse({ body: props });
  }
}

module.exports = respond;

function json(data, opts) {
  if (data === undefined)
    return;

  return respond({
    body: new JSONBody(data, opts),
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
} module.exports.json = json;
