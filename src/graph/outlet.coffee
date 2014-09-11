Graph = require './graph'

###
  In/out outlet on node
###
class Outlet
  @index: 0
  @id: (name) ->
    "_io_#{++Outlet.index}_#{name}"

  @hint: (name) ->
    name = name.replace /^(_io_[0-9]+_)/, ''
    name = name.replace /(In|Out|Inout|InOut)$/, ''

  constructor: (@inout, @name, @hint, @type, @meta) ->
    @hint  ?= Outlet.hint name

    @node   = null
    @input  = null
    @output = []
    @id     = Outlet.id @hint

  # Change into given outlet without touching connections
  morph: (outlet) ->
    @inout = outlet.inout
    @name  = outlet.name
    @hint  = outlet.hint
    @type  = outlet.type
    @meta  = outlet.meta

  # Copy with unique name
  dupe: (name = @id) ->
    {inout, hint, type, meta} = @
    {inout, hint, type, meta, name: name}

  # Connect to given outlet
  connect: (outlet) ->

    # Auto-reverse in/out to out/in
    if @inout == Graph.IN  && outlet.inout == Graph.OUT
      return outlet.connect @

    # Disallow bad combinations
    if @inout != Graph.OUT || outlet.inout != Graph.IN
      throw "Can only connect out to in."

    # Check for existing connection
    return if outlet.input == @

    # Disconnect existing connections
    outlet.disconnect()

    # Add new connection.
    outlet.input = @
    @output.push outlet

  # Disconnect given outlet (or all)
  disconnect: (outlet) ->
    # Disconnect input from the other side.
    if @input
      @input.disconnect @

    if @output.length

      if outlet
        # Remove one outgoing connection.
        index = @output.indexOf outlet
        if index >= 0
          @output.splice index, 1
          outlet.input = null

      else
        # Remove all outgoing connections.
        outlet.input = null for outlet in @output
        @output = []

module.exports = Outlet
