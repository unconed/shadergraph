###
  Graph of shader nodes.
###
class Graph

  @IN: 0
  @OUT: 1

  constructor: (nodes, @parent = null) ->
    @nodes = []
    nodes && @add nodes

  inputs: () ->
    inputs = []
    for node in @nodes
      inputs.push(outlet) for outlet in node.inputs when outlet.input == null
    return inputs

  outputs: () ->
    outputs = []
    for node in @nodes
      outputs.push(outlet) for outlet in node.outputs when outlet.output.length == 0
    return outputs

  tail: () ->
    @nodes[@nodes.length - 1]

  add: (node, ignore) ->

    if node.length
      @add(_node) for _node in node
      return

    throw "Adding node to two graphs at once" if node.graph and !ignore

    node.setGraph @
    @nodes.push node

  remove: (node, ignore) ->
    if node.length
      @remove(_node) for _node in node
      return

    throw "Removing node from wrong graph." if node.graph != @

    ignore || node.disconnect()

    @nodes.splice @nodes.indexOf(node), 1
    node.setGraph null

module.exports = Graph
