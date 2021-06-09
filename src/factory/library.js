/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
  Snippet library
  
  Takes:
    - Hash of snippets: named library
    - (name) -> getter: dynamic lookup
    - nothing:          no library, only pass in inline source code
  
  If 'name' contains any of "{;(#" it is assumed to be direct GLSL code.
*/
const library = function(language, snippets, load) {

  let callback = null;
  let used = {};

  if (snippets != null) {
    if (typeof snippets === 'function') {
      callback = name => load(language, name, snippets(name));
    } else if (typeof snippets === 'object') {
      callback = function(name) {
        if ((snippets[name] == null)) { throw new Error(`Unknown snippet \`${name}\``); }
        return load(language, name, snippets[name]);
      };
    }
  }

  const inline = code => load(language, '', code);

  if ((callback == null)) { return inline; }

  const fetch = function(name) {
    if (name.match(/[{;]/)) { return inline(name); }
    used[name] = true;
    return callback(name);
  };

  fetch.used = function(_used) { if (_used == null) { _used = used; } return used = _used; };

  return fetch;
};


module.exports = library;