# Dump graph for debug/visualization purposes
Block = require '../block'

isCallback = (outlet) -> outlet.type[0] == '('

serialize = (graph) ->

  nodes = []
  links = []

  for node in graph.nodes
    record =
      # Data
      id:    node.id
      name:  null
      type:  null
      depth: null
      graph: null
      inputs:  []
      outputs: []

    nodes.push record

    inputs  = record.inputs
    outputs = record.outputs

    block = node.owner

    if      block instanceof Block.Call
      record.name  = block.snippet._name
      record.type  = 'call'
      record.code  = block.snippet._original

    else if block instanceof Block.Callback
      record.name  = "Callback"
      record.type  = 'callback'
      record.graph = serialize block.graph

    else if block instanceof Block.Isolate
      record.name  = 'Isolate'
      record.type  = 'isolate'
      record.graph = serialize block.graph

    else if block instanceof Block.Join
      record.name  = 'Join'
      record.type  = 'join'

    else if block?
      record.name ?= block.name ? block.type
      record.type ?= block.type
      record.code ?= block.code
      record.graph = serialize block.graph if block.graph?

    format = (type) ->
      type = type.replace ")(", ")→("
      type = type.replace "()", ""

    for outlet in node.inputs
      inputs.push
        id:   outlet.id
        name: outlet.name
        type: format outlet.type
        open: !outlet.input?

    for outlet in node.outputs
      outputs.push
        id:   outlet.id
        name: outlet.name
        type: format outlet.type
        open: !outlet.output.length

      for other in outlet.output
        links.push
          from: node.id
          out:  outlet.id
          to:   other.node.id
          in:   other.id
          type: format outlet.type

  {nodes, links}

module.exports = serialize