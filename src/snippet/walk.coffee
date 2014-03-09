# Walk AST, apply map and collect values
debug = false

walk = (map, collect, node, indent) ->
  debug && console.log indent, node.type, node.token?.data, node.token?.type

  recurse = map node, collect

  if recurse
    walk map, collect, child, indent + '  ', debug for child, i in node.children

  null

module.exports = walk