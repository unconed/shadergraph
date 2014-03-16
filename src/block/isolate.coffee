Graph   = require '../graph'
Block   = require './block'

###
  Isolate a subgraph as a single node
###
class Isolate extends Block
  constructor: (@graph) ->
    super

  makeOutlets: () ->
    outlets = []
    names = null

    for set in ['inputs', 'outputs']
      for outlet in @graph[set]()
        outlets.push outlet.dupe()

    outlets

  make: () ->
    @subroutine = @graph.compile @namespace

  fetch: (outlet) ->
    # Fetch subroutine from either nested Isolate or Callback block
    outlet = @graph.getOut outlet.name
    outlet?.node.owner.fetch outlet

  link: (program, name, external, outlet) ->
    subroutine = fetch outlet
    @_include subroutine, program
    @_link    subroutine, program, name, external

  call: (program, depth = 0) ->
    @make()
    @_call @subroutine, program, depth

module.exports = Isolate