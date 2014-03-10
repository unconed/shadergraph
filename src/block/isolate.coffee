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

  make: (phase) ->
    @subroutine = Program.compile @graph.tail().owner, phase, @namespace

  fetch: (outlet) ->
    # Fetch subroutine for outlet
    outlet = (o for o in @graph.outputs() when o.name == outlet.name)[0]
    outlet.node.owner.fetch outlet if outlet?

  link: (program, phase, name, external, outlet) ->
    subroutine = fetch outlet
    @_include subroutine, program
    @_link    subroutine, program, phase, name, external

  call: (program, phase, depth = 0) ->
    @make  phase
    @_call @subroutine, program, phase, depth

  _externals: () ->
    @subroutine?.externals ? {}


module.exports = Isolate