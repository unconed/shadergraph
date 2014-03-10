Block   = require './block'

class Shader extends Block
  constructor: (@snippet) ->
    @namespace = @snippet.namespace
    super

  makeOutlets: () ->
    outlets = []
    outlets = outlets.concat @snippet.main.signature
    outlets.push external for key, external of @snippet.externals

    outlets

  call: (program, phase, depth = 0) ->
    @_call    @snippet, program, phase, depth

  _externals: () ->
    @snippet.externals


module.exports = Shader