Graph      = require '../graph'
Priority   = require './priority'

###
  Program assembler

  Builds composite program that can act as new module/snippet
  Unconnected input/outputs and undefined callbacks are exposed in the new global/main scope
  If there is only one call with an identical call signature, a #define is output instead.
###
assemble = (language, namespace, calls, requires) ->

  generate = language.generate

  externals  = {}
  symbols    = []
  uniforms   = {}
  varyings   = {}
  attributes = {}
  library    = {}

  process = () ->

    required r.node, r.module for ns, r of requires

    [body, calls] = handle calls
    body.entry    = namespace if namespace?
    main          = generate.build body, calls

    sorted   = (lib for ns, lib of library).sort (a, b) -> Priority.compare a.priority, b.priority
    includes = sorted.map (x) -> x.code
    includes.push main.code
    code = generate.lines includes

    # Build new virtual snippet
    namespace:   main.name
    library:     library     # Included library functions
    body:        main.code   # Snippet body
    code:        code        # Complete snippet (tests/debug)
    main:        main        # Function signature
    entry:       main.name   # Entry point name
    symbols:     symbols
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
    priority = Priority.make priority

    # Adopt snippet's libraries
    adopt ns, lib.code, Priority.nest priority, lib.priority for ns, lib of module.library

    # Adopt snippet body as library
    adopt module.namespace, module.body, priority

    # Adopt GL vars
    (uniforms[key]   = def) for key, def of module.uniforms
    (varyings[key]   = def) for key, def of module.varyings
    (attributes[key] = def) for key, def of module.attributes

    required node, module

  required = (node, module) ->
    # Adopt external symbols
    for key in module.symbols
      ext = module.externals[key]
      if isDangling node, ext.name
        copy = {}
        copy[k] = v for k, v of ext
        copy.name = lookup node, ext.name
        externals[key] = copy
        symbols.push key

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

