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
    modules = (module for ns, module of @modules)
    modules.sort (a, b) -> b.priority - a.priority

    INOUT_ARG  = '_i_n_o_u_t'
    RETURN_ARG = '_r_e_t_u_r_n'

    uniforms   = {}
    attributes = {}
    includes   = []
    vars       = {}
    calls      = []

    # Collapse split inouts
    getShadow = (name) ->
      name.replace INOUT_ARG, ''

    isShadow = (name) ->
      collapsed = getShadow name
      collapsed != name

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
        spec = arg.spec
        name = arg.name

        continue if isShadow name

        id       = lookup node, name
        vars[id] = "  #{spec} #{id}"
        args.push id

      args = args.join ', '
      calls.push "  #{entry}(#{args})"

    main = () ->
      @entry = Program.entry()

      vars = (decl for v, decl of vars)
      vars .push ''
      calls.push ''

      vars  = vars.join ';\n'
      calls = calls.join ';\n'

      "void #{@entry}() {\n#{vars}\n#{calls}}"

    for module in modules
      include module.snippet
      link    module.snippet, module.node

    includes.push main()
    @code = includes.join '\n'

    #throw "lol error"


module.exports = Program