Graph   = require '../graph'
Program = require('../linker').Program
Layout  = require('../linker').Layout

debug = true

class Block
  @previous = (outlet) -> outlet.input?.node.owner

  constructor: () ->
    @namespace ?= Program.entry()
    @node       = new Graph.Node @, @makeOutlets?() ? {}

  clone: () ->
    new Block

  # Compile a new program starting from this block
  compile: (language, namespace) ->
    program = new Program language, namespace ? Program.entry()
    @call program, 0
    program.assemble()

  # Link up programs into a layout, starting from this block
  link: (language, namespace) ->
    module = @compile language, namespace

    layout = new Layout language
    @_include   module, layout
    @_export    layout
    layout.link module

  # Subclassed methods
  call:     (program, depth = 0) ->
  callback: (layout, name, external) ->
  export:   (layout) ->

  # Make a call to this module in the given program
  _call: (module, program, depth) ->
    program.call @node, module, depth

  # Insert callback to this module in the given layout
  _callback: (module, layout, name, external) ->
    layout.callback @node, module, name, external

  # Include this module in the given layout
  _include: (module, layout) ->
    layout.include @node, module

  # Export this block into the given layout (recursive)
  _export: (layout) ->
    debug && console.log 'Block::_export'
    return unless layout.visit @namespace
    debug && console.log 'Visiting', @namespace
    @export layout

  # Make a call to all connected inputs
  _inputs: (module, program, depth) ->
    for arg in module.main.signature
      outlet = @node.get arg.name
      Block.previous(outlet)?.call program, depth + 1

  # Link this module's connected callbacks 
  _link: (module, layout) ->
    debug && console.log 'block::_link', @.toString(), module.namespace
    for key, ext of module.externals
      outlet = @node.get ext.name
      debug && console.log 'callback -> ', @.toString(), ext.name, outlet
      Block.previous(outlet)?.callback layout, key, ext, outlet.input
      Block.previous(outlet)?._export layout

  # Trace backwards to discover deep callbacks
  _trace: (module, layout) ->
    debug && console.log 'block::_trace', @.toString(), module.namespace
    for arg in module.main.signature
      outlet = @node.get arg.name
      Block.previous(outlet)?._export layout

module.exports = Block