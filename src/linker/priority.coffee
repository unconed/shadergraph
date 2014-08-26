exports.make = (x) ->
  x = []  if !x?
  x = [+x ? 0] if x !instanceof Array
  x

exports.nest = (a, b) ->
  a.concat b

exports.max  = (a, b) ->
  n = Math.min a.length, b.length
  for i in [0...n]
    p = a[i]
    q = b[i]
    if p > q
      return a
    if p < q
      return b
  return if b.length > a.length then b else a
