Block   = require './block'

class Call extends Block
  constructor: (@snippet) ->
    @namespace = @snippet.namespace
    super

  makeOutlets: () ->
    outlets = []
    outlets = outlets.concat @snippet.main.signature
    outlets.push external for key, external of @snippet.externals

    outlets

  call: (program, depth = 0) ->
    @_call @snippet, program, depth

module.exports = Call