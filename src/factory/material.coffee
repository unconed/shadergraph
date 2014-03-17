class Material
  constructor: (@vertex, @fragment) ->

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

    options

module.exports = Material
