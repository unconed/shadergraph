Graph = require '../graph'

class Block
  constructor: () ->
    @node = new Graph.Node @, @makeOutlets?() ? {}

  link: (program, name, external) ->
  call: (program, depth = 0) ->
  externals: () -> {}

  _link: (module, program, phase, name, external) ->
    program.link    @node, module, name, external

  _include: (module, program) ->
    program.include @node, module

  _call: (module, program, phase, depth) ->
    program.call    @node, module, depth

    # Look up inputs
    for outlet in @node.inputs
      previous = outlet.input?.node.owner

      # Callback type
      if outlet.type[0] == '('
        for key, ext of @externals() when ext.name == outlet.name
          name     = key
          external = ext
        previous?.link program, phase, name, external
      else
        previous?.call program, phase, depth + 1

    program

module.exports = Block