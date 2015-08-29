Graph     = require('../graph').Graph
Block     = require '../block'
Visualize = require '../visualize'

###
  Chainable factory
  
  Exposes methods to build a graph incrementally
###
class Factory
  constructor: (@language, @fetch, @config) ->
    @graph()

  # Combined call/concat shortcut
  pipe: (name, uniforms, namespace, defines) ->
    if name instanceof Factory
      @_concat name
    else if name?
      @_call name, uniforms, namespace, defines
    @

  # Old name
  call: (name, uniforms, namespace, defines) ->
    @pipe name, uniforms, namespace, defines

  # Combined callback/import shortcut
  require: (name, uniforms, namespace, defines) ->
    if name instanceof Factory
      @_import name
    else if name?
      @callback()
      @_call name, uniforms, namespace, defines
      @end()
    @

  # Old name
  import: (name, uniforms, namespace, defines) ->
    @require name, uniforms, namespace, defines

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
    @end()
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
    @end() while @_stack?.length > 1

    # Remember terminating node(s) of graph
    if @_graph
      @_tail @_state, @_graph

    graph = @_graph

    @_graph = new Graph
    @_state = new State
    @_stack = [@_state]

    graph

  # Compile shortcut (graph is thrown away)
  compile: (namespace = 'main') ->
    @graph().compile namespace

  # Link shortcut (graph is thrown away)
  link: (namespace = 'main') ->
    @graph().link namespace

  # Serialize for debug
  serialize: () ->
    Visualize.serialize @_graph

  # Return true if empty
  empty: () -> @_graph.nodes.length == 0

  # Concatenate existing factory onto tail
  # Retains original factory
  _concat: (factory) ->
    # Ignore empty concat
    return @ if factory._state.nodes.length == 0

    @_tail factory._state, factory._graph

    try
      block = new Block.Isolate factory._graph
    catch error
      Visualize.inspect error, @_graph, factory if @config.autoInspect
      throw error

    @_auto block
    @

  # Add existing factory as callback
  # Retains original factory
  _import: (factory) ->
    # Check for empty require
    throw "Can't import empty callback" if factory._state.nodes.length == 0

    @_tail factory._state, factory._graph

    try
      block = new Block.Callback factory._graph
    catch error
      Visualize.inspect error, @_graph, factory if @config.autoInspect
      throw error

    @_auto block
    @

  # Connect parallel branches to tail
  _combine: (sub, main) ->
    for to in sub.start
      from.connect to, sub.multi for from in main.end

    main.end   = sub.end
    main.nodes = main.nodes.concat sub.nodes

  # Make subgraph and connect to tail 
  _isolate: (sub, main) ->
    if sub.nodes.length
      subgraph = @_subgraph sub
      @_tail sub, subgraph

      try
        block = new Block.Isolate subgraph
      catch error
        Visualize.inspect error, @_graph, subgraph if @config.autoInspect
        throw error

      @_auto block

  # Convert to callback and connect to tail
  _callback: (sub, main) ->
    if sub.nodes.length
      subgraph = @_subgraph sub
      @_tail sub, subgraph

      try
        block = new Block.Callback subgraph
      catch error
        Visualize.inspect error, @_graph, subgraph if @config.autoInspect
        throw error

      @_auto block

  # Create next call block
  _call: (name, uniforms, namespace, defines) ->
    snippet = @fetch name
    snippet.bind @config, uniforms, namespace, defines
    block = new Block.Call snippet
    @_auto block

  # Move current state into subgraph
  _subgraph: (sub) ->
    subgraph = new Graph null, @_graph
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
      @_graph.add tail

    # Save single endpoint
    graph.tail = tail[0]
    state.end  = tail
    state.tail = []

    if !graph.tail
      throw new Error "Cannot finalize empty graph"

    # Add compile/link/export/inspect shortcut methods
    graph.compile = (namespace = 'main') =>
      try
        graph.tail.owner.compile @language, namespace
      catch error
        graph.inspect(error) if @config.autoInspect
        throw error

    graph.link    = (namespace = 'main') =>
      try
        graph.tail.owner.link    @language, namespace
      catch error
        graph.inspect(error) if @config.autoInspect
        throw error

    graph.export  = (layout, depth) =>
      graph.tail.owner.export  layout, depth

    graph.inspect = (message = null) ->
      Visualize.inspect message, graph

  # Create group for branches or callbacks
  _group: (op, multi) ->
    @_push op, multi # Accumulator
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
  _push: (op, multi) ->
    @_stack.unshift new State op, multi
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
  constructor: (@op = null, @multi = false, @start = [], @end = [], @nodes = [], @tail = []) ->

module.exports = Factory