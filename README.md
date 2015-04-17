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
