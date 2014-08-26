Graph   = require('../graph').Graph
Block   = require '../block'

###
  Chainable factory
  
  Exposes methods to build a graph incrementally
###
class Factory
  constructor: (@language, @fetch, @config) ->
    @graph()

  # Combined call/concat shortcut
  pipe: (name, uniforms, namespace) ->
    if name instanceof Factory
      @_concat name
    else
      @_call name, uniforms, namespace
    @

  # Old name
  call: (name, uniforms, namespace) ->
    @pipe name, uniforms, namespace

  # Combined callback/import shortcut
  require: (name, uniforms, namespace) ->
    if name instanceof Factory
      @_import name
    else
      @callback()
      @_call name, uniforms, namespace
      @join()
    @

  # Old name
  import: (name, uniforms, namespace) ->
    @require name, uniforms, namespace

  # Create parallel branches that connect as one block to the end
  # (one outgoing connection per outlet)
  split: () ->
    @_group '_combine', true
    @

  # Create parallel branches that fan out from the end
  # (multiple outgoing connections per outlet)
  fan: () ->
    @_group '_combine', false
    @

  # Create isolated subgraph
  isolate: () ->
    @_group '_isolate'
    @

  # Create callback subgraph
  callback: () ->
    @_group '_callback'
    @

  # Next branch in group
  next: () ->
    @_next()
    @

  # Connect branches to previous tail and add pass-through from end
  pass: () ->
    pass = @_stack[2].end
    @join()
    @_state.end = @_state.end.concat pass
    @

  # Leave nested branches and join up with main graph,
  # applying stored op along the way
  end: () ->
    [sub, main] = @_exit()
    op = sub.op
    if @[op]
      @[op] sub, main
    @

  # Old name
  join: () ->
    @end()

  # Return finalized graph / reset factory
  graph: () ->
    # Pop remaining stack
    @join() while @_stack?.length > 1

    # Remember terminating node(s) of graph
    if @_graph
      @_tail @_state, @_graph

    graph = @_graph

    @_graph = new Graph
    @_state = new State
    @_stack = [@_state]

    graph

  # Compile shortcut (graph is thrown away)
  compile: (namespace) ->
    @graph().compile namespace

  # Link shortcut (graph is thrown away)
  link: (namespace) ->
    @graph().link namespace

  # Concatenate existing factory onto tail
  # Retains original factory
  _concat: (factory) ->
    block = new Block.Isolate factory._graph

    @_tail factory._state, factory._graph
    @_auto block
    @

  # Add existing factory as callback
  # Retains original factory
  _import: (factory) ->
    block = new Block.Callback factory._graph

    @_tail   factory._state, factory._graph
    @_auto block
    @

  # Connect parallel branches to tail
  _combine: (sub, main) ->
    for to in sub.start
      from.connect to, sub.empty for from in main.end

    main.end   = sub.end
    main.nodes = main.nodes.concat sub.nodes

  # Make subgraph and connect to tail 
  _isolate: (sub, main) ->
    if sub.nodes.length
      subgraph = @_subgraph sub
      block = new Block.Isolate subgraph

      @_tail sub, subgraph
      @_auto block

  # Convert to callback and connect to tail
  _callback: (sub, main) ->
    if sub.nodes.length
      subgraph = @_subgraph sub
      block = new Block.Callback subgraph

      @_tail sub, subgraph
      @_auto block

  # Create next call block
  _call: (name, uniforms, namespace) ->
    snippet = @fetch name
    snippet.bind @config, uniforms, namespace
    block = new Block.Call snippet
    @_auto block

  # Move current state into subgraph
  _subgraph: (sub) ->
    subgraph = new Graph
    subgraph.adopt sub.nodes
    subgraph

  # Finalize graph tail
  _tail: (state, graph) ->

    # Merge (unique) terminating ends into single tail node if needed
    tail = state.end.concat state.tail
    tail = tail.filter (node, i) -> tail.indexOf(node) == i

    if tail.length > 1
      tail = new Block.Join tail
      tail = [tail.node]

    # Save single endpoint
    graph.tail = tail[0]
    state.end  = tail
    state.tail = []

    if !graph.tail
      throw "Cannot finalize empty graph"

    # Add compile/link/export shortcut methods
    graph.compile = (namespace) =>
      graph.tail.owner.compile @language, namespace

    graph.link    = (namespace) =>
      graph.tail.owner.link    @language, namespace

    graph.export  = (layout, depth) =>
      graph.tail.owner.export  layout, depth

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
    @_state.tail  = @_state.tail .concat sub.tail

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

  # Auto append or insert depending on whether we have inputs
  _auto: (block) ->
    if block.node.inputs.length
      @_append block
    else
      @_insert block

  # Add block and connect to end
  _append: (block) ->
    node = block.node
    @_graph.add node

    end.connect node for end in @_state.end

    @_state.start = [node] if !@_state.start.length
    @_state.end   = [node]

    @_state.nodes.push node
    @_state.tail .push node if !node.outputs.length

  # Add block and connect to start
  _prepend: (block) ->
    node = block.node
    @_graph.add node

    node.connect start for start in @_state.start

    @_state.end   = [node] if !@_state.end.length
    @_state.start = [node]

    @_state.nodes.push node
    @_state.tail .push node if !node.outputs.length

  # Insert loose block
  _insert: (block) ->
    node = block.node
    @_graph.add node

    @_state.start.push node
    @_state.end  .push node

    @_state.nodes.push node
    @_state.tail .push node if !node.outputs.length

class State
  constructor: (@op = null, @empty = false, @start = [], @end = [], @nodes = [], @tail = []) ->

module.exports = Factory