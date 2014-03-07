tokenizer = require '../../vendor/glsl-tokenizer'
parser    = require '../../vendor/glsl-parser'
decl      = require './decl'
walk      = require './walk'

tick = () ->
  now = +new Date
  return (label) ->
    delta = +new Date() - now
    console.log label, delta + " ms"
    delta

# Parse a GLSL snippet
parse = (name, code) ->
  ast        = parseGLSL name, code
  program    = processAST ast

# Parse GLSL language into AST
parseGLSL = (name, code) ->

  tock = tick()

  # Sync stream hack (see /vendor/through)
  [[ast], errors] = tokenizer().process parser(), code

  tock 'GLSL Tokenize & Parse'

  if !ast || errors.length
    console.error "[ShaderGraph] #{name} -", error.message for error in errors
    throw "GLSL parse error"

  ast

# Process AST for compilation
processAST = (ast) ->
  tock = tick()

  symbols = []
  walk mapSymbols, collect(symbols), ast, ''
  [main, internals, externals] = extractSymbols symbols

  signatures = extractSignatures main, internals, externals

  tock 'GLSL AST'

  {ast, signatures}

# Extract functions and external symbols from AST
collect = (out) ->
  (value) ->
    out.push value if value

mapSymbols = (node, collect) ->
  switch node.type
    when 'decl'
      collect decl.node(node)
      return false
  return true

# Identify externals and main function
extractSymbols = (symbols) ->
  main = null
  internals = []
  externals = []
  maybe = {}

  for s in symbols
    if !s.body
      # Possible external
      externals.push s
      maybe[s.ident] = true
    else
      # Remove earlier forward declaration
      if maybe[s.ident]
        externals = (e for e in externals when e.ident != s.ident)
        delete maybe[s.ident]

      # Internal function
      internals.push s

      # Last function is main
      main = s

  [main, internals, externals]

# Generate type signatures and appropriate ins/outs
extractSignatures = (main, internals, externals) ->
  sigs =
    uniform: []
    attribute: []
    varying: []
    external: []
    internal: []
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

  for symbol in internals
    sigs.internal.push
      name: symbol.ident

  for symbol in externals
    switch symbol.decl

      # parse uniforms/attributes/varyings
      when 'external'
        def = defn symbol
        sigs[symbol.storage].push def

      # parse callbacks
      when 'function'
        def = func symbol, decl.in
        sigs.external.push def

  sigs

module.exports = parse