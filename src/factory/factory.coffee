Graph   = require('../graph').Graph
Block   = require '../block'

###
  Chainable factory
  
  Exposes methods to build a graph incrementally
###
class Factory
  constructor: (@language, @fetch) ->
    @end()

  # Block creation
  call: (name, uniforms) ->
    @_call name, uniforms
    @

  # Create parallel branches that connect as one block to the tail
  split: () ->
    @_group '_combine', true
    @

  # Create parallel branches that fan out from the tail (multiple outgoing connections per outlet)
  fan: () ->
    @_group '_combine', false
    @

  # Create isolated subgraph
  isolate: () ->
    @_group '_isolate'
    @

  # Create isolated subgraph
  callback: () ->
    @_group '_callback'
    @

  # Next branch in group
  next: () ->
    @_next()
    @

  # Connect branches to previous tail and add pass-through from tail
  pass: () ->
    pass = @_stack[2].end
    @join()
    @_state.end = @_state.end.concat pass
    @

  # Leave nested branches and join up with main graph,
  # applying stored op along the way
  join: () ->
    [sub, main] = @_exit()
    op = sub.op
    if @[op]
      @[op] sub, main
    @

  # Concatenate existing factory onto tail
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
  import: (factory) ->
    @callback()
    @concat factory
    @join()

  # Return finalized graph / reset factory
  end: () ->
    # Pop remaining stack
    @join() while @_stack?.length > 1

    # Remember terminating node(s) of graph
    if @graph
      @_tail @_state, @graph

    graph = @graph

    @graph  = new Graph
    @_state = new State
    @_stack = [@_state]

    graph

  # Compile shortcut
  compile: (namespace) ->
    @end().compile namespace

  # Link shortcut
  link: (namespace) ->
    @end().link namespace

  # Connect parallel branches to tail
  _combine: (sub, main) ->
    for to in sub.start
      from.connect to, sub.empty for from in main.end

    main.end = sub.end

  # Make subgraph and connect to tail 
  _isolate: (sub, main) ->
    if sub.nodes.length
      subgraph = @_subgraph sub
      block = new Block.Isolate subgraph

      @_tail   sub, subgraph
      @_append block

  # Convert to callback and connect to tail
  _callback: (sub, main) ->
    if sub.nodes.length
      subgraph = @_subgraph sub
      block = new Block.Callback subgraph

      @_tail   sub, subgraph
      @_append block

  # Create call block
  _call: (name, uniforms) ->
    snippet = @fetch name
    snippet.bind uniforms
    @_append new Block.Call snippet

  # Move current state into subgraph
  _subgraph: (sub) ->
    subgraph = new Graph
    subgraph.adopt sub.nodes
    subgraph

  # Finalize graph tail
  _tail: (state, graph) ->

    # Merge multiple ends into single tail node
    if state.end.length > 1
      tail = new Block.Join state.end
      state.end  = [tail.node]

    graph.tail = state.end[0]

    # Add compile/link/export shortcut methods
    graph.compile = (namespace) =>
      graph.tail.owner.compile @language, namespace

    graph.link    = (namespace) =>
      graph.tail.owner.link    @language, namespace

    graph.export  = (layout) =>
      graph.tail.owner.export  layout

  # Create group for branches or callbacks
  _group: (op, empty) ->
    @_push op, empty # Accumulator
    @_push()         # Current
    @

  # Merge branch into accumulator and reset state
  _next: () ->
    sub = @_pop()

    @_state.start = @_state.start.concat sub.start
    @_state.end   = @_state.end  .concat sub.end
    @_state.nodes = @_state.nodes.concat sub.nodes

    @_push()

  # Exit nested branches
  _exit: () ->
    @_next()
    @_pop()
    [@_pop(), @_state]

  # State stack
  _push: (op, empty) ->
    @_stack.unshift new State op, empty
    @_state = @_stack[0]

  _pop: () ->
    @_state = @_stack[1]
    @_state ?= new State
    @_stack.shift() ? new State

  # Add block and connect to end
  _append: (block) ->
    node = block.node
    @graph.add node

    end.connect node for end in @_state.end

    @_state.start = [node] if !@_state.start.length
    @_state.end   = [node]
    @_state.nodes.push node

  # Add block and connect to start
  _prepend: (block) ->
    node = block.node
    @graph.add node

    node.connect start for start in @_state.start

    @_state.end   = [node] if !@_state.end.length
    @_state.start = [node]
    @_state.nodes.push node

  # Insert loose block
  _insert: (block) ->
    node = block.node
    @graph.add node
    @_state.nodes.push node

class State
  constructor: (@op = null, @empty = false, @start = [], @end = [], @nodes = []) ->

module.exports = Factory