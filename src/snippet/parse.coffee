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
  ast = parseGLSL name, code
  processAST ast
  throw "lol error"

# Parse GLSL language into AST
parseGLSL = (name, code) ->

  tock = tick()

  # Sync stream hack (vendor/through)
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

  functions = walk mapSymbols, ast
  [main, externals] = extractSymbols functions

  tock 'GLSL AST'

  window.main = main
  window.externals = externals

# Extract functions and external symbols from AST
mapSymbols = (node) ->
  switch node.type
    when 'decl'
      return [decl.decl(node), false]
  return [null, true]

# Identify externals and main function
extractSymbols = (functions) ->
  externals = []
  main = null

  for f in functions
    if !f.body
      # Possible external
      externals.push f
    else
      # Remove earlier forward declaration
      externals = (e for e in externals when e.ident != f.ident)

      # Last function is main
      main = f

  [main, externals]

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
