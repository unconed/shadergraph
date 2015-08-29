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
  used = {}

  if snippets?
    if typeof snippets == 'function'
      callback = (name) ->
        load language, name, snippets(name)
    else if typeof snippets == 'object'
      callback = (name) ->
        throw new Error "Unknown snippet `#{name}`" if !snippets[name]?
        load language, name, snippets[name]

  inline = (code) ->
    load language, '', code

  return inline if !callback?

  fetch = (name) ->
    return inline name if name.match /[{;]/
    used[name] = true
    callback name

  fetch.used = (_used = used) -> used = _used

  fetch


module.exports = library