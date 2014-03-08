Block = require './block'

class Shader extends Block
  constructor: (@snippet) ->
    super

  makeOutlets: () ->
    outlets = []
    outlets = outlets.concat @snippet.main.signature
    outlets.push external for key, external of @snippet.externals

    #    outlets = outlets.concat @snippet.main

    outlets

module.exports = Shader