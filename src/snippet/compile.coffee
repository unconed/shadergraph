walk      = require './walk'

###
  compile AST back into GLSL, but with certain symbols replaced by placeholders
###

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
  s(sig) for sig in signatures.external
  s(sig) for sig in signatures.internal
  s(sig) for sig in signatures.varying
  s(sig) for sig in signatures.uniform

  out

compile = (program) ->
  {ast, signatures} = program

  # prepare list of placeholders

  placeholders = replaced signatures
  console.log "placeholders", placeholders

  # stream out tokens, either strings or string callbacks

  tokens = []
  buffer = ""
  last   = ""
  regex  = /[0-9A-Za-z_{}]/
  indent = ''
  block  = ''

  string = (value) ->

    last = buffer[buffer.length - 1]
    first = value[0]

    return if value == ';\n' and last == '\n'

    buffer += ' ' if buffer.length and regex.test(last) and regex.test(first)
    buffer += value

  maybePlaceholder = (name) ->
    if placeholders[name]
      placeholder name
    else
      string name

  placeholder = (name) ->
    string ' '
    combine()
    tokens.push (names) -> names[name]
    string ' '

  combine = () ->
    if buffer.length
      tokens.push buffer
      buffer = ""
    tokens

  # process AST nodes
  recurse = (node) ->
    indent += '..'
    walk map, null, child, indent for child, i in node.children
    indent = indent.substring 2

  remap = (node, i) ->
    indent += '..'
    walk map, null, node, indent
    indent = indent.substring 2

  stmtlist = (node) ->
    if node.parent
      block += '  '
      string '{\n'

    recurse node

    if node.parent
      block = block.substring(2)
      string block + '}'

    false

  stmt = (node, data) ->
    if data in ['else']
      string data
    else
      string block

    recurse node
    string ';\n'
    false

  decllist = (node, data) ->
    if data == '='
      for child, i in node.children
        remap child
        if i == 0
          string ' = '
      false
    else true

  args = (node, data) ->
    c = node.children
    l = c.length - 1
    for child, i in c
      remap child
      if i < l
        string ', '
    false

  ifstmt = (node, data) ->
    c = node.children

    string data
    string '('
    remap c[0]
    string ') '

    remap c[1]
    remap c[2] if c[2]

#    string block + '\n'
    false

  call = (node, data) ->
    c = node.children
    l = c.length - 1

    body = false
    for child, i in c
      if child.type == 'stmtlist'
        body = true
        string ') '
        remap child
      else
        if i > 1
          string ', '
        remap child
        if i == 0
          string '('
    string ')' if !body
    false

  operator = (node, data) ->
    c = node.children

    l = c.length
    if l == 1
      # unary
      string data
      remap c[0]
    else
      data = ' ' + data + ' ' if data != '.'

      # binary
      for child, i in c
        remap child
        string data if i == 0
    false

  ident = (node, data) ->
    maybePlaceholder data
    true

  literal = (node, data) ->
    string data
    true

  group = (node, data) ->
    string '('
    recurse node
    string ')'
    false

  quantifier = (node, data) ->
    string '['
    recurse node
    string ']'
    false

  # map node in tree
  map = (node) ->
    n = node
    d = node.token.data

    switch node.type
      when 'placeholder'  then false
      when 'expr'         then true
      when 'decl'         then true
      when 'stmt'         then stmt         n, d
      when 'literal'      then literal      n, d
      when 'keyword'      then literal      n, d
      when 'ident'        then ident        n, d
      when 'decllist'     then decllist     n, d
      when 'builtin'      then literal      n, d
      when 'binary'       then operator     n, d
      when 'return'       then literal      n, d
      when 'call'         then call         n, d
      when 'function'     then call         n, d
      when 'functionargs' then args         n, d
      when 'if'           then ifstmt       n, d
      when 'else'         then elsestmt     n, d
      when 'group'        then group        n, d
      when 'stmtlist'     then stmtlist     n, d
      when 'quantifier'   then quantifier   n, d
      when 'preprocessor' then false

      else switch node.token.type
        when 'operator'   then operator     n, d
        else false


  # walk tree
  tock = tick()

  walk map, null, ast, ''
  tokens = combine()

  tock "GLSL Compile"

  # assembler function that takes map of symbol names
  # and returns GLSL source code
  (prefix = '', replaced = {}) ->
    names = {}
    for key of placeholders
      names[key] = prefix + (replaced[key] ? key)

    out = ""
    for token in tokens
      if token.call
        out += token(names)
      else
        out += token

    out

module.exports = compile



