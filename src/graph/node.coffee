Graph  = require './graph'
Outlet = require './outlet'

###
 Node in graph.
###
class Node
  @index: 0
  @id: (name) -> ++Node.index

  constructor: (@owner, outlets) ->
    @graph   = null
    @inputs  = []
    @outputs = []
    @all     = []
    @outlets = null
    @id      = Node.id()

    @setOutlets outlets

  # Retrieve input
  getIn: (name) ->
    (outlet for outlet in @inputs when outlet.name == name)[0]

  # Retrieve output
  getOut: (name) ->
    (outlet for outlet in @outputs when outlet.name == name)[0]

  # Retrieve by name
  get: (name) ->
    @getIn(name) || @getOut(name)

  # Set new outlet definition
  setOutlets: (outlets) ->
    if outlets?
      # First init
      if !@outlets?
        @outlets = {}
        for outlet in outlets
          outlet = Outlet.make outlet if outlet !instanceof Outlet
          @_add outlet
        return

      # Return new/old outlet matching hash key
      hash = (outlet) ->
        # Match by name, direction and type.
        [outlet.name, outlet.inout, outlet.type].join('-')

      # Build hash of new outlets
      match = {}
      match[hash(outlet)] = true for outlet in outlets

      # Remove missing outlets, record matches
      for key, outlet of @outlets
        key = hash(outlet)
        if match[key]
          match[key] = outlet
        else
          @_remove outlet

      # Insert new outlets
      for outlet in outlets
        # Find match by hash
        existing = match[hash(outlet)]
        if existing instanceof Outlet
          # Update existing outlets in place to retain connections.
          @_morph existing, outlet
        else
          # Spawn new outlet
          outlet = Outlet.make outlet if outlet !instanceof Outlet
          @_add outlet

      @
    @outlets

  # Connect to the target node by matching up inputs and outputs.
  connect: (node, empty, force) ->
    outlets = {}
    hints = {}

    # Build hash keys of target outlets.
    for outlet in node.inputs
      # Only autoconnect if not already connected
      continue if !force && outlet.input

      # Match outlets by type/name hint, then type/position key
      type = outlet.type
      hint = [type, outlet.hint].join('-')

      hints[hint] = outlet if !hints[hint]
      outlets[type] = outlets[type] || []
      outlets[type].push outlet

    # Build hash keys of source outlets
    for outlet in @outputs
      # Ignore this outlet if only matching empties.
      continue if empty && outlet.output.length

      # Match outlets by type and name
      type = outlet.type
      hint = [type, outlet.hint].join('-')
      others = outlets[type]

      # Connect if found
      if hints[hint]
        hints[hint].connect(outlet)

        delete hints[hint]
        others.splice others.indexOf(outlet), 1
        continue

      # Match outlets by type and order
      # Link up corresponding outlets
      if others && others.length
        others.shift().connect outlet

    @

  # Disconnect entire node
  disconnect: (node) ->
    outlet.disconnect() for outlet in @inputs
    outlet.disconnect() for outlet in @outputs

    @

  # Return hash key for outlet
  _key: (outlet) ->
    [outlet.name, outlet.inout].join('-')

  # Add outlet object to node
  _add: (outlet) ->
    key = @_key outlet

    # Sanity checks
    throw "Adding outlet to two nodes at once." if outlet.node
    throw "Adding two identical outlets to same node. (#{key})" if @outlets[key]

    # Link back outlet
    outlet.node = @

    # Add to name hash and inout list
    @inputs.push(outlet)  if outlet.inout == Graph.IN
    @outputs.push(outlet) if outlet.inout == Graph.OUT
    @all.push(outlet)
    @outlets[key] = outlet

  # Morph outlet to other
  _morph: (existing, outlet) ->
    key = @_key outlet
    delete @outlets[key]

    existing.morph outlet

    key = @_key outlet
    @outlets[key] = outlet

  # Remove outlet object from node.
  _remove: (outlet) ->
    key = @_key outlet
    inout = outlet.inout

    # Sanity checks
    throw "Removing outlet from wrong node." if outlet.node != @

    # Disconnect outlet.
    outlet.disconnect()

    # Unlink outlet.
    outlet.node = null

    # Remove from name list and inout list.
    delete @outlets[key]
    @inputs .splice(@inputs .indexOf(outlet), 1) if outlet.inout == Graph.IN
    @outputs.splice(@outputs.indexOf(outlet), 1) if outlet.inout == Graph.OUT
    @all    .splice(@all    .indexOf(outlet), 1)
    @

module.exports = Node
