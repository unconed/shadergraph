# Synchronous stream wrapper for glsl tokenizer/parser

through = (write, end) ->
  output = []
  errors = []

  output: output
  parser: null
  write: write
  end: end

  process: (@parser, data) ->
    write data
    @flush()
    @parser.flush()

  flush: () ->
    end()
    [output, errors]

  # From tokenizer
  queue: (obj) ->
    @parser?.write obj if obj?

  # From parser
  emit: (type, node) ->
    if type == 'data'
      if !node.parent?
        output.push node
    if type == 'error'
      errors.push node

module.exports = through