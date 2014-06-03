{createServer} = require 'http'

quinn = require '../'
{routes} = quinn

server = createServer quinn routes ({GET}) ->
  GET '/', ->
    'live edited!'

  GET '/zapp', ->
    'added while running!'

  GET '/foo', ->
    'bar'

  GET '/json', ->
    statusCode: 400
    headers: { 'Content-Type': 'application/json' }
    body: JSON.stringify(error: 'Invalid parameters')

server.listen process.env.PORT || 3000
