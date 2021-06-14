/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Hash string into a 32-bit key (murmurhash3)
const c1 = 0xcc9e2d51;
const c2 = 0x1b873593;
const c3 = 0xe6546b64;
const c4 = 0x85ebca6b;
const c5 = 0xc2b2ae35;

// Fix imul in old/broken browsers
let imul = function (a, b) {
  const ah = (a >>> 16) & 0xffff;
  const al = a & 0xffff;
  const bh = (b >>> 16) & 0xffff;
  const bl = b & 0xffff;
  return (al * bl + (((ah * bl + al * bh) << 16) >>> 0)) | 0;
};

if (Math.imul != null) {
  const test = Math.imul(0xffffffff, 5);
  if (test === -5) {
    ({ imul } = Math);
  }
}

export const hash = function (string) {
  let h;
  const n = string.length;
  let m = Math.floor(n / 2);
  let j = (h = 0);

  const next = () => string.charCodeAt(j++);
  const iterate = function (a, b) {
    let k = a | (b << 16); // two utf-16 words
    k ^= k << 9; // whitening for ascii-only strings

    k = imul(k, c1);
    k = (k << 15) | (k >>> 17);
    k = imul(k, c2);

    h ^= k;

    h = (h << 13) | (h >>> 19);
    h = imul(h, 5);
    return (h = (h + c3) | 0);
  };

  while (m--) {
    iterate(next(), next());
  }
  if (n & 1) {
    iterate(next(), 0);
  }

  h ^= n;
  h ^= h >>> 16;
  h = imul(h, c4);
  h ^= h >>> 13;
  h = imul(h, c5);
  return (h ^= h >>> 16);
};
