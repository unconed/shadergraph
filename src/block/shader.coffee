Block   = require './block'

class Shader extends Block
  constructor: (@snippet) ->
    @namespace = @snippet.namespace
    super

  externals: () ->
    @snippet.externals

  makeOutlets: () ->
    outlets = []
    outlets = outlets.concat @snippet.main.signature
    outlets.push external for key, external of @snippet.externals

    outlets

  solo: (phase) -> @snippet

  call: (program, phase, depth = 0) ->
    @_call @snippet, program, phase, depth

module.exports = Shader