###
  Program linkage layout
  
  Entry points are added to its dependency graph
###
class Layout

  # Queue: Link to a given external callback
  ###
  link: (module, name, external) ->
    @links.push {module, name, external}
  ###

  # Queue: Include this module of code
  include: (node, module) ->
    return if @included(module)
    @modules[module.namespace] = true

    @includes.push {node, module}

  included: (module) ->
    return if @modules[module.namespace]

