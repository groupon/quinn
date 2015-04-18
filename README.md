# Quinn

A web framework designed for things to come.<sup>[1]</sup>

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

Quinn itself only cares that it has a `pipe` method
which is used to forward the data to a [`ServerResponse`](https://iojs.org/api/http.html#http_class_http_serverresponse).

---

<sup>[1]</sup> In other words: an experimental mess.

<sup>[2]</sup> Because buzz word.
