Graph   = require '../graph'
Block   = require './block'

###
  Re-use a subgraph as a callback
###
class Callback extends Block
  constructor: (@graph) ->
    super()

  refresh: () ->
    super()
    delete @subroutine

  clone: () ->
    new Callback @graph

  makeOutlets: () ->
    @make()

    outlets = []
    ins     = []
    outs    = []

    # Pass-through existing callbacks
    # Collect open inputs/outputs
    handle = (outlet, list) =>
      if outlet.meta.callback
        if outlet.inout == Graph.IN
          # Dupe outlet and create two-way link between cloned outlets
          dupe = outlet.dupe()
          dupe  .meta.child ?= outlet
          outlet.meta.parent = dupe

          outlets.push dupe
      else
        list.push outlet.type

    handle outlet, ins  for outlet in @graph.inputs()
    handle outlet, outs for outlet in @graph.outputs()

    # Merge inputs/outputs into new callback signature
    ins  = ins.join  ','
    outs = outs.join ','
    type = "(#{ins})(#{outs})"

    outlets.push
      name:  'callback'
      type:  type
      inout: Graph.OUT
      meta:
        callback: true
        def: @subroutine.main

    outlets

  make: () ->
    @subroutine = @graph.compile @namespace

  export: (layout, depth) ->
    return unless layout.visit @namespace, depth

    @_link     @subroutine, layout, depth
    @graph.export layout, depth

  call: (program, depth) ->
    @_require  @subroutine, program, depth

  callback: (layout, depth, name, external, outlet) ->
    @_include  @subroutine, layout, depth
    @_callback @subroutine, layout, depth, name, external, outlet

module.exports = Callback
