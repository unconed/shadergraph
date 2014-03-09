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

  solo: (phase) ->
    @subroutine = Program.compile @graph.tail().owner, phase, @namespace

  link: (program, phase, name, external) ->
    @solo     phase
    @_include @subroutine, program
    @_link    @subroutine, program, phase, name, external

module.exports = Callback