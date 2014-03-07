Snippet = require './snippet'

class Library
  constructor: (@snippets = {}) ->
    @objects = {}

  fetch: (name) ->
    throw "Unknown snippet `#{name}`" if !@snippets[name]?

    if !@objects[name]?
      @objects[name] = Snippet.load name, @snippets[name]

    @objects[name].clone()

module.exports = Library