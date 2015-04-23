'use strict';

import { createServer } from 'http';

import { GET, PUT, createRouter } from 'wegweiser';

import quinn from '../..';
import respond from '../../respond';

class PageResource {
  constructor() {
    this.tag = 'div';
  }

  renderHtml(text) {
    return respond({
      body: `<${this.tag}>${text}</${this.tag}>`,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  @GET('/p/:slug')
  showPage(req, {slug}) {
    return this.renderHtml(`Page "${slug}"`);
  }

  @PUT('/foo')
  updateFoo() {
    return this.renderHtml('Updated!');
  }
}

const objResource = {
  @GET('/bar')
  showBar(req) {
    return respond({ body: 'A bar' });
  }
}

const justFunctions = [
  GET('/zapp')(req => respond({ body: 'Zapping along' })),
  PUT('/zapp')(req => respond({ body: 'Zapping even more' }))
];

const route = createRouter(PageResource, objResource, ...justFunctions);

const app = quinn(route);
const server = createServer(app).listen(3000, () => {
  console.log(`Listening on http://127.0.0.1:${server.address().port}`);
});
