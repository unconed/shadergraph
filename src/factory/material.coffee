class Material
  constructor: (@vertex, @fragment) ->

  build: () ->
    uniforms   = {}
    attributes = {}

    vertex   = @vertex  .compile()
    fragment = @fragment.compile()

    for shader in [vertex, fragment]
      (uniforms[key]   = value) for key, value of shader.uniforms
      (attributes[key] = value) for key, value of shader.attributes

    vertexShader:   vertex  .code
    fragmentShader: fragment.code
    attributes:     attributes
    uniforms:       uniforms

module.exports = Material
