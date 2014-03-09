Graph   = require '../graph'
Block   = require './block'
Program = require('../linker')

class Isolate extends Block
  constructor: (@graph) ->
    super
    @namespace = Program.entry()

  makeOutlets: () ->
    outlets = []

    for outlet in @graph.inputs()
      outlets.push outlet

    for outlet in @graph.outputs()
      outlets.push outlet

    outlets

  externals: () ->
    @subroutine?.externals ? {}

  solo: (phase) ->
    @subroutine = Program.compile @graph.tail().owner, phase, @namespace

  call: (program, phase, depth = 0) ->
    @solo  phase
    @_call @subroutine, program, phase, depth

module.exports = Isolate