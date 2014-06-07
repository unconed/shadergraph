class Snippet
  @index: 0
  @namespace: () -> "_sn_#{++Snippet.index}_"

  @load: (language, name, code) ->
    program          = language.parse   name, code
    [sigs, compiler] = language.compile program
    new Snippet language, sigs, compiler, name

  constructor: (@language, @_signatures, @_compiler, @_name) ->
    @namespace  = null
    @code       = null

    @main       = null
    @entry      = null

    @uniforms   = null
    @externals  = null
    @attributes = null

    # Tidy up pseudo-snippets
    delete @language    if !@language
    delete @_signatures if !@_signatures
    delete @_compiler   if !@_compiler
    delete @_name       if !@_name

  clone: () ->
    new Snippet @language, @_signatures, @_compiler, @_name

  bind: (uniforms, @namespace) ->
    @namespace ?= Snippet.namespace()
    @code       = @_compiler @namespace

    @main       = @_signatures.main
    @entry      = @namespace + @main.name

    @uniforms   = {}
    @externals  = {}
    @attributes = {}
    exist       = {}

    x = (def)       =>       exist[def.name]                       = true
    u = (def, name) =>   @uniforms[@namespace + (name ? def.name)] = def
    e = (def)       =>  @externals[@namespace + def.name]          = def
    a = (def)       => @attributes[def.name]                       = def

    redef = (def) -> {type: def.type, name: def.name, value: def.value}

    x def       for def in @_signatures.uniform
    u redef def for def in @_signatures.uniform
    e def       for def in @_signatures.external
    a redef def for def in @_signatures.attribute
    u def, name for name, def of uniforms when exist[name]

    null

module.exports = Snippet