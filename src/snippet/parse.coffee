tokenizer = require '../../vendor/glsl-tokenizer'
parser    = require '../../vendor/glsl-parser'
decl      = require './decl'

tick = () ->
  now = +new Date
  return (label) ->
    delta = +new Date() - now
    console.log label, delta + " ms"
    delta

# Parse a GLSL snippet
parse = (name, code) ->
  ast        = parseGLSL name, code
  symbols    = processAST ast

  throw "lol error"

# Parse GLSL language into AST
parseGLSL = (name, code) ->

  tock = tick()

  # Sync stream hack (see /vendor/through)
  [[ast], errors] = tokenizer().process parser(), code

  tock 'GLSL Tokenize & Parse'

  if !ast || errors.length
    console.error "[ShaderGraph] #{name} -", error.message for error in errors
    throw "GLSL parse error"

  window.ast = ast

  ast

# Process AST for compilation
processAST = (ast) ->
  tock = tick()

  symbols = walk mapSymbols, ast
  [main, internals, externals] = extractSymbols symbols

  signatures = extractSignatures main, externals

  tock 'GLSL AST'

  window.main = main
  window.externals = externals
  window.signatures = signatures

  {main, externals, signatures}

# Extract functions and external symbols from AST
mapSymbols = (node) ->
  switch node.type
    when 'decl'
      return [decl.node(node), false]
  return [null, true]

# Identify externals and main function
extractSymbols = (functions) ->
  main = null
  internals = []
  externals = []

  for f in functions
    if !f.body
      # Possible external
      externals.push f
    else
      # Remove earlier forward declaration
      internals.push(e) for e in externals when e.ident == f.ident
      externals    = (e for e in externals when e.ident != f.ident)

      # Last function is main
      main = f

  [main, internals, externals]

# Generate type signatures and appropriate ins/outs
extractSignatures = (main, externals) ->
  sigs =
    uniform: {}
    attribute: {}
    varying: {}
    external: []
    main: null

  defn = (symbol) ->
    decl.type symbol.ident, symbol.type, symbol.quant, symbol.inout

  func = (symbol, inout) ->
    signature = (defn arg for arg in symbol.args)

    # split inouts into in and out
    for d in signature when d.inout == decl.inout
      a = d
      b = decl.copy d

      a.inout = decl.in
      b.inout = decl.out
      b.name += '__inout'

      signature.push b

    # add out for return type
    if symbol.type != 'void'
      signature.push decl.type '_return__', symbol.type, false, 'out'

    # make type string
    ins = (d.type for d in signature when d.inout == decl.in).join ','
    outs = (d.type for d in signature when d.inout == decl.out).join ','
    type = "(#{ins})(#{outs})"

    def =
      name: symbol.ident
      type: type
      signature: signature
      inout: inout

  # parse main
  sigs.main = func main, decl.out

  for symbol in externals
    switch symbol.decl

      # parse uniforms/attributes/varyings
      when 'external'
        def = defn symbol
        sigs[symbol.storage][def.name] = def

      # parse callbacks
      when 'function'
        def = func symbol, decl.in
        sigs.external.push def

  sigs

# Walk AST, apply map and collect values
walk = (map, node, i = 0, d = 0, out = []) ->
  #console.log "                ".substring(16 - d), node.type, node.token?.data, node.token?.type

  [value, recurse] = map node
  out.push value if value?

  if recurse
    walk map, child, i, d + 1, out for child, i in node.children

  out


# Main compilation run
###
compile = (ast) ->

  # Walk AST

  map = (node) ->
    switch node.type
      when 'preprocessor' then preprocessor(node)
      when 'stmt'         then stmt(node)
    [null, true]

  stmt = (node) ->

  preprocessor = (node) ->
    pragma = node.token.data.split(' ')[1]


###

module.exports = parse