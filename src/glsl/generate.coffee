Graph = require '../graph'
$     = require './constants'

###
 GLSL code generator for compiler and linker stubs
###

module.exports = _ =

  # Check if shadow outlet
  unshadow: (name) ->
    real = name.replace $.SHADOW_ARG, ''
    if real != name then real else null

  # Line joiners
  lines:      (lines) -> lines.join '\n'
  list:       (lines) -> lines.join ', '
  statements: (lines) -> lines.join ';\n'

  # Function body
  body: (entry) ->
    entry:     entry
    type:      'void'
    params:    []
    signature: []
    return:    ''
    vars:      {}
    calls:     []
    post:      []
    chain:     {}

  # Symbol define
  define: (a, b) ->
    "#define #{a} #{b}"

  # Function define
  function: (type, entry, params, vars, calls) ->
    "#{type} #{entry}(#{params}) {\n#{vars}#{calls}}"

  # Function invocation
  invoke: (ret, entry, args) ->
    ret = if ret then "#{ret} = " else ''
    args = _.list args
    "  #{ret}#{entry}(#{args})"

  # Compare two signatures
  same: (a, b) ->
    for A, i in a
      B = b[i]
      return false if !B
      return false if A.type != B.type
      return false if (A.name == $.RETURN_ARG) != (B.name == $.RETURN_ARG)
    true

  # Generate call signature for module invocation
  call: (lookup, dangling, entry, signature, body) ->
    args      = []
    ret       = ''
    rets      = 1

    for arg in signature
      name  = arg.name

      copy = id = lookup name
      other = null
      meta  = null
      omit  = false
      inout = arg.inout

      isReturn = name == $.RETURN_ARG

      # Shadowed inout: input side
      if shadow = arg.meta?.shadowed
        other = lookup shadow
        if other
          body.vars[other] = "  " + arg.param(other)
          body.calls.push    "  #{other} = #{id}"

          if !dangling shadow
            arg = arg.split()
          else
            meta = shadowed: other

      # Shadowed inout: output side
      if shadow = arg.meta?.shadow
        other = lookup shadow
        if other
          if !dangling shadow
            arg = arg.split()
            omit = true
          else
            meta = shadow: other
            continue

      if isReturn
        # Capture return value
        ret = id
      else if !omit
        # Pass all non return, non shadow args in
        args.push other ? id

      # Export argument if unconnected
      if dangling name
        if isReturn
          if body.return == ''
            # Preserve 'return' arg name
            copy = name
            body.type     = arg.spec
            body.return   = "  return #{id}"
            body.vars[id] = "  " + arg.param(id)
          else
            body.vars[id] = "  " + arg.param(id)
            body.params.push arg.param(id, true)
        else
          body.params.push arg.param(id, true)

        # Copy argument into new signature
        arg = arg.copy copy, meta
        body.signature.push arg
      else
        body.vars[id] = "  " + arg.param(id)

    body.calls.push _.invoke ret, entry, args

  # Assemble main() function from body and call reference
  build: (body, calls) ->
    entry   = body.entry
    code    = null

    # Check if we're only calling one snippet with identical signature
    # and not building void main();
    if calls && calls.length == 1 && entry != 'main'
      a = body
      b = calls[0].module

      if _.same body.signature, b.main.signature
        code = _.define entry, b.entry

    # Otherwise build function body
    if !code?
      vars    = (decl for v, decl of body.vars)
      calls   = body.calls
      post    = body.post
      params  = body.params
      type    = body.type
      ret     = body.return

      calls = calls.concat post
      calls.push ret if ret != ''
      calls.push ''

      if vars.length
        vars.push ''
        vars = _.statements(vars) + '\n'
      else
        vars = ''

      calls  = _.statements calls
      params = _.list       params

      code   = _.function type, entry, params, vars, calls

    signature: body.signature
    code:      code
    name:      entry

  # Build links to other callbacks
  links: (links) ->
    out =
      defs: []
      bodies: []

    _.link l, out for l in links

    out.defs   = _.lines      out.defs
    out.bodies = _.statements out.bodies

    delete out.defs   if out.defs   == ''
    delete out.bodies if out.bodies == ''

    out

  # Link a module's entry point as a callback
  link: (link, out) =>
    {module, name, external} = link
    main  = module.main
    entry = module.entry

    # If signatures match, #define alias for the symbol
    if _.same main.signature, external.signature
      return out.defs.push _.define name, entry

    # Signatures differ, build one-line callback to match defined prototype

    # Map names to names
    ins  = []
    outs = []
    map  = {}
    returnVar = [module.namespace, $.RETURN_ARG].join ''

    for arg in external.signature
      list = if arg.inout == Graph.IN then ins else outs
      list.push arg

    for arg in main.signature

      list = if arg.inout == Graph.IN then ins else outs
      other = list.shift()
      _name = other.name

      # Avoid 'return' keyword
      if _name == $.RETURN_ARG
        _name = returnVar

      map[arg.name] = _name

    # Build call to invoke the other side
    _lookup = (name) -> map[name]
    _dangling = () -> true

    inner   = _.body()
    _.call _lookup, _dangling, entry, main.signature, inner
    inner.entry = entry

    # Avoid 'return' keyword
    map =
      return: returnVar
    _lookup = (name) -> map[name] ? name

    # Build wrapper function for the calling side
    outer   = _.body()
    wrapper = _.call _lookup, _dangling, entry, external.signature, outer
    outer.calls = inner.calls
    outer.entry = name

    out.bodies.push _.build(inner).code.split(' {')[0]
    out.bodies.push _.build(outer).code

  # Remove all function prototypes to avoid redefinition errors
  defuse: (code) ->
    # Don't try this at home kids
    re = /([A-Za-z0-9_]+\s+)?[A-Za-z0-9_]+\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*;\s*/mg
    strip = (code) -> code.replace re, (m) -> ''

    # Split into scopes by braces
    blocks = code.split /(?=[{}])/g
    level  = 0
    for b, i in blocks
      switch b[0]
        when '{' then level++
        when '}' then level--

      # Only mess with top level scope
      if level == 0
        # Preprocessor lines will fuck us up. Split on them.
        hash = b.split /^[ \t]*#/m
        for line, j in hash

          if j > 0
            # Trim off preprocessor directive
            line = line.split /\n/
            head = line.shift()
            rest = line.join "\n"

            # Process rest
            hash[j] = [head, strip rest].join '\n'
          else
            # Process entire line
            hash[j] = strip line

        # Reassemble
        blocks[i] = hash.join '#'

    code = blocks.join ''

  # Remove duplicate uniforms / varyings / attributes
  dedupe: (code) ->
    map = {}
    re  = /((attribute|uniform|varying)\s+)[A-Za-z0-9_]+\s+([A-Za-z0-9_]+)\s*(\[[^\]]*\]\s*)?;\s*/mg
    code.replace re, (m, qual, type, name, struct) ->
      return '' if map[name]
      map[name] = true
      return m

  # Move definitions to top so they compile properly
  hoist: (code) ->

    # Hoist symbol defines to the top so (re)definitions use the right alias
    re = /^#define ([^ ]+ _pg_[0-9]+_|_pg_[0-9]+_ [^ ]+)$/

    lines = code.split /\n/g
    defs = []
    out = []
    for line in lines
      list = if line.match re then defs else out
      list.push line

    defs.concat(out).join "\n"
