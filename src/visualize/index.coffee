Graph = require('../Graph').Graph

exports.serialize = serialize = require './serialize'
exports.markup    = markup    = require './markup'

visualize = (graph) ->
  return unless graph

  graph = graph._graph   if graph._graph?
  return graph if !graph.nodes

  data   = serialize      graph
  markup.process data

exports.visualize = () -> markup.merge (visualize graph for graph in arguments when graph)

exports.inspect = () ->
  contents = exports.visualize.apply null, arguments
  element  = markup.overlay contents

  document.body.appendChild element
  contents.update()

  element
