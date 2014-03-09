Block   = require './block'
Shader  = require './block'

class Material extends Block
  constructor: (@vertex, @fragment) ->
    @snippets = [@vertex, @fragment]
    @namespace = @vertex.namespace
    super

  externals: () ->
    ext = {}
    for snippet in @snippets
      ext[key] = def for key, def of snippet.externals
    ext

  makeOutlets: () ->
    outlets = []
    for snippet in @snippets
      outlets = outlets.concat snippet.main.signature
      outlets.push external for key, external of snippet.externals

    outlets

  solo: (phase) ->
    @snippets[{vertex: 0, fragment: 1}[phase]]

  call: (program, phase, depth = 0) ->
    @_call    program, solo(phase), phase, depth

module.exports = Shader