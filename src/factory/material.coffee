debug = false
Visualize = require '../visualize'

tick = () ->
  now = +new Date
  return (label) ->
    delta = +new Date() - now
    console.log label, delta + " ms"
    delta

class Material
  constructor: (@vertex, @fragment) ->
    @tock = tick() if debug

  build: (options) -> @link options
  link: (options = {}) ->
    uniforms   = {}
    varyings   = {}
    attributes = {}

    vertex   = @vertex  .link 'main'
    fragment = @fragment.link 'main'

    for shader in [vertex, fragment]
      (uniforms[key]   = value) for key, value of shader.uniforms
      (varyings[key]   = value) for key, value of shader.varyings
      (attributes[key] = value) for key, value of shader.attributes

    options.vertexShader   = vertex  .code
    options.vertexGraph    = vertex  .graph
    options.fragmentShader = fragment.code
    options.fragmentGraph  = fragment.graph
    options.attributes     = attributes
    options.uniforms       = uniforms
    options.varyings       = varyings
    options.inspect        = () ->
      Visualize.inspect 'Vertex Shader', vertex, 'Fragment Shader', fragment.graph

    @tock 'Material build' if debug

    options

  inspect: () ->
    Visualize.inspect 'Vertex Shader', @vertex, 'Fragment Shader', @fragment.graph

module.exports = Material
