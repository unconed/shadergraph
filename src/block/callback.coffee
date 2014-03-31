Graph   = require '../graph'
Block   = require './block'

###
  Re-use a subgraph as a callback
###
class Callback extends Block
  constructor: (@graph) ->
    super

  clone: () ->
    new Callback @graph

  makeOutlets: () ->
    outlets = []
    ins     = []
    outs    = []

    isCallback = (type) -> return type[0] == '('

    # Pass-through existing callbacks
    # Collect open inputs/outputs
    handle = (outlet, list) =>
      if isCallback outlet
        outlets.push outlet.dupe()
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

    outlets

  make: () ->
    @subroutine = @graph.compile @namespace

  fetch: (outlet) ->
    @make()
    @subroutine

  callback: (layout, name, external, outlet) ->
    @make() if !@subroutine?
    @_include  @subroutine, layout
    @_callback @subroutine, layout, name, external, outlet

  export: (layout) ->
    @_link     @subroutine, layout
    @graph.export layout

module.exports = Callback