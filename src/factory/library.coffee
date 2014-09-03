###
  Snippet library
  
  Takes:
    - Hash of snippets: named library
    - (name) -> getter: dynamic lookup
    - nothing:          no library, only pass in inline source code
  
  If 'name' contains any of "{;(#" it is assumed to be direct GLSL code.
###
library = (language, snippets, load) ->

  callback = null

  if snippets?
    if typeof snippets == 'function'
      callback = (name) ->
        load language, name, snippets(name)
    else if typeof snippets == 'object'
      callback = (name) ->
        throw "Unknown snippet `#{name}`" if !snippets[name]?
        load language, name, snippets[name]

  inline = (code) ->
    load language, '', code

  return inline if !callback?

  (name) ->
    return inline name if name.match /[{;(#]/
    callback name


module.exports = library