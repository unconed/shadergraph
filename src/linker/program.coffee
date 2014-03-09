Graph   = require('../graph')
Snippet = require('../snippet').Snippet

###
  GLSL program assembly
  
  Calls, code includes and callbacks are added to its queue
  
  When _assemble() is called, it builds a main() function to
  execute all calls in order and adds stubs to link
  up external callbacks.
  
  The result is a new instance of Snippet that acts as if it
  was parsed from the combined/linked source of the component
  nodes.
  
  If the graph only contains one node, compilation is skipped entirely.
###
class Program
  @index: 0
  @entry: () -> "_pg_#{++Program.index}_"

  @compile: (block) ->
    program = new Program block, @namespace
    program.compile()

  # Program starts out empty, ready to compile starting from a particular block
  constructor: (@block, @namespace) ->
    @modules    = {}
    @calls      = {}
    @links      = []
    @includes   = []
    @externals  = {}
    @uniforms   = {}
    @attributes = {}

  compile: () ->
    graph = @block.node.graph
    if graph.nodes.length == 1
      @_snippet @block.solo()
    else
      @block.call @, 0
      @_assemble()

  # Link to a given external callback
  link: (node, module, name, external) ->
    @links.push {node, module, name, external}

  # Include this module of code
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

  # Call a given module at certain priority
  call: (node, module, priority) ->
    ns = module.namespace

    if exists = @calls[ns]
      exists.priority = Math.max exists.priority, priority
    else
      @calls[ns] = {node, module, priority}

    @

  # Helper to construct a snippet at the end
  _snippet: (_s) ->
    s = new Snippet
    s._program = @
    s.namespace  = _s.namespace
    s.code       = _s.code
    s.main       = _s.main
    s.entry      = _s.entry
    s.externals  = _s.externals
    s.uniforms   = _s.uniforms
    s.attributes = _s.attributes
    s

  # Helper to avoid duplicate module includes
  _included: (module) ->
    !!@modules[module.namespace]

  # Build composite program that can act as new module/snippet
  # Unconnected input/outputs and undefined callbacks are exposed in the new global/main scope
  _assemble: () ->

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
      links = (link l for l in links)
      links.join ';\n'

    # Link module to callback
    link = (link) =>
      {node, module, name, external} = link
      main      = module.main
      entry     = module.entry

      # Analyze signatures on both sides, map names to names
      same = true
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

        # Make sure 'return' var is not used
        if _name == RETURN_ARG
          _name = returnVar

        map[arg.name] = _name

      # Build call to invoke the other side
      _lookup = (name) -> map[name]
      _dangling = () -> true

      inner   = makeBody()
      call    = makeCall(_lookup, _dangling, entry, main.signature, inner)

      # Make sure we don't add a local var named 'return'
      map =
        return: returnVar

      _lookup = (name) -> map[name] ? name

      # Build wrapper function for the calling side
      outer   = makeBody()
      wrapper = makeCall(_lookup, _dangling, entry, external.signature, outer)
      outer.calls = [call]
      outer.entry = name

      buildBody(outer).code

    # Sort and process calls
    callModules = (calls) =>

      # Call module in DAG chain
      call = (node, module) =>
        # Late include to ensure right order
        @include node, module

        main      = module.main
        entry     = module.entry

        _lookup   = (name) -> lookup node, name
        _dangling = (name) -> isDangling node, name
        body.calls.push makeCall(_lookup, _dangling, entry, main.signature, body)

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
      entry   = body.entry ? Program.entry()

      vars    = (decl for v, decl of body.vars)
      params  = body.params
      calls   = body.calls
      type    = body.type
      ret     = body.return

      calls.push ''

      if vars.length
        vars.push ''
        vars = vars.join(';\n') + '\n'
      else
        vars = ''

      calls  = calls .join ';\n'
      params = params.join ', '

      code   = "#{type} #{entry}(#{params}) {\n#{vars}#{calls}#{ret}}"

      signature: body.signature
      code:      code
      name:      entry

    #####################

    body       = callModules(@calls)
    body.entry = @namespace if @namespace

    links = buildLinks @links
    @includes.push links if links.length

    main       = buildBody body
    @includes.push main.code

    code = @includes.join '\n'

    @_snippet
      namespace:   main.name
      code:        code

      main:        main
      entry:       main.name

      externals:   @externals
      uniforms:    @uniforms
      attributes:  @attributes


module.exports = Program