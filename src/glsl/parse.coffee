tokenizer = require '../../vendor/glsl-tokenizer'
parser    = require '../../vendor/glsl-parser'
decl      = require './decl'
$         = require './constants'

debug = false

###
parse GLSL into AST
extract all global symbols and make type signatures
###
# Parse a GLSL snippet
parse = (name, code) ->
  ast        = parseGLSL name, code
  program    = processAST ast, code

# Parse GLSL language into AST
parseGLSL = (name, code) ->

  tock = tick() if debug

  # Sync stream hack (see /vendor/through)
  try
    [[ast], errors] = tokenizer().process parser(), code
  catch e
    errors = [{message:e}]

  tock 'GLSL Tokenize & Parse' if debug

  fmt = (code) ->
    code = code.split "\n"
    max  = ("" + code.length).length
    pad  = (v) -> if (v = "" + v).length < max then ("       " + v).slice -max else v
    code.map((line, i) -> "#{pad i + 1}: #{line}").join "\n"

  if !ast || errors.length
    name = '(inline code)' if !name
    console.warn fmt code
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
  found = false

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
      # unless there is a function called 'main'
      if s.ident == 'main'
        main = s
        found = true
      else if !found
        main = s

  [main, internals, externals]

# Generate type signatures and appropriate ins/outs
extractSignatures = (main, internals, externals) ->
  sigs =
    uniform:   []
    attribute: []
    varying:   []
    external:  []
    internal:  []
    global:    []
    main:      null

  defn = (symbol) ->
    decl.type symbol.ident, symbol.type, symbol.quant, symbol.count, symbol.inout, symbol.storage

  func = (symbol, inout) ->
    signature = (defn arg for arg in symbol.args)

    # Split inouts into in and out
    for d in signature when d.inout == decl.inout
      a = d
      b = d.copy()

      a.inout  = decl.in
      b.inout  = decl.out
      b.meta   = shadow: a.name
      b.name  += $.SHADOW_ARG
      a.meta   = shadowed: b.name

      signature.push b

    # Add output for return type
    if symbol.type != 'void'
      signature.push decl.type $.RETURN_ARG, symbol.type, false, '', 'out'

    # Make type string
    ins = (d.type for d in signature when d.inout == decl.in).join ','
    outs = (d.type for d in signature when d.inout == decl.out).join ','
    type = "(#{ins})(#{outs})"

    def =
      name: symbol.ident
      type: type
      signature: signature
      inout: inout
      spec: symbol.type

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

# Walk AST, apply map and collect values
debug = false

walk = (map, collect, node, indent) ->
  debug && console.log indent, node.type, node.token?.data, node.token?.type

  recurse = map node, collect

  if recurse
    walk map, collect, child, indent + '  ', debug for child, i in node.children

  null

# #####

tick = () ->
  now = +new Date
  return (label) ->
    delta = +new Date() - now
    console.log label, delta + " ms"
    delta


module.exports = walk
module.exports = parse

