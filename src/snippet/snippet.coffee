parse = require './parse'

class Snippet
  constructor: () ->

make = (name, code) ->
  snippet = new Snippet parse name, code

apply = (snippet, uniforms) ->
  block

module.exports = Snippet