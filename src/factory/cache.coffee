###
  Cache decorator  
  Fetches snippets once, clones for reuse
  Inline code is hashed to avoid bloat
###
queue = require './queue'
hash  = require './hash'

cache = (fetch) ->
  cache = {}
  push  = queue 100

  # Snippet factory
  (name) ->
    key = if name.length > 32 then '##' + hash(name).toString(16) else name

    # Push new key onto queue, see if an old key expired
    expire = push key
    delete cache[expire] if expire?

    # Clone cached snippet
    cache[key] = fetch name if !cache[key]?
    cache[key].clone()

module.exports = cache