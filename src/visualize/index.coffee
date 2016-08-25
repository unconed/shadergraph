Graph = require('../graph').Graph

exports.serialize = serialize = require './serialize'
exports.markup    = markup    = require './markup'

visualize = (graph) ->
  return unless graph
  return graph if !graph.nodes

  data   = serialize      graph
  markup.process data

resolve = (arg) ->
  return arg if !arg?
  return arg.map resolve if arg instanceof Array
  return [resolve arg.vertex, resolve arg.fragment] if arg.vertex? && arg.fragment?
  return arg._graph if arg._graph?
  return arg.graph  if arg.graph?
  return arg

merge = (args) ->
  out = []
  for arg in args
    if arg instanceof Array
      out = out.concat merge arg
    else if arg?
      out.push arg
  out

exports.visualize = () ->
  list = merge resolve [].slice.call arguments
  markup.merge (visualize graph for graph in list when graph)

exports.inspect = () ->
  contents = exports.visualize.apply null, arguments
  element  = markup.overlay contents

  el.remove() for el in document.querySelectorAll '.shadergraph-overlay'
  document.body.appendChild element
  contents.update()

  element
