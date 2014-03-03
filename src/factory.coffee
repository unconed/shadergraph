Graph = require('./graph')

Snippet = require('./snippet')
fetch = require('./fetch')

class State
  constructor: (@start, @end) ->

class Factory
  constructor: (@context) ->
    @graph = new Graph
    @state = new State
    @stack = [@state]

  push: (state) -> @stack.push @state
  pop: () -> @stack.pop

  snippet: (name, uniforms) ->
    source = fetch name
    snippet = new Snippet name, source, uniforms

module.exports = Factory