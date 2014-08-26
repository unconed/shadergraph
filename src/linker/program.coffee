Snippet  = require './snippet'
assemble = require './assemble'

###
  Program assembly model
  
  Snippets are added to its queue, registering calls and code includes.
  Calls are de-duped and scheduled at the earliest point required for correct data flow.
  
  When assemble() is called, it builds a main() function to
  execute all calls in final order.
  
  The result is a new instance of Snippet that acts as if it
  was parsed from the combined source of the component
  nodes.
###
class Program
  @index: 0
  @entry: () -> "_pg_#{++Program.index}_"

  # Program starts out empty, ready to compile starting from a particular block
  constructor: (@language, @namespace) ->
    @calls      = {}

  # Call a given module at certain priority
  call: (node, module, priority) ->
    ns = module.namespace

    # Merge all calls down into one with the right priority
    if exists = @calls[ns]
      exists.priority = Math.max exists.priority, priority
    else
      @calls[ns] = {node, module, priority}

    @

  # Compile queued ops into result
  assemble: () ->
    data         = assemble @language, @namespace ? Program.entry, @calls
    snippet      = new Snippet
    snippet[key] = data[key] for key of data

    snippet

module.exports = Program


