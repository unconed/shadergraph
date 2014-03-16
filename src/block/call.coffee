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

  call: (program, depth) ->
    @_call   @snippet, program, depth
    @_inputs @snippet, program, depth

  export: (layout) ->
    @_link   @snippet, layout
    @_trace  @snippet, layout

module.exports = Call