Block   = require './block'

class Shader extends Block
  constructor: (@snippet) ->
    @namespace = @snippet.namespace
    super

  makeOutlets: () ->
    outlets = []
    outlets = outlets.concat @snippet.main.signature
    outlets.push external for key, external of @snippet.externals

    #    outlets = outlets.concat @snippet.main

    outlets

  compile: (program, depth = 0) ->
    program.add @node, @snippet, depth, true

    # Look up inputs
    for outlet in @node.inputs
      previous = outlet.input?.node.owner
      previous?.compile program, depth + 1

    program

module.exports = Shader