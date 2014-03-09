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
    @append name, uniforms

  append: (name, uniforms) ->
    @_append  @_shader name, uniforms

  prepend: (name, uniforms) ->
    @_prepend @_shader name, uniforms

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
    [sub, main] = @_combine()

    for to in sub.start
      from.connect to, true for from in main.end

    main.end = sub.end

    @

  isolate: () ->
    [sub, main] = @_combine()

    if sub.nodes.length
      subgraph = @_subgraph sub
      block = new Block.Isolate subgraph
      @_append block.node

    @

  callback: () ->
    [sub, main] = @_combine()

    if sub.nodes.length
      subgraph = @_subgraph sub
      block = new Block.Callback subgraph
      @_append block.node

    @

  end: () ->

    graph = @graph;

    @graph  = new Graph.Graph();
    @_state = new State
    @_stack = [@_state]

    # Add compile method
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

  _subgraph: (sub) ->
    subgraph = new Graph.Graph();

    for node in sub.nodes
      @graph.remove node, true
      subgraph.add node, true

    subgraph

  _combine: () ->
    throw "Popping factory stack too far" if @_stack.length <= 2

    @next()._pop()

    [@_pop(), @_state]

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