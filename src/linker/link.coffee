###
 Callback linker
 
 Imports given modules and generates linkages for registered callbacks.

 Builds composite program that can act as new module/snippet
###

link = (language, links, modules, exported) ->

  generate = language.generate
  includes   = []

  externals  = {}
  uniforms   = {}
  attributes = {}
  includes   = []

  process = () ->

    exports = generate.links links
    includes.push exports.defs   if exports.defs != ''
    includes.push exports.bodies if exports.bodies != ''

    modules.reverse()
    include m.node, m.module for m in modules

    code = generate.lines includes
    code = generate.hoist code

    # Export module's externals
    e = exported
    namespace:   e.main.name
    main:        e.main
    entry:       e.main.name
    externals:   externals
    uniforms:    uniforms
    attributes:  attributes
    code:        code

  # Check for dangling input/output
  isDangling = (node, name) ->
    outlet = node.get name

    if outlet.inout == Graph.IN
      outlet.input == null

    else if outlet.inout == Graph.OUT
      outlet.output.length == 0

  # Include piece of code
  include = (node, module) ->
    includes.push generate.defuse module.code

    (uniforms[key]   = def) for key, def of module.uniforms
    (attributes[key] = def) for key, def of module.attributes

    for key, def of module.externals
      if isDangling node, def.name
        externals[key] = def

  process()


module.exports = link