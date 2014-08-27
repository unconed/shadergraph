Graph = require('../Graph').Graph

exports.serialize = serialize = require './serialize'
exports.markup    = markup    = require './markup'

visualize = (graph) ->
  graph  = graph._graph   if graph._graph?
  data   = serialize      graph
  markup.process data

exports.visualize = () -> markup.merge (visualize graph for graph in arguments)
