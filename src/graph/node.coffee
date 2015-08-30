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

    typeHint = (outlet) -> type + '/' + outlet.hint

    # Hash the types/hints of available target outlets.
    for dest in node.inputs
      # Only autoconnect if not already connected
      continue if !force && dest.input

      # Match outlets by type/name hint, then type/position key
      type = dest.type
      hint = typeHint dest

      hints[hint] = dest if !hints[hint]
      outlets[type] = list = outlets[type] || []
      list.push dest

    # Available source outlets
    sources = @outputs

    # Ignore connected source if only matching empties.
    sources = sources.filter (outlet) -> !(empty and outlet.output.length)

    # Match hints first
    for source in sources.slice()

      # Match outlets by type and name
      type = source.type
      hint = typeHint source
      dests = outlets[type]

      # Connect if found
      if dest = hints[hint]
        source.connect dest

        # Remove from potential set
        delete hints[hint]
        dests  .splice dests.indexOf(dest),     1
        sources.splice sources.indexOf(source), 1

    # Match what's left
    return @ unless sources.length
    for source in sources.slice()

      type = source.type
      dests = outlets[type]

      # Match outlets by type and order
      if dests && dests.length
        # Link up and remove from potential set
        source.connect dests.shift()

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
    throw new Error "Adding outlet to two nodes at once." if outlet.node
    throw new Error "Adding two identical outlets to same node. (#{key})" if @outlets[key]

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
    throw new Error "Removing outlet from wrong node." if outlet.node != @

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
