Graph   = require '../graph'
Block   = require './block'

isCallback = (outlet) -> return outlet.type[0] == '('

###
  Re-use a subgraph as a callback
###
class Callback extends Block
  constructor: (@graph) ->
    super

  refresh: () ->
    super
    delete @subroutine

  clone: () ->
    new Callback @graph

  makeOutlets: () ->
    outlets = []
    ins     = []
    outs    = []

    # Pass-through existing callbacks
    # Collect open inputs/outputs
    handle = (outlet, list) =>
      if isCallback outlet
        if outlet.inout == Graph.IN
          # Export open callback inputs
          outlets.push outlet.dupe outlet.name
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
    @make() if !@subroutine?
    @subroutine

  export: (layout, depth) ->
    return unless layout.visit @namespace, depth
    @make() if !@subroutine?

    @_link     @subroutine, layout, depth
    @graph.export layout, depth

  callback: (layout, depth, name, external, outlet) ->
    @make() if !@subroutine?
    @_include  @subroutine, layout, depth
    @_callback @subroutine, layout, depth, name, external, outlet

module.exports = Callback