Snippet = require('../linker').Snippet

###
  Snippet library
  
  Takes:
    - Hash of snippets: named library
    - (name) -> getter: dynamic lookup
    - nothing:          no library, pass source code instead of snippet names
###
library = (language, snippets) ->

  if snippets?
    if typeof snippets == 'function'
      return (name) ->
        Snippet.load language, name, snippets(name)
    else if typeof snippets == 'object'
      return (name) ->
        throw "Unknown snippet `#{name}`" if !snippets[name]?
        Snippet.load language, name, snippets[name]

  (name) ->
    Snippet.load language, '', name

module.exports = library