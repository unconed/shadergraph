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
    program = new Program language, namespace ? Program.entry(), @node.graph
    @call program, 0
    program.assemble()

  # Link up programs into a layout, starting from this block
  link: (language, namespace) ->
    module = @compile language, namespace

    layout = new Layout language, @node.graph
    @_include module, layout, 0
    @export   layout, 0
    layout.link module

  # Subclassed methods
  call:     (program, depth) ->
  callback: (layout, depth, name, external, outlet) ->
  export:   (layout, depth) ->

  # Info string for debugging
  _info: (suffix) ->
    string = @node.owner.snippet?._name ? @node.owner.namespace
    string += '.' + suffix if suffix?

  # Create an outlet for a signature definition
  _outlet: (def, props) ->
    outlet = Graph.Outlet.make def, props
    outlet.meta.def = def
    outlet

  # Make a call to this module in the given program
  _call: (module, program, depth) ->
    program.call @node, module, depth

  # Require this module's dependencies in the given program
  _require: (module, program) ->
    program.require @node, module

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
    for key in module.symbols
      ext = module.externals[key]
      outlet = @node.get ext.name
      throw new OutletError("External not found on #{@_info ext.name}") if !outlet

      continue if outlet.meta.child?

      [orig, parent, block] = [outlet, outlet, null]
      while !block and parent
        [parent, outlet] = [outlet.meta.parent, parent]

      block  = Block.previous outlet
      throw new OutletError("Missing connection on #{@_info ext.name}") if !block

      debug && console.log 'callback -> ', @.toString(), ext.name, outlet
      block.callback layout, depth + 1, key, ext, outlet.input
      block?.export layout, depth + 1

  # Trace backwards to discover callbacks further up
  _trace: (module, layout, depth) ->
    debug && console.log 'block::_trace', @.toString(), module.namespace
    for arg in module.main.signature
      outlet = @node.get arg.name
      Block.previous(outlet)?.export layout, depth + 1

OutletError = (message) ->
  e = new Error message
  e.name = 'OutletError'
  e

OutletError.prototype = new Error

module.exports = Block
