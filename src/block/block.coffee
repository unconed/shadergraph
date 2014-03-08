Graph = require '../graph'

class Block
  constructor: () ->
    @node = new Graph.Node @, @makeOutlets()

  compile: () ->
    throw "Block cannot be compiled"

module.exports = Block