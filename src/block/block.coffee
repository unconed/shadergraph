Graph = require '../graph'

class Block
  constructor: () ->
    @node = new Graph.Node @, @makeOutlets()

  link: (program, name, external) ->
  call: (program, depth = 0) ->
  externals: () -> {}
  solo: () ->

  _link: (program, module, name, external) ->
    program.link @node, module, name, external

  _include: (program, module) ->
    program.include @node, module

  _call: (program, module, depth) ->
    program.call @node, module, depth

    # Look up inputs
    for outlet in @node.inputs
      previous = outlet.input?.node.owner

      # Callback type
      if outlet.type[0] == '('
        for key, ext of @externals() when ext.name == outlet.name
          external = ext
          name     = key
        previous?.link program, name, external
      else
        previous?.call program, depth + 1

    program

module.exports = Block