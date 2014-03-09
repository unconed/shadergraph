Graph   = require '../graph'
Block   = require './block'
Program = require('../linker')

class Callback extends Block
  constructor: (@graph) ->
    super
    @namespace = Program.entry()

  makeOutlets: () ->
    outlets = []

    ins  = []
    outs = []

    for outlet in @graph.inputs()
      ins.push outlet.type

    for outlet in @graph.outputs()
      outs.push outlet.type

    ins  = ins.join  ','
    outs = outs.join ','
    type = "(#{ins})(#{outs})"

    outlets.push
      name:  'callback'
      type:  type
      inout: Graph.OUT

    outlets

  externals: () ->
    @subroutine?.externals ? {}

  solo: () ->
    @subroutine = Program.compile @graph.tail().owner, @namespace

  link: (program, name, external) ->
    @solo()
    @_include program, @subroutine
    @_link    program, @subroutine, name, external

module.exports = Callback