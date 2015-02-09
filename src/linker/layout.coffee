Snippet  = require './snippet'
link     = require './link'

debug = false

###
  Program linkage layout
  
  Entry points are added to its dependency graph
  Callbacks are linked either with a go-between function
  or a #define if the signatures are identical.
###
class Layout

  constructor: (@language, @graph) ->
    @links    = []
    @includes = []
    @modules  = {}
    @visits   = {}

  # Link up a given named external to this module's entry point
  callback: (node, module, priority, name, external) ->
    @links.push {node, module, priority, name, external}

  # Include this module of code
  include: (node, module, priority) ->
    if (m = @modules[module.namespace])?
      m.priority = Math.max priority, m.priority
    else
      @modules[module.namespace] = true
      @includes.push {node, module, priority}

  # Visit each namespace at most once to avoid infinite recursion
  visit: (namespace) ->
    debug && console.log 'Visit', namespace, !@visits[namespace]
    return false if @visits[namespace]
    @visits[namespace] = true

  # Compile queued ops into result
  link: (module) ->
    data          = link @language, @links, @includes, module
    snippet       = new Snippet
    snippet[key]  = data[key] for key of data
    snippet.graph = @graph
    snippet


module.exports = Layout
