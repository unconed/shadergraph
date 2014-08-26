exports.make = (x) ->
  x = []  if !x?
  x = [+x ? 0] if x !instanceof Array
  x

exports.nest = (a, b) ->
  a.concat b

exports.compare = (a, b) ->
  n = Math.min a.length, b.length
  for i in [0...n]
    p = a[i]
    q = b[i]
    if p > q
      return -1
    if p < q
      return 1
  a = a.length
  b = b.length
  return if a > b then -1 else if a < b then 1 else 0

exports.max  = (a, b) ->
  return if exports.compare(a, b) > 0 then b else a
