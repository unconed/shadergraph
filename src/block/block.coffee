Graph   = require '../graph'
Program = require('../linker').Program
Layout  = require('../linker').Layout

debug = false

class Block
  @previous = (outlet) -> outlet.input?.node.owner

  constructor: () ->
    @namespace ?= Program.entry()
    @node       = new Graph.Node @, @makeOutlets?() ? {}

  refresh: () ->
    @node.setOutlets @makeOutlets?() ? {}

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
    @_include module, layout, 0
    @export   layout, 0
    layout.link module

  # Subclassed methods
  call:     (program, depth) ->
  callback: (layout, depth, name, external, outlet) ->
  export:   (layout, depth) ->

  # Make a call to this module in the given program
  _call: (module, program, depth) ->
    program.call @node, module, depth

  # Make a call to all connected inputs
  _inputs: (module, program, depth) ->
    for arg in module.main.signature
      outlet = @node.get arg.name
      Block.previous(outlet)?.call program, depth + 1

  # Insert callback to this module in the given layout
  _callback: (module, layout, depth, name, external, outlet) ->
    layout.callback @node, module, depth, name, external, outlet

  # Include this module in the given layout
  _include: (module, layout, depth) ->
    layout.include @node, module, depth

  # Link this module's connected callbacks 
  _link: (module, layout, depth) ->
    debug && console.log 'block::_link', @.toString(), module.namespace
    for key, ext of module.externals
      outlet = @node.get ext.name
      debug && console.log 'callback -> ', @.toString(), ext.name, outlet
      Block.previous(outlet)?.callback layout, depth + 1, key, ext, outlet.input
      Block.previous(outlet)?.export layout, depth + 1

  # Trace backwards to discover callbacks further up
  _trace: (module, layout, depth) ->
    debug && console.log 'block::_trace', @.toString(), module.namespace
    for arg in module.main.signature
      outlet = @node.get arg.name
      Block.previous(outlet)?.export layout, depth + 1

module.exports = Block