{createServer} = require 'http'

{all} = require 'bluebird'

quinn = require '../'
{routes, respond} = quinn

server = createServer quinn routes ({GET}) ->
  GET '/', ->
    'live edited!'

  GET '/zapp', ->
    'added while running!'

  GET '/foo', ->
    'bar'

  GET '/json', ->
    respond.json(error: 'Invalid parameters')
      .status 400

  GET '/nested', ->
    all([
      # This simulates return values from other actions
      respond.json a: 42
      respond 'foo'
    ])
    .spread (data, text) -> {
      data,
      text,
      now: new Date(),
      r: [ /foo/, /bar/g ]
    }
    .then respond.json

server.listen process.env.PORT || 3000
