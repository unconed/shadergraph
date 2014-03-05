# AST node parsers

module.exports = decl = {}

get = (n) -> n.token.data

decl.decl = (node) ->

  if node.token?.type == 'keyword' and node.token?.data in ['attribute', 'uniform', 'varying']
    return decl.external(node)

  if node.children[5]?.type == 'function'
    return decl.function(node)

decl.external = (node) ->
  #    console.log 'external', node
  c = node.children

  storage = c[1]
  struct  = c[3]
  type    = c[4]
  list    = c[5]
  ident   = list.children[0]
  quant   = list.children[1]

  node: node
  storage: get storage
  type: get type
  ident: get ident
  quant: !!quant

decl.function = (node) ->
  c = node.children

  #    console.log 'function', node

  storage = c[1]
  struct  = c[3]
  type    = c[4]
  func    = c[5]
  ident   = func.children[0]
  args    = func.children[1]
  body    = func.children[2]

  node: node
  storage: get storage
  type: get type
  ident: get ident
  args: (decl.argument(child) for child in args.children)
  body: !!body

decl.argument = (node) ->
  c = node.children

  #    console.log 'argument', node

  storage = c[1]
  inout   = c[2]
  type    = c[4]
  list    = c[5]
  ident   = list.children[0]
  quant   = list.children[1]

  node: node
  storage: get storage
  inout: get inout
  type: get type
  ident: get ident
  quant: !!quant

