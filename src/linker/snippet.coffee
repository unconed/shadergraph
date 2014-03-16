class Snippet
  @index: 0
  @namespace: () -> "_sn_#{++Snippet.index}_"

  @load: (language, name, code) ->
    program          = language.parse   name, code
    [sigs, compiler] = language.compile program
    new Snippet language, sigs, compiler

  constructor: (@language, @_signatures, @_compiler) ->
    @namespace  = null
    @code       = null

    @main       = null
    @entry      = null

    @uniforms   = null
    @externals  = null
    @attributes = null

  clone: () ->
    new Snippet @language, @_signatures, @_compiler

  apply: (uniforms, @namespace) ->
    @namespace ?= Snippet.namespace()
    @code       = @_compiler @namespace

    @main       = @_signatures.main
    @entry      = @namespace + @main.name

    @uniforms   = {}
    @externals  = {}
    @attributes = {}

    u = (def, name) =>   @uniforms[@namespace + (name ? def.name)] = def
    e = (def)       =>  @externals[@namespace + def.name]          = def
    a = (def)       => @attributes[def.name]                       = def

    u(def)       for def in @_signatures.uniform
    e(def)       for def in @_signatures.external
    a(def)       for def in @_signatures.attribute
    u(def, name) for name, def of uniforms

    null

module.exports = Snippet