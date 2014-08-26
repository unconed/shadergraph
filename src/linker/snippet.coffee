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
    @body       = null
    @library    = null
    @defines    = null

    @main       = null
    @entry      = null

    @uniforms   = null
    @externals  = null
    @attributes = null
    @varyings   = null

    # Tidy up object for export
    delete @language    if !@language
    delete @_signatures if !@_signatures
    delete @_compiler   if !@_compiler
    delete @_name       if !@_name

  clone: () ->
    new Snippet @language, @_signatures, @_compiler, @_name

  bind: (config, uniforms, namespace) ->

    # Alt syntax
    if uniforms == '' + uniforms
      [namespace, uniforms] = [uniforms, namespace ? {}]

    # Prepare data structure
    @main       = @_signatures.main
    @namespace  = namespace ? @namespace ? Snippet.namespace()
    @entry      = @namespace + @main.name

    @uniforms   = {}
    @externals  = {}
    @attributes = {}
    @varyings   = {}
    exist       = {}
    exceptions  = {}

    # Handle globals and locals for prefixing
    global = (name) ->
      exceptions[name] = true
      name
    local  = (name) =>
      @namespace + name

    # Apply config
    global key for key in config.globals if config.globals
    _u = if config.globalUniforms   then global else local
    _v = if config.globalVaryings   then global else local
    _a = if config.globalAttributes then global else local
    _e = local

    # Build finalized properties
    x = (def)       =>       exist[def.name]           = true
    u = (def, name) =>   @uniforms[_u name ? def.name] = def
    v = (def)       =>   @varyings[_v def.name]        = def
    e = (def)       =>  @externals[_e def.name]        = def
    a = (def)       => @attributes[_a def.name]        = def

    redef = (def) -> {type: def.type, name: def.name, value: def.value}

    x def       for def in @_signatures.uniform
    u redef def for def in @_signatures.uniform
    v redef def for def in @_signatures.varying
    e def       for def in @_signatures.external
    a redef def for def in @_signatures.attribute
    u def, name for name, def of uniforms when exist[name]

    @body = @code = @_compiler @namespace, exceptions

    # These are for generated snippets
    @library      = []
    @defines      = {}

    null

module.exports = Snippet