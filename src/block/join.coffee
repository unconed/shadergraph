Block   = require './block'

###
  Join multiple disconnected nodes
###
class Join extends Block
  constructor: (@nodes) ->
    super

  makeOutlets: () -> []

  call: (program, depth = 0) ->
    for node in @nodes
      block = node.owner
      block.call program, depth

module.exports = Join