###
  Cache decorator  
  Fetches snippets once, clones for reuse
  Inline code is hashed to avoid bloat
###
queue = require './queue'
hash  = require './hash'

cache = (fetch) ->
  cached = {}
  push  = queue 100

  # Snippet factory
  (name) ->
    key = if name.length > 32 then '##' + hash(name).toString(16) else name

    # Push new key onto queue, see if an old key expired
    expire = push key
    delete cached[expire] if expire?

    # Clone cached snippet
    cached[key] = fetch name if !cached[key]?
    cached[key].clone()

module.exports = cache