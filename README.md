Maybe coming some day.

### Request handler

*This is what others might call an "application".*
*But "application is a pretty silly name.*

```js
function(request, params) {
    return response;
}
```

#### `request`

A node.js request object, as documented in the offical node.js docs.
There are no additional properties, no magical extension methods.

#### `params`

Think: the "arguments".
This can be path parameters, query parameters.
`params` should never contain anything other than simple data.
By default `params` defaults to an empty object.
If a request handler forwards to a different handler,
it should forward all params that were passed in.
Injecting magic catch-all params is highly discouraged.
Say no to `params.cookies` or `.session` or any other funny business.
`params` SHOULD be a simple object.
Any other kind of value should be the exception.

#### `response`

Describes the response that should be returned.
A proper response has a method to pipe to node.js response stream.
It's also valid to return any of the things
that can be coerced into a response object by `quinn.respond`.
