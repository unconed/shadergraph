Graph = require('../Graph').Graph

exports.serialize = serialize = require './serialize'
exports.markup    = markup    = require './markup'

visualize = (graph) ->
  graph  = graph._graph   if graph._graph?
  data   = serialize      graph
  markup.process data

exports.visualize = () -> markup.merge (visualize graph for graph in arguments)

exports.inspect = () ->
  contents = visualize.apply null, arguments
  element  = markup.overlay contents

  document.body.appendChild element
  contents.update()

  element
