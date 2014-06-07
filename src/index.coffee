glsl     = require './glsl'
f        = require './factory'
l        = require './linker'

Factory  = f.Factory
Material = f.Material
library  = f.library
cache    = f.cache

Snippet  = l.Snippet

merge = (a, b = {}) ->
  out = {}
  out[key] = b[key] ? a[key] for key, value of a
  out

class ShaderGraph
  constructor: (snippets, config) ->
    return new ShaderGraph snippets, config if @ !instanceof ShaderGraph

    defaults =
      globalUniforms:   false
      globalVaryings:   true
      globalAttributes: true
      globals:          []

    @config = merge defaults, config
    @fetch  = cache library glsl, snippets, Snippet.load

  shader: (config = {}) ->
    _config = merge @config, config
    new Factory glsl, @fetch, _config

  material: (config) ->
    new Material @shader(config), @shader(config)

  # Expose class hierarchy
  @Block:   require './block'
  @Factory: require './factory'
  @GLSL:    require './glsl'
  @Graph:   require './graph'
  @Linker:  require './linker'

module.exports = ShaderGraph
window.ShaderGraph = ShaderGraph
