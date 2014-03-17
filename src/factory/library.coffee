###
  Snippet library
  
  Takes:
    - Hash of snippets: named library
    - (name) -> getter: dynamic lookup
    - nothing:          no library, pass source code instead of snippet names
###
library = (language, snippets, load) ->

  if snippets?
    if typeof snippets == 'function'
      return (name) ->
        load language, name, snippets(name)
    else if typeof snippets == 'object'
      return (name) ->
        throw "Unknown snippet `#{name}`" if !snippets[name]?
        load language, name, snippets[name]

  (name) ->
    load language, '', name

module.exports = library