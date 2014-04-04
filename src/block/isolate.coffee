Graph   = require '../graph'
Block   = require './block'

###
  Isolate a subgraph as a single node
###
class Isolate extends Block
  constructor: (@graph) ->
    super

  clone: () ->
    new Isolate @graph

  makeOutlets: () ->
    outlets = []
    names = null

    for set in ['inputs', 'outputs']
      for outlet in @graph[set]()
        # Preserve name of 'return' outlets
        hint = undefined
        hint = 'return' if outlet.hint == 'return'

        outlets.push outlet.dupe hint

    outlets

  make: () ->
    @subroutine = @graph.compile @namespace

  call: (program, depth) ->
    @make()  if !@subroutine?
    @_call   @subroutine, program, depth
    @_inputs @subroutine, program, depth

  export: (layout) ->
    @make()  if !@subroutine?
    @_link  @subroutine, layout
    @_trace @subroutine, layout
    @graph.export layout

  fetch: (outlet) ->
    # Fetch subroutine from either nested Isolate or Callback block
    outlet = @graph.getOut outlet.name
    outlet?.node.owner.fetch outlet

  callback: (layout, name, external, outlet) ->
    subroutine = @fetch outlet
    @_include  subroutine, layout
    @_callback subroutine, layout, name, external, outlet

module.exports = Isolate