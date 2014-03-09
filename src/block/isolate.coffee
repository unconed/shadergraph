Block   = require './block'
Program = require('../linker').Program

class Isolate extends Block
  constructor: (@graph) ->
    super

  makeOutlets: () ->
    outlets = []

    ins  = []
    outs = []

    for outlet in @graph.inputs()
      ins.push outlet.type
      outlets.push outlet

    for outlet in @graph.outputs()
      outs.push outlet.type
      outlets.push outlet

    ins  = ins.join  ','
    outs = outs.join ','
    type = '(#{ins})(#{outs})'

    outlets.push
      name:  'callback'
      type:  type
      inout: Graph.OUT

    outlets

  link: (program, outlet, depth = 0) ->
    subroutine = Program.compile graph.tail().owner
    @_include program, subroutine
    @_link    program, subroutine, outlet

  call: (program, depth = 0) ->
    subroutine = Program.compile graph.tail().owner
    @_call    program, subroutine, depth

module.exports = Isolate