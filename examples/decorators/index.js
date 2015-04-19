'use strict';

import { createServer } from 'http';

import quinn from '../..';
import respond from '../../respond';

import { GET, PUT, extractHandlers } from './resource';

class MyResource {
  constructor() {
    this.prefix = 'Result: ';
  }

  @GET `/foo`
  showFoo() {
    return respond({ body: `${this.prefix}The thing` });
  }

  @PUT `/foo`
  updateFoo() {
    return respond({ body: `${this.prefix}Updated!` });
  }
}

const objResource = {
  name: 'customResource',

  // Options for path parameters:
  // * Most compatible with other "stuff" out there
  //   @GET `/bar/:id`
  // * Cleaner way because it has unambiguous end
  //   @GET `/bar/{id}`
  // * No parsing necessary but a bit verbose
  //   @GET `/bar/${'id'}`
  // * Example of complex rules w/ types/validators
  //   @GET `/:type${String}/:id${/[\w]+/}`
  //   @GET `/{type}${String}/{id}${/[\w]+/}`
  //   @GET `/${String}/${/[\d]+/}`  <- does not have names
  //   showItem(req, category, id) { <- because this has
  //   }

  @GET `/bar`
  showBar(req) {
    return respond({ body: 'A bar' });
  }
}

const justFunctions = [
  GET `/zapp` (req => respond({ body: 'Zapping along' })),
  PUT `/zapp` (req => respond({ body: 'Zapping even more' }))
];

const handlers =
  extractHandlers(new MyResource(), objResource).concat(justFunctions);

const app = quinn(req => {
  return handlers.reduce((prev, current) => {
    return prev.then(result => {
      if (result) return result;
      return current(req);
    });
  }, Promise.resolve());
});
const server = createServer(app).listen(3000, () => {
  console.log(`Listening on http://127.0.0.1:${server.address().port}`);
});
