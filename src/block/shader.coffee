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

  call: (program, depth = 0) ->
    @_call    program, @snippet, depth

module.exports = Shader