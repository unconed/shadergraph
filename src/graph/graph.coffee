###
  Graph of nodes with outlets
###
class Graph
  @index: 0
  @id: (name) -> ++Graph.index

  @IN: 0
  @OUT: 1

  constructor: (nodes, @parent = null) ->
    @id    = Graph.id()
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

  getIn:  (name) -> (outlet for outlet in @inputs()  when outlet.name == name)[0]
  getOut: (name) -> (outlet for outlet in @outputs() when outlet.name == name)[0]

  add: (node, ignore) ->

    if node.length
      @add(_node) for _node in node
      return

    throw "Adding node to two graphs at once" if node.graph and !ignore

    node.graph = @
    @nodes.push node

  remove: (node, ignore) ->
    if node.length
      @remove(_node) for _node in node
      return

    throw "Removing node from wrong graph." if node.graph != @

    ignore || node.disconnect()

    @nodes.splice @nodes.indexOf(node), 1
    node.graph = null

  adopt: (node) ->
    if node.length
      @adopt(_node) for _node in node
      return

    node.graph.remove node, true
    @.add node, true

module.exports = Graph
