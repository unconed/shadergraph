debug = false

tick = () ->
  now = +new Date
  return (label) ->
    delta = +new Date() - now
    console.log label, delta + " ms"
    delta

class Material
  constructor: (@vertex, @fragment) ->
    @tock = tick() if debug

  build: (options = {}) ->
    uniforms   = {}
    attributes = {}

    vertex   = @vertex  .link 'main'
    fragment = @fragment.link 'main'

    for shader in [vertex, fragment]
      (uniforms[key]   = value) for key, value of shader.uniforms
      (attributes[key] = value) for key, value of shader.attributes

    options.vertexShader   = vertex  .code
    options.fragmentShader = fragment.code
    options.attributes     = attributes
    options.uniforms       = uniforms

    @tock 'Material build' if debug

    options

module.exports = Material
