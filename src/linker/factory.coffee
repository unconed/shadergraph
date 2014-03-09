Graph   = require '../graph'
Block   = require '../block'
Program = require './program'

###
  Chainable factory
  
  Exposes methods to build a graph incrementally
###
class Factory
  constructor: (@library) ->
    @end()

  snippet: (name, uniforms) ->
    @_append  @_shader name, uniforms

  before: (name, uniforms) ->
    @_prepend @_shader name, uniforms

  callback: () ->
    throw "Popping factory stack too far" if @_stack.length <= 2

    @next()._pop()

    sub = @_pop()
    main = @_state

    if sub.nodes.length
      subgraph = new Graph.Graph();

      for node in sub.nodes
        @graph.remove node, true
        subgraph.add node, true

      block = new Block.Callback subgraph
      @_append block.node

    @

  isolate: () ->
    throw "Popping factory stack too far" if @_stack.length <= 2

    @next()._pop()

    sub = @_pop()
    main = @_state

    if sub.nodes.length
      subgraph = new Graph.Graph();

      for node in sub.nodes
        @graph.remove node, true
        subgraph.add node, true

      block = new Block.Isolate subgraph

      @_append block.node

    @

  group: () ->
    @_push()
    @_push()

    @

  next: () ->
    sub = @_pop()

    @_state.start = @_state.start.concat sub.start
    @_state.end   = @_state.end  .concat sub.end
    @_state.nodes = @_state.nodes.concat sub.nodes

    @_push()

    @

  pass: () ->
    @next()

    @_state.end = @_stack[2].end

    @combine()

  combine: () ->
    throw "Popping factory stack too far" if @_stack.length <= 2

    @next()._pop()

    sub  = @_pop()
    main = @_state

    for to in sub.start
      from.connect to, true for from in main.end

    main.end = sub.end

    @

  end: () ->

    graph = @graph;

    @graph  = new Graph.Graph();
    @_state = new State
    @_stack = [@_state]

    # Add compile method.
    if graph
      graph.compile = () -> Program.compile graph.tail().owner

    graph

  compile: () ->
    @end().compile()

  _shader: (name, uniforms) ->
    snippet = @library.fetch name
    snippet.apply uniforms
    block = new Block.Shader snippet
    block.node

  _push: () ->
    @_stack.unshift new State
    @_state = @_stack[0]

  _pop: () ->
    @_state = @_stack[1]
    @_stack.shift()

  _append: (node) ->
    @graph.add node

    end.connect(node) for end in @_state.end

    @_state.start = [node] if !@_state.start.length
    @_state.end   = [node]
    @_state.nodes.push node

    @

  _prepend: (node) ->
    @graph.add node

    node.connect(start) for start in @_state.start

    @_state.end   = [node] if !@_state.end.length
    @_state.start = [node]
    @_state.nodes.push node

    @

class State
  constructor: (@start = [], @end = [], @nodes = []) ->

module.exports = Factory