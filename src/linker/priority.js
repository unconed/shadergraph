/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
exports.make = function (x) {
  if (x == null) {
    x = [];
  }
  if (!(x instanceof Array)) {
    x = [+x != null ? +x : 0];
  }
  return x;
};

exports.nest = (a, b) => a.concat(b);

exports.compare = function (a, b) {
  const n = Math.min(a.length, b.length);
  for (
    let i = 0, end = n, asc = 0 <= end;
    asc ? i < end : i > end;
    asc ? i++ : i--
  ) {
    const p = a[i];
    const q = b[i];
    if (p > q) {
      return -1;
    }
    if (p < q) {
      return 1;
    }
  }
  a = a.length;
  b = b.length;
  if (a > b) {
    return -1;
  } else if (a < b) {
    return 1;
  } else {
    return 0;
  }
};

exports.max = function (a, b) {
  if (exports.compare(a, b) > 0) {
    return b;
  } else {
    return a;
  }
};
