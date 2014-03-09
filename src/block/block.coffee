Graph = require '../graph'

class Block
  constructor: () ->
    @node = new Graph.Node @, @makeOutlets()

  link: (program, outlet, depth = 0) ->
  call: (program, depth = 0) ->

  _link: (program, module, outlet) ->
    program.link @node, module, outlet

  _include: (program, module) ->
    program.include @node, module

  _call: (program, module, depth) ->
    program.call @node, module, depth

    # Look up inputs
    for outlet in @node.inputs
      previous = outlet.input?.node.owner

      # Callback type
      if outlet.type[0] == '('
        previous?.link program, outlet, depth + 1
      else
        previous?.call program, depth + 1

    program

module.exports = Block