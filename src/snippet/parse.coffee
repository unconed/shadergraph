tokenizer = require '../../vendor/glsl-tokenizer'
parser    = require '../../vendor/glsl-parser'
decl      = require './decl'
walk      = require './walk'

debug = false
INOUT_ARG  = '_i_n_o_u_t'
RETURN_ARG = '_r_e_t_u_r_n'

###
parse GLSL into AST
extract all global symbols and make type signatures
###
tick = () ->
  now = +new Date
  return (label) ->
    delta = +new Date() - now
    console.log label, delta + " ms"
    delta

# Parse a GLSL snippet
parse = (name, code) ->
  ast        = parseGLSL name, code
  program    = processAST ast, code

# Parse GLSL language into AST
parseGLSL = (name, code) ->

  tock = tick() if debug

  # Sync stream hack (see /vendor/through)
  [[ast], errors] = tokenizer().process parser(), code

  tock 'GLSL Tokenize & Parse' if debug

  if !ast || errors.length
    console.error "[ShaderGraph] #{name} -", error.message for error in errors
    throw "GLSL parse error"

  ast

# Process AST for compilation
processAST = (ast, code) ->
  tock = tick() if debug

  # Walk AST tree and collect global declarations
  symbols = []
  walk mapSymbols, collect(symbols), ast, ''

  # Sort symbols into bins
  [main, internals, externals] = sortSymbols symbols

  # Extract storage/type signatures of symbols
  signatures = extractSignatures main, internals, externals

  tock 'GLSL AST' if debug

  {ast, code, signatures}

# Extract functions and external symbols from AST
mapSymbols = (node, collect) ->
  switch node.type
    when 'decl'
      collect decl.node(node)
      return false
  return true

collect = (out) ->
  (value) -> out.push obj for obj in value if value?

# Identify internals, externals and main function
sortSymbols = (symbols) ->
  main = null
  internals = []
  externals = []
  maybe = {}

  for s in symbols
    if !s.body
      # Unmarked globals are definitely internal
      if s.storage == 'global'
        internals.push s

      # Possible external
      else
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
    global: []
    main: null

  defn = (symbol) ->
    decl.type symbol.ident, symbol.type, symbol.quant, symbol.inout

  func = (symbol, inout) ->
    signature = (defn arg for arg in symbol.args)

    # Split inouts into in and out
    for d in signature when d.inout == decl.inout
      a = d
      b = d.copy()

      a.inout = decl.in
      b.inout = decl.out
      b.name += INOUT_ARG

      signature.push b

    # Add output for return type
    if symbol.type != 'void'
      signature.push decl.type RETURN_ARG, symbol.type, false, 'out'

    # Make type string
    ins = (d.type for d in signature when d.inout == decl.in).join ','
    outs = (d.type for d in signature when d.inout == decl.out).join ','
    type = "(#{ins})(#{outs})"

    def =
      name: symbol.ident
      type: type
      signature: signature
      inout: inout

  # Main
  sigs.main = func main, decl.out

  # Internals (for name replacement only)
  for symbol in internals
    sigs.internal.push
      name: symbol.ident

  # Externals
  for symbol in externals
    switch symbol.decl

      # Uniforms/attributes/varyings
      when 'external'
        def = defn symbol
        sigs[symbol.storage].push def

      # Callbacks
      when 'function'
        def = func symbol, decl.in
        sigs.external.push def

  sigs

module.exports = parse