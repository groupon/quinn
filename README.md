Maybe coming some day.

### Request handler

```js
function(request) {
    return response;
}
```

#### `request`

A node.js request object, as documented in the offical node.js docs.
There are no additional properties, no magical extension methods.

#### `response`

Describes the response that should be returned.
It's a pass-through stream.

While it might have additional utility functions,
only the following properties and methods should be relied on:

* `response.setHeader(name, value)`
* `response.getHeader(name)`
* `response.removeHeader(name)`
* `response.statusCode`
* `response.write(chunk[, encoding][, callback])`
* `response.end([data][, encoding][, callback])`

The behavior should match the one of `http.ServerResponse`.
All headers and the status code should be forwarded
when the response is piped to a target.
