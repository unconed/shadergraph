Block   = require './block'
Shader  = require './block'

class Material extends Block
  constructor: (@vertex, @fragment) ->
    @snippets = [@vertex, @fragment]
    @namespace = @vertex.namespace

    @externals = {}
    for snippet in @snippets
      @externals[key] = def for key, def of snippet.externals

    super

  makeOutlets: () ->
    outlets = []
    for snippet in @snippets
      outlets = outlets.concat snippet.main.signature
      outlets.push external for key, external of snippet.externals

    outlets

  get: (phase) ->
    @snippets[{vertex: 0, fragment: 1}[phase]]

  call: (program, phase, depth = 0) ->
    snippet = get phase
    @_call    snippet, program, phase, depth

  _externals: () ->
    @externals


module.exports = Shader