Graph   = require '../graph'
Block   = require './block'

###
  Isolate a subgraph as a single node
###
class Isolate extends Block
  constructor: (@graph) ->
    super

  refresh: () ->
    super
    delete @subroutine

  clone: () ->
    new Isolate @graph

  makeOutlets: () ->
    @make()

    outlets = []
    names = null

    for set in ['inputs', 'outputs']
      seen = {}
      for outlet in @graph[set]()
        # Preserve name of 'return' and 'callback' outlets
        name = undefined
        name = outlet.hint if outlet.hint in ['return', 'callback'] and
                              outlet.inout == Graph.OUT

        # Unless it already exists
        name = undefined  if seen[name]?
        seen[name] = true if name?

        # Dupe outlet and remember link to original
        dupe = outlet.dupe name
        dupe  .meta.child ?= outlet
        outlet.meta.parent = dupe

        outlets.push dupe

    outlets

  make: () ->
    @subroutine = @graph.compile @namespace

  call: (program, depth) ->
    @_call   @subroutine, program, depth
    @_inputs @subroutine, program, depth

  export: (layout, depth) ->
    return unless layout.visit @namespace, depth

    # Link up with normal inputs
    @_link   @subroutine, layout, depth
    @_trace  @subroutine, layout, depth

    # Export callbacks needed to call the subroutine
    @graph.export layout, depth

  callback: (layout, depth, name, external, outlet) ->
    outlet = outlet.meta.child
    outlet.node.owner.callback layout, depth, name, external, outlet

module.exports = Isolate