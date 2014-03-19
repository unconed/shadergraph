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

    for arg in signature
      param = arg.param
      name  = arg.name

      continue if _.unshadow name
      id = lookup name

      if name == $.RETURN_ARG
        ret = id
      else
        args.push id

      if body
        if dangling name

          if name == $.RETURN_ARG
            throw "Error: two unconnected return values within same graph" if body.return != ''
            body.type     = arg.spec
            body.return   = "  return #{id}"
            body.vars[id] = "  " + param(id)
            body.signature.push arg
          else
            body.params.push param(id, true)
            body.signature.push arg.copy id

        else
          body.vars[id] = "  " + param(id)

    body.calls.push _.invoke ret, entry, args

  # Assemble main() function from body and call reference
  build: (body, calls) ->
    entry = body.entry
    code  = null

    # Check if we're only calling one snippet with identical signature
    # and not building void main();
    if calls && body.calls.length == 1 && entry != 'main'
      a = body
      b = calls[0].module

      if _.same body.signature, b.main.signature
        code = _.define entry, b.entry

    # Otherwise build function body
    if !code?
      vars    = (decl for v, decl of body.vars)
      calls   = body.calls.slice()
      params  = body.params
      type    = body.type
      ret     = body.return

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

    blocks = code.split /(?=[{}])/g
    level  = 0
    for b, i in blocks
      if (i % 2 == 0) and level == 0
        # Don't try this at home kids
        blocks[i] = b.replace /([A-Za-z0-9_]+\s*)?[A-Za-z0-9_]+\s*[A-Za-z0-9_]+\s*\([^)]*\)\s*;\s*/mg, ''
      else
        level += if b == '{' then 1 else -1

    code = blocks.join ''

  # Move stuff around so it compiles properly
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
