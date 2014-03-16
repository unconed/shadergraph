Graph   = require '../graph'
Block   = require './block'

###
  Re-use a subgraph as a callback
###
class Callback extends Block
  constructor: (@graph) ->
    super

  makeOutlets: () ->
    outlets = []

    ins  = []
    outs = []

    isCallback = (type) -> return type[0] == '('

    for outlet in @graph.inputs()
      if isCallback outlet
        outlets.push outlet.dupe()
      else
        ins.push outlet.type

    for outlet in @graph.outputs()
      if isCallback outlet
        outlets.push outlet.dupe()
      else
        outs.push outlet.type

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

  compile: () ->
    @make()
    @subroutine

  fetch: (outlet) ->
    @make()
    @subroutine

  link: (program, name, external, outlet) ->
    @make()
    @_include @subroutine, program
    @_link    @subroutine, program, name, external

module.exports = Callback