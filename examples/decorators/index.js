'use strict';

import { createServer } from 'http';

import quinn from '../..';
import respond from '../../respond';

import { GET, PUT, extractHandlers } from './resource';

class MyResource {
  @GET `/foo`
  showFoo() {
    return respond({ body: 'The thing' });
  }

  @PUT `/foo`
  updateFoo() {
    return respond({ body: 'Updated!' });
  }
}

const objResource = {
  name: 'customResource',

  @GET `/bar`
  showBar() {
    return respond({ body: 'A bar' });
  }
}

const handlers = extractHandlers(new MyResource(), objResource);
const app = quinn(req => {
  return handlers.reduce((prev, current) => {
    return prev.then(result => {
      if (result) return result;
      return current(req);
    });
  }, Promise.resolve());
});
const server = createServer(app).listen(() => {
  console.log(`Listening on http://127.0.0.1:${server.address().port}`);
});