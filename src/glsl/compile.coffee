###
  Compile snippet back into GLSL, but with certain symbols replaced by prefixes / placeholders
###

compile = (program) ->
  {ast, code, signatures} = program

  # Prepare list of placeholders
  placeholders = replaced signatures

  # Compile
  assembler = string_compiler code, placeholders

  [signatures, assembler]

# #####

tick = () ->
  now = +new Date
  return (label) ->
    delta = +new Date() - now
    console.log label, delta + " ms"
    delta

replaced = (signatures) ->
  out = {}
  s = (sig) -> out[sig.name] = true

  s signatures.main

  # Prefix all global symbols
  for key in ['external', 'internal', 'varying', 'uniform', 'attribute']
    s(sig) for sig in signatures[key]

  out

###
String-replacement based compiler
###
string_compiler = (code, placeholders) ->

  # Make regexp for finding placeholders
  # Replace on word boundaries
  re = new RegExp '\\b(' + (key for key of placeholders).join('|') + ')\\b', 'g'

  # Strip comments
  code = code.replace /\/\/[^\n]*/g, ''
  code = code.replace /\/\*([^*]|\*[^\/])*\*\//g, ''

  # Strip all preprocessor commands (lazy)
  #code = code.replace /^#[^\n]*/mg, ''

  # Assembler function that takes namespace prefix and exceptions
  # and returns GLSL source code
  (prefix = '', exceptions = {}, defines = {}) ->
    replace = {}
    for key of placeholders
      replace[key] = if exceptions[key]? then key else prefix + key

    compiled = code.replace re, (key) -> replace[key]

    defs = ("#define #{key} #{value}" for key, value of defines)
    defs.push '' if defs.length
    defs.join("\n") + compiled

module.exports = compile
