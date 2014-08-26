Graph      = require '../graph'
Priority   = require './priority'

###
  Program assembler

  Builds composite program that can act as new module/snippet
  Unconnected input/outputs and undefined callbacks are exposed in the new global/main scope
  If there is only one call with an identical call signature, a #define is output instead.
###
assemble = (language, namespace, calls) ->

  generate = language.generate

  externals  = {}
  uniforms   = {}
  varyings   = {}
  attributes = {}
  library    = {}
  includes   = []

  process = () ->

    [body, calls] = handle calls
    body.entry    = namespace if namespace?
    main          = generate.build body, calls

    includes.push main.code
    code = generate.lines includes

    # Build new virtual snippet
    namespace:   main.name
    library:     library     # Included library functions
    body:        main.code   # Snippet body
    code:        code        # Complete snippet (tests/debug)
    main:        main
    entry:       main.name
    externals:   externals
    uniforms:    uniforms
    varyings:    varyings
    attributes:  attributes

  # Sort and process calls
  handle = (calls) =>

    calls = (c for ns, c of calls)
    calls.sort (a, b) -> b.priority - a.priority

    # Call module in DAG chain
    call = (node, module, priority) =>
      include     node, module, priority
      main      = module.main
      entry     = module.entry

      _lookup   = (name) -> lookup     node, name
      _dangling = (name) -> isDangling node, name
      generate.call _lookup, _dangling, entry, main.signature, body

    body = generate.body()
    call c.node, c.module, c.priority for c in calls

    [body, calls]

  # Adopt given code as a library at given priority
  adopt = (namespace, code, priority) ->
    record = library[namespace]
    if record?
      record.priority = Priority.max record.priority, priority
    else
      library[namespace] = {code, priority}

  # Include snippet for a call
  include = (node, module, priority) ->
    # Capture snippet body
    includes.push module.code
    priority = Priority.make priority

    # Adopt snippet's libraries
    adopt ns, lib.code, Priority.nest priority, lib.priority for ns, lib of module.library

    # Adopt snippet body as library
    adopt module.namespace, module.body, priority

    (uniforms[key]   = def) for key, def of module.uniforms
    (varyings[key]   = def) for key, def of module.varyings
    (attributes[key] = def) for key, def of module.attributes

    for key, def of module.externals
      if isDangling node, def.name
        externals[key] = def

  # Check for dangling input/output
  isDangling = (node, name) ->
    outlet = node.get name

    if outlet.inout == Graph.IN
      outlet.input == null

    else if outlet.inout == Graph.OUT
      outlet.output.length == 0

  # Look up unique name for outlet
  lookup = (node, name) ->

    # Traverse graph edge
    outlet = node.get name
    outlet = outlet.input if outlet.input
    name   = outlet.name

    # Look for shadowed (inout) output
    input  = generate.unshadow name
    if input
      lookup outlet.node, input
    else
      outlet.id

  return process()

module.exports = assemble

