Block   = require './block'

class Call extends Block
  constructor: (@snippet) ->
    @namespace = @snippet.namespace
    super

  clone: () ->
    new Call @snippet

  makeOutlets: () ->
    outlets = []
    outlets = outlets.concat @snippet.main.signature
    outlets.push external for key, external of @snippet.externals

    outlets

  call: (program, depth) ->
    @_call   @snippet, program, depth
    @_inputs @snippet, program, depth

  export: (layout, depth) ->
    return unless layout.visit @namespace, depth

    @_link   @snippet, layout, depth
    @_trace  @snippet, layout, depth

module.exports = Call