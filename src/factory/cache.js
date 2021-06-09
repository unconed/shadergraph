/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
  Cache decorator  
  Fetches snippets once, clones for reuse
  Inline code is hashed to avoid bloat
*/
const queue = require('./queue');
const hash  = require('./hash');

const cache = function(fetch) {
  const cached = {};
  const push  = queue(100);

  // Snippet factory
  return function(name) {
    const key = name.length > 32 ? '##' + hash(name).toString(16) : name;

    // Push new key onto queue, see if an old key expired
    const expire = push(key);
    if (expire != null) { delete cached[expire]; }

    // Clone cached snippet
    if ((cached[key] == null)) { cached[key] = fetch(name); }
    return cached[key].clone();
  };
};

module.exports = cache;