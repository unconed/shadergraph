Graph      = require '../graph'
INOUT_ARG  = '_i_n_o_u_t'
RETURN_ARG = 'return'
###
  GLSL assembler

  Builds composite program that can act as new module/snippet
  Unconnected input/outputs and undefined callbacks are exposed in the new global/main scope
  If there is only one call with an identical call signature, a #define is output instead.
###
assemble = (phase, namespace, calls, links, modules) ->

  externals  = {}
  uniforms   = {}
  attributes = {}
  includes   = []

  main = () ->

    include  m.node, m.module for m in modules

    links      = buildLinks links
    includes.push links   if links != ''

    body       = callModules calls
    body.entry = namespace if namespace?
    main       = buildBody body

    includes.push main.code

    code = includes.join '\n'

    namespace:   main.name
    code:        code
    main:        main
    entry:       main.name
    externals:   externals
    uniforms:    uniforms
    attributes:  attributes

  # Include piece of code
  include = (node, module) ->
    includes.push module.code

    (uniforms[key]   = def) for key, def of module.uniforms
    (attributes[key] = def) for key, def of module.attributes

    for key, def of module.externals
      name   = def.name
      outlet = node.get(name)

      if !outlet.input
        externals[key] = def

  # Collapse split inouts
  getShadow = (name) ->
    name.replace INOUT_ARG, ''

  isShadow = (name) ->
    collapsed  = getShadow name
    collapsed != name

  # Look for dangling inputs/outputs
  isDangling = (node, name) ->
    outlet = node.get name

    if outlet.inout == Graph.IN
      outlet.input == null

    else if outlet.inout == Graph.OUT
      outlet.output.length == 0

  # Look up id for outlet across graph edges
  lookup = (node, name) ->
    outlet = node.get name
    outlet = outlet.input if outlet.input
    name   = outlet.name

    if isShadow name
      lookup outlet.node, getShadow name
    else
      outlet.id

  # Generate call signature for module invocation
  makeCall = (lookup, dangling, entry, signature, body) ->
    args      = []
    ret       = ''

    for arg in signature
      param = arg.param
      name  = arg.name

      continue if isShadow name
      id = lookup name

      if name == RETURN_ARG
        ret = "#{id} = "
      else
        args.push id

      if body
        if dangling name

          if name == RETURN_ARG
            throw "Error: two unconnected return values within same graph" if body.return != ''
            body.type     = arg.spec
            body.return   = "  return #{id};\n"
            body.vars[id] = "  " + param(id)
            body.signature.push arg
          else
            body.params.push param(id, true)
            body.signature.push arg.copy id

        else
          body.vars[id] = "  " + param(id)

    args = args.join ', '
    "  #{ret}#{entry}(#{args})"

  # Build links to other callbacks
  buildLinks = (links) ->
    (link l for l in links).join ';\n'

  # Compare two signatures
  same = (a, b) ->
    for A, i in a
      B = b[i]
      return false if !B
      return false if A.type != B.type
      return false if (A.name == RETURN_ARG) != (B.name == RETURN_ARG)
    true

  # Link a module's entry point as a callback
  link = (link) =>
    {node, module, name, external} = link
    main      = module.main
    entry     = module.entry

    # If signatures match, make two symbols equal
    if same main.signature, external.signature
      return "#define #{name} #{entry}"

    # Signatures differ, map names to names
    ins  = []
    outs = []
    map  = {}
    returnVar = [module.namespace, RETURN_ARG].join ''

    for arg in external.signature
      list = if arg.inout == Graph.IN then ins else outs
      list.push arg

    for arg in main.signature

      list = if arg.inout == Graph.IN then ins else outs
      other = list.shift()
      _name = other.name

      # Avoid 'return' keyword
      if _name == RETURN_ARG
        _name = returnVar

      map[arg.name] = _name

    # Build call to invoke the other side
    _lookup = (name) -> map[name]
    _dangling = () -> true

    inner   = makeBody()
    call    = makeCall _lookup, _dangling, entry, main.signature, inner

    # Avoid 'return' keyword
    map =
      return: returnVar
    _lookup = (name) -> map[name] ? name

    # Build wrapper function for the calling side
    outer   = makeBody()
    wrapper = makeCall _lookup, _dangling, entry, external.signature, outer
    outer.calls = [call]
    outer.entry = name

    buildBody(outer).code

  # Sort and process calls
  callModules = (calls) =>

    # Call module in DAG chain
    call = (node, module) =>
      include     node, module
      main      = module.main
      entry     = module.entry

      _lookup   = (name) -> lookup node, name
      _dangling = (name) -> isDangling node, name
      body.calls.push makeCall _lookup, _dangling, entry, main.signature, body

    body = makeBody()
    cs = (c for ns, c of calls)
    cs.sort (a, b) -> b.priority - a.priority
    call c.node, c.module for c in cs

    body

  # Function body
  makeBody = () ->
    entry:     null
    vars:      {}
    return:    ''
    type:      'void'
    calls:     []
    params:    []
    signature: []

  # Assemble main() function from body
  buildBody = (body) ->
    entry   = body.entry ? namespace

    code = null

    # Check if we're only calling one snippet
    if body.calls.length == 1
      _call = (c for k, c of calls)[0]
      a = body
      b = _call.module

      if same body.signature, b.main.signature
        code = "#define #{entry} #{b.entry}"

    # Otherwise build function body
    if !code?
      vars    = (decl for v, decl of body.vars)
      params  = body.params
      _calls   = body.calls
      type    = body.type
      ret     = body.return

      _calls.push ''

      if vars.length
        vars.push ''
        vars = vars.join(';\n') + '\n'
      else
        vars = ''

      _calls = _calls .join ';\n'
      params = params.join ', '

      code   = "#{type} #{entry}(#{params}) {\n#{vars}#{_calls}#{ret}}"

    signature: body.signature
    code:      code
    name:      entry

  return main()

module.exports = assemble

