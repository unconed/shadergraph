Snippet  = require('../snippet').Snippet
assemble = require './assemble'

###
  Program assembly model
  
  Calls, code includes and callbacks are added to its queues
  
  When assemble() is called, it builds a main() function to
  execute all calls in order and adds stubs/defines to link
  up external callbacks.
  
  The result is a new instance of Snippet that acts as if it
  was parsed from the combined/linked source of the component
  nodes.
###
class Program
  @index: 0
  @entry: () -> "_pg_#{++Program.index}_"

  @compile: (block, phase, namespace) ->
    program = new Program block, namespace
    program.compile phase

  # Program starts out empty, ready to compile starting from a particular block
  constructor: (@block, @namespace) ->
    @included   = {}
    @includes   = []
    @calls      = {}
    @links      = []

  compile: (phase) ->
    graph = @block.node.graph
    @block.call @, phase, 0
    @_snippet assemble phase, @namespace ? Program.entry(), @calls, @links, @includes

  # Link to a given external callback
  link: (node, module, name, external) ->
    @links.push {node, module, name, external}

  # Include this module of code
  include: (node, module) ->
    return if @included[module.namespace]
    @included[module.namespace] = true
    @includes.push {node, module}

  # Call a given module at certain priority
  call: (node, module, priority) ->
    ns = module.namespace

    if exists = @calls[ns]
      exists.priority = Math.max exists.priority, priority
    else
      @calls[ns] = {node, module, priority}

    @

  # Helper to prefill a snippet object instead of compiling it
  _snippet: (data) ->
    s = new Snippet
    #s._program = @
    s[key] = data[key] for key of data

    s

module.exports = Program


