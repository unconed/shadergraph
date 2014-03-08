parse = require './parse'
compile = require './compile'

class Snippet
  @id: 0

  @namespace: () -> "_sg_#{++Snippet.id}_"

  @load: (name, code) ->
    program = parse name, code
    assembler = compile program
    new Snippet program.signatures, assembler, program

  constructor: (@signatures, @assembler, @_program) ->
    @namespace = null
    @program   = null
    @uniforms  = null
    @entry     = null
    @main      = null
    @externals = null

  clone: () ->
    new Snippet @signatures, @assembler, @_program

  apply: (uniforms, @namespace) ->
    @namespace ?= Snippet.namespace()
    @program = @assembler @namespace

    @uniforms   = {}
    @attributes = {}
    @externals  = {}

    u = (def, name) => @uniforms[@namespace + (name ? def.name)] = def
    a = (def)       => @attributes[def.name] = def
    e = (def)       => @externals[@namespace + def.name] = def
    m = (def) =>
      @main = def
      @entry = @namespace + def.name

    a(def) for def in @signatures.attribute
    u(def) for def in @signatures.uniform
    u(def, name) for name, def of uniforms

    m(@signatures.main)
    e(def) for def in @signatures.external

    #throw "lol error"
    window.snippet = @


module.exports = Snippet