#Blocks = require('./blocks')
#Factory = require('./factory')

ShaderGraph =

#  factory: (context) ->
#    new Factory(context)

#  snippet: (name, uniforms) ->
#    name = @getShader name

  Graph: require('./graph')

module.exports = ShaderGraph
window.ShaderGraph = ShaderGraph