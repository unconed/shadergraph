Graph      = require '../graph'
Priority   = require './priority'

###
 Callback linker
 
 Imports given modules and generates linkages for registered callbacks.

 Builds composite program with single module as exported entry point
###

link = (language, links, modules, exported) ->

  generate = language.generate
  includes   = []

  externals  = {}
  uniforms   = {}
  attributes = {}
  varyings   = {}
  library    = {}

  process = () ->

    exports = generate.links links

    header = []
    header.push exports.defs   if exports.defs?
    header.push exports.bodies if exports.bodies?

    include m.node, m.module, m.priority for m in modules
    sorted   = (lib for ns, lib of library).sort (a, b) -> Priority.compare a.priority, b.priority
    includes = sorted.map (x) -> x.code

    code =  generate.lines includes
    code =  generate.defuse code
    code = [generate.lines(header), code].join "\n" if header.length
    code =  generate.hoist  code
    code =  generate.dedupe code

    # Export module's externals
    e = exported
    namespace:   e.main.name
    code:        code          # Complete snippet (tests/debug)
    main:        e.main        # Function signature
    entry:       e.main.name   # Entry point name
    externals:   externals
    uniforms:    uniforms
    attributes:  attributes
    varyings:    varyings

  # Adopt given code as a library at given priority
  adopt = (namespace, code, priority) ->
    record = library[namespace]
    if record?
      record.priority = Priority.max record.priority, priority
    else
      library[namespace] = {code, priority}

  # Include piece of code
  include = (node, module, priority) ->
    priority = Priority.make priority

    # Adopt snippet's libraries
    adopt ns, lib.code, Priority.nest priority, lib.priority for ns, lib of module.library

    # Adopt snippet body as library
    adopt module.namespace, module.body, priority

    # Adopt externals
    (uniforms[key]   = def) for key, def of module.uniforms
    (varyings[key]   = def) for key, def of module.varyings
    (attributes[key] = def) for key, def of module.attributes

    for key, def of module.externals
      if isDangling node, def.name
        externals[key] = def

  # Check for dangling input/output
  isDangling = (node, name) ->
    outlet = node.get name

    if !outlet
      module = node.owner.snippet?._name ? node.owner.namespace
      throw "Unable to link program. Unlinked callback `#{name}` on `#{module}`"

    if outlet.inout == Graph.IN
      outlet.input == null

    else if outlet.inout == Graph.OUT
      outlet.output.length == 0

  process()


module.exports = link