'use strict';

import {STATUS_CODES} from 'http';

import QuinnResponse from './response';
import JSONBody from './body/json';

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

export default respond;

export function json(data, opts) {
  if (data === undefined)
    return;

  return respond({
    body: new JSONBody(data, opts),
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}
