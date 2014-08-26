# Hash string into a 32-bit key (murmurhash3)
c1 = 0xcc9e2d51
c2 = 0x1b873593
c3 = 0xe6546b64
c4 = 0x85ebca6b
c5 = 0xc2b2ae35

hash = (string) ->
  n = string.length
  m = Math.floor n / 2
  j = h = 0

  next = () -> string.charCodeAt j++
  iterate = (a, b) ->
    k  = a | (b << 16) # two utf-16 words
    k ^= (k << 9)      # whitening for ascii-only strings

    k  = Math.imul k, c1
    k  = (k << 15) | (k >>> 17)
    k  = Math.imul k, c2

    h ^= v
    h  = (h << 13) | (h >>> 19)
    h  = Math.imul h, 5
    h  = (h + c3) | 0

  iterate next(), next() while m--
  iterate next(), 0      if n & 1

  h ^= n
  h ^= h >>> 16
  h  = Math.imul h, c4
  h ^= h >>> 13
  h  = Math.imul h, c5
  h ^= h >>> 16

module.exports = hash