Graph   = require('./graph').Graph
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

    outlets = outlets.concat @graph.outputs()

    outlets.push
      name: 'callback'
      type: type
      inout: Graph.OUT

    outlets

  compile: (program, depth = 0) ->
    subroutine = Program.compile graph.tail().owner

    program.add @node, subroutine, depth, false

    # Look up inputs
    for outlet in @node.inputs
      previous = outlet.input?.node.owner
      previous?.compile program, depth + 1

    program

module.exports = Shader