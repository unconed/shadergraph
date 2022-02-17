/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import * as Graph from "../graph";
import * as Priority from "./priority";

/*
 Callback linker

 Imports given modules and generates linkages for registered callbacks.

 Builds composite program with single module as exported entry point
*/

export const link = function (language, links, modules, exported) {
  const generate = language;
  let includes = [];

  const symbols = [];
  const externals = {};
  const uniforms = {};
  const attributes = {};
  const varyings = {};
  const library = {};

  const process = function () {
    const exports = generate.links(links);

    const header = [];
    if (exports.defs != null) {
      header.push(exports.defs);
    }
    if (exports.bodies != null) {
      header.push(exports.bodies);
    }

    for (const m of Array.from(modules)) {
      include(m.node, m.module, m.priority);
    }
    const sorted = (() => {
      const result = [];
      for (const ns in library) {
        const lib = library[ns];
        result.push(lib);
      }
      return result;
    })().sort((a, b) => Priority.compare(a.priority, b.priority));
    includes = sorted.map((x) => x.code);

    let code = generate.lines(includes);
    code = generate.defuse(code);
    if (header.length) {
      code = [generate.lines(header), code].join("\n");
    }
    code = generate.hoist(code);
    code = generate.dedupe(code);

    // Export module's externals
    const e = exported;
    return {
      namespace: e.main.name,
      code, // Complete snippet (tests/debug)
      main: e.main, // Function signature
      entry: e.main.name, // Entry point name
      externals,
      uniforms,
      attributes,
      varyings,
    };
  };

  // Adopt given code as a library at given priority
  const adopt = function (namespace, code, priority) {
    const record = library[namespace];
    if (record != null) {
      return (record.priority = Priority.max(record.priority, priority));
    } else {
      return (library[namespace] = { code, priority });
    }
  };

  // Include piece of code
  const include = function (node, module, priority) {
    let def, key;
    priority = Priority.make(priority);

    // Adopt snippet's libraries
    for (const ns in module.library) {
      const lib = module.library[ns];
      adopt(ns, lib.code, Priority.nest(priority, lib.priority));
    }

    // Adopt snippet body as library
    adopt(module.namespace, module.body, priority);

    // Adopt externals
    for (key in module.uniforms) {
      def = module.uniforms[key];
      uniforms[key] = def;
    }
    for (key in module.varyings) {
      def = module.varyings[key];
      varyings[key] = def;
    }
    for (key in module.attributes) {
      def = module.attributes[key];
      attributes[key] = def;
    }

    return (() => {
      const result = [];
      for (key of Array.from(module.symbols)) {
        const ext = module.externals[key];
        if (isDangling(node, ext.name)) {
          externals[key] = ext;
          result.push(symbols.push(key));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  };

  // Check for dangling input/output
  const isDangling = function (node, name) {
    const outlet = node.get(name);

    if (!outlet) {
      const module =
        (node.owner.snippet != null ? node.owner.snippet._name : undefined) !=
        null
          ? node.owner.snippet != null
            ? node.owner.snippet._name
            : undefined
          : node.owner.namespace;
      throw new Error(
        `Unable to link program. Unlinked callback \`${name}\` on \`${module}\``
      );
    }

    if (outlet.inout === Graph.IN) {
      return outlet.input === null;
    } else if (outlet.inout === Graph.OUT) {
      return outlet.output.length === 0;
    }
  };

  return process();
};
