Graph = require('../graph').Graph

class Program
  @index: 0
  @entry: () -> "_pg_#{++Program.index}"

  @compile = (block) ->
    program = new Program block
    program.compile()

  constructor: (@block) ->
    @modules = {}

  compile: () ->
    @block.compile @, 0
    @assemble()

    @

  add: (node, snippet, priority) ->
    ns = snippet.namespace

    if module = @modules[ns]
      module.priority = Math.max module.priority, priority
    else
      @modules[ns] =
        node:     node
        snippet:  snippet
        priority: priority

    @

  assemble: () ->
    # Build composite program that acts as new snippet

    modules = (module for ns, module of @modules)
    modules.sort (a, b) -> b.priority - a.priority

    INOUT_ARG  = '_i_n_o_u_t'
    RETURN_ARG = '_r_e_t_u_r_n'

    uniforms   = {}
    attributes = {}
    vars       = {}
    includes   = []
    calls      = []
    params     = []
    signature  = []

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

    # Look up id for outlet on node
    lookup = (node, name) ->
      outlet = node.get name
      outlet = outlet.input if outlet.input
      name   = outlet.name

      if isShadow name
        lookup outlet.node, getShadow name
      else
        outlet.id

    include = (snippet) -> includes.push snippet.code

    link = (snippet, node) ->
      main  = snippet.main
      entry = snippet.entry
      args  = []

      for arg in main.signature
        param = arg.param
        name  = arg.name

        continue if isShadow name

        id = lookup node, name
        args.push id

        if isDangling node, name
          params.push param(id, true)
          signature.push arg.copy id
        else
          vars[id] = "  " + param(id)

      args = args.join ', '
      calls.push "  #{entry}(#{args})"

      (uniforms[key]   = value) for key, value of snippet.uniforms
      (attributes[key] = value) for key, value of snippet.attributes
#      (externals[key]  = value) for key, value of snippet.externals

    build = () ->
      entry = Program.entry()

      vars = (decl for v, decl of vars)
      vars .push ''
      calls.push ''

      vars  = vars.join  ';\n'
      calls = calls.join ';\n'
      args  = params.join ', '

      code  = "void #{entry}(#{args}) {\n#{vars}\n#{calls}}"

      signature: signature
      code:      code
      name:      entry

    for module in modules
      include module.snippet
      link    module.snippet, module.node

    main = build()

    includes.push main.code
    code = includes.join '\n'

    @namespace  = main.name
    @code       = code

    @main       = main
    @entry      = main.name

    @uniforms   = uniforms
    @attributes = attributes
    @externals  = {}

    @

    #throw "lol error"


module.exports = Program