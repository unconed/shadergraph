###
  Cache decorator  
  Fetches snippets once, clones for reuse
###
cache = (fetch) ->
  cached = {}

  (name) ->
    cached[name] = fetch name if !cached[name]
    cached[name].clone()

module.exports = cache