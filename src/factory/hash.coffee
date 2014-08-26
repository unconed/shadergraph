# Hash string into a 32-bit key (murmurhash3)
c1 = 0xcc9e2d51
c2 = 0x1b873593
c3 = 0xe6546b64
c4 = 0x85ebca6b
c5 = 0xc2b2ae35

# Fix imul in old/broken browsers
imul = (a, b) ->
  ah = (a >>> 16) & 0xffff
  al = a & 0xffff
  bh = (b >>> 16) & 0xffff
  bl = b & 0xffff
  (al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0

if Math.imul?
  test = Math.imul 0xffffffff, 5
  imul = Math.imul if test == -5


hash = (string) ->
  n = string.length
  m = Math.floor n / 2
  j = h = 0

  next = () -> string.charCodeAt j++
  iterate = (a, b) ->
    k  = a | (b << 16) # two utf-16 words
    k ^= (k << 9)      # whitening for ascii-only strings

    k  = imul k, c1
    k  = (k << 15) | (k >>> 17)
    k  = imul k, c2

    h ^= k

    h  = (h << 13) | (h >>> 19)
    h  = imul h, 5
    h  = (h + c3) | 0

  iterate next(), next() while m--
  iterate next(), 0      if n & 1

  h ^= n
  h ^= h >>> 16
  h  = imul h, c4
  h ^= h >>> 13
  h  = imul h, c5
  h ^= h >>> 16

module.exports = hash