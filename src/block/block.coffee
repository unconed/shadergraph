Graph   = require '../graph'
Program = require('../linker').Program

class Block

  constructor: () ->
    @namespace ?= Program.entry()
    @node       = new Graph.Node @, @makeOutlets?() ? {}

  compile: (language, namespace) ->
    program = new Program language, namespace ? Program.entry()
    @call program
    program.assemble()

  link: (program, name, external) ->
  call: (program, depth = 0) ->
  externals: () -> {}

  _link: (module, program, name, external) ->
    program.link    @node, module, name, external

  _include: (module, program) ->
    program.include @node, module

  _call: (module, program, depth) ->
    program.call    @node, module, depth

    previous = (outlet) -> outlet.input?.node.owner

    for arg in module.main.signature
      outlet = @node.get arg.name
      previous(outlet)?.call program, depth + 1

    ###
    for key, ext of module.externals
      outlet = @node.get ext.name
      previous(outlet)?.link program, key, ext, outlet.input
    ###

    program

module.exports = Block