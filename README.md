[![nlm-github](https://img.shields.io/badge/github-groupon%2Fquinn%2Fissues-F4D03F?logo=github&logoColor=white)](https://github.com/groupon/quinn/issues)
![nlm-node](https://img.shields.io/badge/node-%3E%3D8.3-blue?logo=node.js&logoColor=white)
![nlm-version](https://img.shields.io/badge/version-3.3.9-blue?logo=version&logoColor=white)
# Quinn

A web framework designed for things to come.<sup>[1]</sup>

```js
import { createServer } from 'http';
import { createApp, respond } from 'quinn';

const app = createApp(req => respond({ body: 'Hello World!' }));

createServer(app).listen(3000);
```

## Concepts

### Request handler

A potentially async function that takes a request and returns a response.

```js
function handler(request) {
  return result;
}
```

#### `Request`

An [`http.IncomingMessage`](https://iojs.org/api/http.html#http_http_incomingmessage).
There are no additional properties or magical extension methods.

#### `DispatchResult`

Either a `VirtualResponse`<sup>[2]</sup> or `undefined`.
If it's `undefined`, the handler was unable to handle the given request.
E.g. the handler implements routing logic and no route matched the given url.

#### `respond`

The `respond` function is the primary means to create `VirtualResponse` instances.
It takes one of three possible values:

* An existing `VirtualResponse` instance that will be returned unchanged.
  This ensures that calling `respond` multiple times is idempotent.
* A response body (see below).
* An object with any combination of numeric `statusCode`,
  `headers` object, and/or a `body` property.

The `body` can be one of the following:

* A buffer or `Uint8Array`.
* A string.
* A readable stream.
* An empty body can be expressed by passing `null`.
* A function that takes a request and a response and returns one of the previous types.
  This variant is called a "lazy body" and can be used to delay serialization
  or returns bodies that depend on the incoming request as with JSONP responses.

#### `VirtualResponse`

A pass-through stream describing the response that should be returned.
While it might have additional utility functions,
only the following properties and methods should be relied on:

* [`response.setHeader(name, value)`](https://iojs.org/api/http.html#http_response_setheader_name_value)
* [`response.getHeader(name)`](https://iojs.org/api/http.html#http_response_getheader_name)
* [`response.removeHeader(name)`](https://iojs.org/api/http.html#http_response_removeheader_name)
* [`response.statusCode`](https://iojs.org/api/http.html#http_response_statuscode)
* [`response.write(chunk[, encoding][, callback])`](https://iojs.org/api/http.html#http_response_write_chunk_encoding_callback)
* [`response.end([data][, encoding][, callback])`](https://iojs.org/api/http.html#http_response_end_data_encoding_callback)

The behavior of each should match [`ServerResponse`](https://iojs.org/api/http.html#http_class_http_serverresponse).
All headers and the status code should be forwarded
when the response is piped to a target.
The `statusCode` by setting the property,
the headers by calls to `setHeader` on the target, one header at a time.

A `VirtualResponse` can either be piped to a target stream
or forwarded using `response.forwardTo(req, res)`.
Lazy bodies are only supported when using `forwardTo`.
When using `forwardTo`, it will return a promise
that resolves once the response has been successfully written.

## Combining Quinn

### With Express

```js
import express from 'express';
import { createApp as quinn, respond } from 'quinn/express';

const app = express();
app.get('/quinn-route', quinn(req => respond({ body: 'Hello World!' })));
```

## References

### Similar Libraries

Most of these are based on JSGI.
Which would make sense if node wouldn't include an http server.

* [mikeal/response](https://github.com/mikeal/response)
* [q-io](http://documentup.com/kriskowal/q-io#http-applications)
* [bogart](https://github.com/nrstott/bogart)
* [mach](https://github.com/mjackson/mach)

-----

<sup>[1]</sup> In other words: an experimental mess.

<sup>[2]</sup> Because buzz word.
