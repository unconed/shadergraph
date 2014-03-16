Snippet  = require './snippet'
link     = require './link'

###
  Program linkage layout
  
  Entry points are added to its dependency graph
  Callbacks are linked either with a go-between function
  or a #define if the signatures are identical.
###
class Layout

  constructor: (@language) ->
    @links    = []
    @includes = []
    @modules  = {}
    @visits   = {}

  # Link up a given named external to this module's entry point
  callback: (node, module, name, external) ->
    @links.push {node, module, name, external}

  # Include this module of code
  include: (node, module) ->
    return if @included(module)
    @modules[module.namespace] = true

    @includes.push {node, module}

  # Check if module already included
  included: (module) ->
    return if @modules[module.namespace]

  # Visit each namespace at most once to avoid infinite recursion
  visit: (namespace) ->
    return false if @visits[namespace]
    @visits[namespace] = true

  # Compile queued ops into result
  link: (module) ->
    data         = link @language, @links, @includes, module
    snippet      = new Snippet
    snippet[key] = data[key] for key of data
    console.log @
    snippet


module.exports = Layout
