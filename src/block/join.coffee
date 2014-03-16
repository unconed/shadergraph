Block   = require './block'

###
  Join multiple disconnected nodes
###
class Join extends Block
  constructor: (@nodes) ->
    super

  makeOutlets: () -> []

  call: (program, depth) ->
    for node in @nodes
      block = node.owner
      block.call program, depth

  export: (layout) ->
    for node in @nodes
      block = node.owner
      block._export layout

module.exports = Join