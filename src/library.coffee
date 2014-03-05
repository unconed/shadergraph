Snippet = require './snippet'

class Library
  constructor: (@snippets = {}) ->
    @objects = {}

  fetch: (name) ->
    throw "Unknown snippet `#{name}`" if !@snippets[name]?

    if @objects[name]?
      @objects[name].clone()
    else
      @objects[name] = Snippet.parse name, @snippets[name]

module.exports = Library