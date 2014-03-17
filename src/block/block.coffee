Graph   = require '../graph'
Program = require('../linker').Program
Layout  = require('../linker').Layout

debug = false

class Block
  @previous = (outlet) -> outlet.input?.node.owner

  constructor: () ->
    @namespace ?= Program.entry()
    @node       = new Graph.Node @, @makeOutlets?() ? {}

  compile: (language, namespace) ->
    program = new Program language, namespace ? Program.entry()
    @call program, 0
    program.assemble()

  link: (language, namespace) ->
    module = @compile language, namespace

    layout = new Layout language
    @_include   module, layout
    @_export    layout
    layout.link module

  call:     (program, depth = 0) ->
  callback: (layout, name, external) ->
  export:   (layout) ->

  _export: (layout) ->
    debug && console.log 'Block::_export'
    return unless layout.visit @namespace
    debug && console.log 'Visiting', @.toString(), @namespace
    @export layout

  _call: (module, program, depth) ->
    program.call @node, module, depth

  _callback: (module, layout, name, external) ->
    layout.callback @node, module, name, external

  _include: (module, layout) ->
    layout.include @node, module

  _inputs: (module, program, depth) ->
    for arg in module.main.signature
      outlet = @node.get arg.name
      Block.previous(outlet)?.call program, depth + 1

  _link: (module, layout) ->
    debug && console.log 'block::_link', @.toString(), module.namespace
    for key, ext of module.externals
      outlet = @node.get ext.name
      debug && console.log 'callback -> ', @.toString(), ext.name, outlet
      Block.previous(outlet)?.callback layout, key, ext, outlet.input
      Block.previous(outlet)?._export layout

  _trace: (module, layout) ->
    debug && console.log 'block::_trace', @.toString(), module.namespace
    for arg in module.main.signature
      outlet = @node.get arg.name
      Block.previous(outlet)?._export layout

module.exports = Block