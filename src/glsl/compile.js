/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
  Compile snippet back into GLSL, but with certain symbols replaced by prefixes / placeholders
*/

export const compile = function(program) {
  const {ast, code, signatures} = program;

  // Prepare list of placeholders
  const placeholders = replaced(signatures);

  // Compile
  const assembler = string_compiler(code, placeholders);

  return [signatures, assembler];
};

// #####

const tick = function() {
  const now = +new Date;
  return function(label) {
    const delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

var replaced = function(signatures) {
  const out = {};
  const s = sig => out[sig.name] = true;

  s(signatures.main);

  // Prefix all global symbols
  for (let key of ['external', 'internal', 'varying', 'uniform', 'attribute']) {
    for (let sig of signatures[key]) { s(sig); }
  }

  return out;
};

/*
String-replacement based compiler
*/
var string_compiler = function(code, placeholders) {

  // Make regexp for finding placeholders
  // Replace on word boundaries
  let key;
  const re = new RegExp('\\b(' + ((() => {
    const result = [];
    for (key in placeholders) {
      result.push(key);
    }
    return result;
  })()).join('|') + ')\\b', 'g');

  // Strip comments
  code = code.replace(/\/\/[^\n]*/g, '');
  code = code.replace(/\/\*([^*]|\*[^\/])*\*\//g, '');

  // Strip all preprocessor commands (lazy)
  //code = code.replace /^#[^\n]*/mg, ''

  // Assembler function that takes namespace prefix and exceptions
  // and returns GLSL source code
  return function(prefix, exceptions, defines) {
    let key;
    if (prefix == null) { prefix = ''; }
    if (exceptions == null) { exceptions = {}; }
    if (defines == null) { defines = {}; }
    const replace = {};
    for (key in placeholders) {
      replace[key] = (exceptions[key] != null) ? key : prefix + key;
    }

    const compiled = code.replace(re, key => replace[key]);

    const defs = ((() => {
      const result1 = [];
      for (key in defines) {
        const value = defines[key];
        result1.push(`#define ${key} ${value}`);
      }
      return result1;
    })());
    if (defs.length) { defs.push(''); }
    return defs.join("\n") + compiled;
  };
};
