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

  add: (node, module, priority, call) ->
    ns = module.namespace

    if exists = @modules[ns]
      exists.priority = Math.max exists.priority, priority
    else
      @modules[ns] = {node, module, priority, call}

    @

  assemble: () ->
    # Build composite program that acts as new module/snippet

    modules = (module for ns, module of @modules)
    modules.sort (a, b) -> b.priority - a.priority

    INOUT_ARG  = '_i_n_o_u_t'
    RETURN_ARG = 'return'

    uniforms   = {}
    attributes = {}
    vars       = {}
    externals  = {}
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

    include = (module, node) ->
      includes.push module.code
      (uniforms[key]   = def) for key, def of module.uniforms
      (attributes[key] = def) for key, def of module.attributes

      for key, def of module.externals
        name   = def.name
        outlet = node.get(name)

        if !outlet.input
          externals[key] = def

    call = (module, node) ->
      main      = module.main
      entry     = module.entry

      args  = []
      ret   = ''

      for arg in main.signature
        param = arg.param
        name  = arg.name

        continue if isShadow name
        id = lookup node, name

        if name == RETURN_ARG
          ret = "#{id} = "
        else
          args.push id

        if isDangling node, name
          params.push param(id, true)
          signature.push arg.copy id
        else
          vars[id] = "  " + param(id)

      args = args.join ', '
      calls.push "  #{ret}#{entry}(#{args})"

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
      include module.module, module.node
      call    module.module, module.node if module.call

    main = build()

    includes.push main.code
    code = includes.join '\n'

    @namespace  = main.name
    @code       = code

    @main       = main
    @entry      = main.name

    @uniforms   = uniforms
    @attributes = attributes
    @externals  = externals

    @

    #throw "lol error"


module.exports = Program