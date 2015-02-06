Graph   = require '../graph'
Block   = require './block'

isCallback = (outlet) -> return outlet.type[0] == '('

###
  Isolate a subgraph as a single node
###
class Isolate extends Block
  constructor: (@graph) ->
    super

  refresh: () ->
    super
    delete @subroutine

  clone: () ->
    new Isolate @graph

  makeOutlets: () ->
    outlets = []
    names = null

    for set in ['inputs', 'outputs']
      for outlet in @graph[set]()
        # Preserve name of 'return' outlets
        name = undefined
        name = 'return' if outlet.hint == 'return'

        # Preserve name of callback outlets
        name = outlet.name if isCallback outlet

        outlets.push outlet.dupe name

    outlets

  make: () ->
    @subroutine = @graph.compile @namespace

  fetch: (outlet) ->
    # Fetch subroutine from either nested Isolate or Callback block
    outlet = if outlet.inout == Graph.IN then @graph.getIn outlet.name else @graph.getOut outlet.name
    outlet?.node.owner.fetch outlet

  call: (program, depth) ->
    @make()  if !@subroutine?
    @_call   @subroutine, program, depth
    @_inputs @subroutine, program, depth

  export: (layout, depth) ->
    return unless layout.visit @namespace, depth

    # Link up with normal inputs
    @make()  if !@subroutine?
    @_link   @subroutine, layout, depth
    @_trace  @subroutine, layout, depth

    # Export callbacks needed to call the subroutine
    @graph.export layout, depth

    # Export loose callback inputs that weren't directly called
    externals = @subroutine.externals
    for outlet in @node.inputs when isCallback(outlet)       and
                                    outlet.inout == Graph.IN and
                                    outlet.input?            and
                                    !externals[outlet.name]?

      module = @fetch outlet
      continue unless layout.visit module.namespace + '__shadow', depth

      @_link module, layout, depth

  callback: (layout, depth, name, external, outlet) ->
    subroutine = @fetch outlet
    @_include  subroutine, layout, depth
    @_callback subroutine, layout, depth, name, external, outlet

module.exports = Isolate