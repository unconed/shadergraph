Graph   = require('../graph').Graph
Snippet = require('../snippet').Snippet

class Program
  @index: 0
  @entry: () -> "_pg_#{++Program.index}"

  @compile = (block) ->
    program = new Program block
    program.compile()

  constructor: (@block) ->
    @modules    = {}
    @calls      = {}
    @includes   = []
    @externals  = {}
    @uniforms   = {}
    @attributes = {}

  compile: () ->
    @block.call @, 0
    @_assemble()

  include: (node, module) ->
    return if @_included(module)
    @modules[module.namespace] = module

    @includes.push module.code

    (@uniforms[key]   = def) for key, def of module.uniforms
    (@attributes[key] = def) for key, def of module.attributes

    for key, def of module.externals
      name   = def.name
      outlet = node.get(name)

      if !outlet.input
        @externals[key] = def

  call: (node, module, priority) ->
    ns = module.namespace

    if exists = @calls[ns]
      exists.priority = Math.max exists.priority, priority
    else
      @calls[ns] = {node, module, priority}

    @

  _included: (module) ->
    !!@modules[module.namespace]

  _assemble: () ->
    # Build composite program that acts as new module/snippet

    INOUT_ARG  = '_i_n_o_u_t'
    RETURN_ARG = 'return'

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

    # Link module to callback
    link = (node, module, outlet) ->
      main      = module.main
      entry     = module.entry

      args   = []
      ret    = ''
      retVal = ''
      signature

      for arg in main.signature
        param = arg.param
        name  = arg.name

        continue if isShadow name
        id = lookup node, name

        if name == RETURN_ARG
          ret = "#{id} = "
        else
          args.push id

        params.push param(id, true)
        signature.push arg.copy id

      args = args.join ', '
      _call = "#{ret}#{entry}(#{args})"

    # Sort and process calls
    callModules = () =>
      vars       = {}
      calls      = []
      params     = []
      signature  = []

      # Call module in DAG chain
      call = (node, module) =>
        @include node, module

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

      cs = (c for ns, c of @calls)
      cs.sort (a, b) -> b.priority - a.priority
      call c.node, c.module for c in cs

      {vars, calls, params, signature}

    # Assemble main() function
    build = (body) ->
      entry  = Program.entry()

      vars   = (decl for v, decl of body.vars)
      params = body.params
      calls  = body.calls

      calls.push ''

      if vars.length
        vars.push ''
        vars = vars.join(';\n') + '\n'
      else
        vars = ''

      calls  = calls .join ';\n'
      params = params.join ', '

      code   = "void #{entry}(#{params}) {\n#{vars}#{calls}}"

      signature: body.signature
      code:      code
      name:      entry

    #####################

    body = callModules()
    main = build(body)

    @includes.push main.code
    code = @includes.join '\n'

    s = new Snippet

    s.namespace  = main.name
    s.code       = code

    s.main       = main
    s.entry      = main.name

    s.externals  = @externals
    s.uniforms   = @uniforms
    s.attributes = @attributes

    s

    #throw "lol error"


module.exports = Program