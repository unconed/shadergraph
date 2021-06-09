/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Graph      = require('../graph');
const Priority   = require('./priority');

/*
  Program assembler

  Builds composite program that can act as new module/snippet
  Unconnected input/outputs and undefined callbacks are exposed in the new global/main scope
  If there is only one call with an identical call signature, a #define is output instead.
*/
const assemble = function(language, namespace, calls, requires) {

  const {
    generate
  } = language;

  const externals  = {};
  const symbols    = [];
  const uniforms   = {};
  const varyings   = {};
  const attributes = {};
  const library    = {};

  const process = function() {

    let body;
    let ns;
    for (ns in requires) { const r = requires[ns]; required(r.node, r.module); }

    [body, calls] = Array.from(handle(calls));
    if (namespace != null) { body.entry    = namespace; }
    const main          = generate.build(body, calls);

    const sorted   = ((() => {
      const result = [];
      for (ns in library) {
        const lib = library[ns];
        result.push(lib);
      }
      return result;
    })()).sort((a, b) => Priority.compare(a.priority, b.priority));
    const includes = sorted.map(x => x.code);
    includes.push(main.code);
    const code = generate.lines(includes);

    // Build new virtual snippet
    return {
      namespace:   main.name,
      library,     // Included library functions
      body:        main.code,   // Snippet body
      code,        // Complete snippet (tests/debug)
      main,        // Function signature
      entry:       main.name,   // Entry point name
      symbols,
      externals,
      uniforms,
      varyings,
      attributes
    };
  };

  // Sort and process calls
  var handle = calls => {

    let c;
    calls = ((() => {
      const result = [];
      for (let ns in calls) {
        c = calls[ns];
        result.push(c);
      }
      return result;
    })());
    calls.sort((a, b) => b.priority - a.priority);

    // Call module in DAG chain
    const call = (node, module, priority) => {
      include(node, module, priority);
      const {
        main
      } = module;
      const {
        entry
      } = module;

      const _lookup   = name => lookup(node, name);
      const _dangling = name => isDangling(node, name);
      return generate.call(_lookup, _dangling, entry, main.signature, body);
    };

    var body = generate.body();
    for (c of Array.from(calls)) { call(c.node, c.module, c.priority); }

    return [body, calls];
  };

  // Adopt given code as a library at given priority
  const adopt = function(namespace, code, priority) {
    const record = library[namespace];
    if (record != null) {
      return record.priority = Priority.max(record.priority, priority);
    } else {
      return library[namespace] = {code, priority};
    }
  };

  // Include snippet for a call
  var include = function(node, module, priority) {
    let def, key;
    priority = Priority.make(priority);

    // Adopt snippet's libraries
    for (let ns in module.library) { const lib = module.library[ns]; adopt(ns, lib.code, Priority.nest(priority, lib.priority)); }

    // Adopt snippet body as library
    adopt(module.namespace, module.body, priority);

    // Adopt GL vars
    for (key in module.uniforms) { def = module.uniforms[key]; uniforms[key]   = def; }
    for (key in module.varyings) { def = module.varyings[key]; varyings[key]   = def; }
    for (key in module.attributes) { def = module.attributes[key]; attributes[key] = def; }

    return required(node, module);
  };

  var required = (node, module) => // Adopt external symbols
  (() => {
    const result = [];
    for (let key of Array.from(module.symbols)) {
      const ext = module.externals[key];
      if (isDangling(node, ext.name)) {
        const copy = {};
        for (let k in ext) { const v = ext[k]; copy[k] = v; }
        copy.name = lookup(node, ext.name);
        externals[key] = copy;
        result.push(symbols.push(key));
      } else {
        result.push(undefined);
      }
    }
    return result;
  })();

  // Check for dangling input/output
  var isDangling = function(node, name) {
    const outlet = node.get(name);

    if (outlet.inout === Graph.IN) {
      return outlet.input === null;

    } else if (outlet.inout === Graph.OUT) {
      return outlet.output.length === 0;
    }
  };

  // Look up unique name for outlet
  var lookup = function(node, name) {

    // Traverse graph edge
    let outlet = node.get(name);
    if (!outlet) { return null; }

    if (outlet.input) { outlet = outlet.input; }
    ({
      name
    } = outlet);

    return outlet.id;
  };

  return process();
};

module.exports = assemble;

