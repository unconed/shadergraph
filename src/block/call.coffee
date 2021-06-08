Block   = require './block'

class Call extends Block
  constructor: (snippet) ->
    super()
    @snippet = snippet
    @namespace = snippet.namespace

  clone: () ->
    new Call @snippet

  makeOutlets: () ->
    main      = @snippet.main.signature
    externals = @snippet.externals
    symbols   = @snippet.symbols

    params    = (@_outlet outlet,         callback: false for outlet in main)
    callbacks = (@_outlet externals[key], callback: true  for key in symbols)

    params.concat callbacks

  call: (program, depth) ->
    @_call   @snippet, program, depth
    @_inputs @snippet, program, depth

  export: (layout, depth) ->
    return unless layout.visit @namespace, depth

    @_link   @snippet, layout, depth
    @_trace  @snippet, layout, depth

module.exports = Call
