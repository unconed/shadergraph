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

    #    outlets = outlets.concat @snippet.main

    outlets

  solo: () -> @snippet

  link: (program, name, external) ->
    @_include program, @snippet
    @_link    program, @snippet, name, external

  call: (program, depth = 0) ->
    @_call    program, @snippet, depth

module.exports = Shader