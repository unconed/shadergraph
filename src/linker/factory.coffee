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

  # Block creation

  snippet: (name, uniforms) ->
    @_append  @_shader name, uniforms

  material: (vertex, fragment, uniforms) ->
    @_append  @_material vertex, fragment, uniforms

  # Create group for branches or callbacks

  group: () ->
    @_push() # Accumulator
    @_push() # Current

    @

  # Create parallel branch in group
  next: () ->
    sub = @_pop()

    @_state.start = @_state.start.concat sub.start
    @_state.end   = @_state.end  .concat sub.end
    @_state.nodes = @_state.nodes.concat sub.nodes

    @_push()

    @

  # Connect parallel branches to parent
  combine: () ->
    [sub, main] = @_combine()

    for to in sub.start
      from.connect to, true for from in main.end

    main.end = sub.end

    @

  # Make subgraph and connect to parent 
  isolate: () ->
    [sub, main] = @_combine()

    if sub.nodes.length
      subgraph = @_subgraph sub
      block = new Block.Isolate subgraph
      @_append block.node

    @

  # Convert to callback and connect to parent
  callback: () ->
    [sub, main] = @_combine()

    if sub.nodes.length
      subgraph = @_subgraph sub
      block = new Block.Callback subgraph
      @_append block.node

    @

  # Add pass-through edge and connect branches to parent
  pass: () ->
    @next()
    @_state.end = @_stack[2].end
    @combine()

  # Return finalized graph / reset factory
  end: () ->

    graph = @graph;

    @graph  = new Graph.Graph();
    @_state = new State
    @_stack = [@_state]

    # Add compile method
    if graph
      graph.compile = () -> Program.compile graph.tail().owner

    graph

  # Compile shortcut
  compile: () ->
    @end().compile()

  # Concatenate existing factory onto end
  concat: (factory) ->
    target = factory._state
    @graph.adopt target.nodes

    for to in target.start
      end.connect to for end in @_state.end

    @_state.start = target.start if !@_state.start.length
    @_state.end   = target.end
    @_state.nodes = @_state.nodes.concat target.nodes

    factory.end()

    @

  # Add existing factory as callback
  link: (factory) ->
    @group()
    @concat factory
    @callback()

  # Create shader block
  _shader: (name, uniforms) ->
    snippet = @library.fetch name
    snippet.apply uniforms
    block = new Block.Shader snippet
    block.node

  # Create material block
  _material: (vertex, fragment, uniforms) ->
    vertex   = @library.fetch vertex
    fragment = @library.fetch fragment

    vertex  .apply uniforms
    fragment.apply uniforms, vertex.namespace

    block = new Block.Material vertex, fragment
    block.node

  # Move current state into subgraph
  _subgraph: (sub) ->
    subgraph = new Graph.Graph();
    subgraph.adopt sub.nodes
    subgraph

  # Merge final branch into accumulator and pop
  _combine: () ->
    throw "Popping factory stack too far" if @_stack.length <= 2

    @next()._pop()
    [@_pop(), @_state]

  # State stack
  _push: () ->
    @_stack.unshift new State
    @_state = @_stack[0]

  _pop: () ->
    @_state = @_stack[1]
    @_stack.shift()

  # Add node and connect to end
  _append: (node) ->
    @graph.add node

    end.connect(node) for end in @_state.end

    @_state.start = [node] if !@_state.start.length
    @_state.end   = [node]
    @_state.nodes.push node

    @

  # Add node and connect to start
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