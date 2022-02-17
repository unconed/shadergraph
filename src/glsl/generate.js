/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import * as Graph from "../graph";
import * as $ from "./constants";

/*
  GLSL code generator for compiler and linker stubs
*/

// Check if shadow outlet
export function unshadow(name) {
  const real = name.replace($.SHADOW_ARG, "");
  if (real !== name) {
    return real;
  } else {
    return null;
  }
}

// Line joiners
export function lines(lines) {
  return lines.join("\n");
}
export function list(lines) {
  return lines.join(", ");
}
export function statements(lines) {
  return lines.join(";\n");
}

// Function body
export function body(entry) {
  return {
    entry,
    type: "void",
    params: [],
    signature: [],
    return: "",
    vars: {},
    calls: [],
    post: [],
    chain: {},
  };
}

// Symbol define
export function define(a, b) {
  return `#define ${a} ${b}`;
}

// Function define
export function fn(type, entry, params, vars, calls) {
  return `${type} ${entry}(${params}) {\n${vars}${calls}}`;
}

// Function invocation
export function invoke(ret, entry, args) {
  ret = ret ? `${ret} = ` : "";
  args = list(args);
  return `  ${ret}${entry}(${args})`;
}

// Compare two signatures
export function same(a, b) {
  for (let i = 0; i < a.length; i++) {
    const A = a[i];
    const B = b[i];
    if (!B) {
      return false;
    }
    if (A.type !== B.type) {
      return false;
    }
    if ((A.name === $.RETURN_ARG) !== (B.name === $.RETURN_ARG)) {
      return false;
    }
  }
  return true;
}

// Generate call signature for module invocation
export function call(lookup, dangling, entry, signature, body) {
  const args = [];
  let ret = "";

  for (let arg of Array.from(signature)) {
    var id, shadow;
    const { name } = arg;

    let copy = (id = lookup(name));
    let other = null;
    let meta = null;
    let omit = false;

    const isReturn = name === $.RETURN_ARG;

    // Shadowed inout: input side
    if ((shadow = arg.meta != null ? arg.meta.shadowed : undefined)) {
      other = lookup(shadow);
      if (other) {
        body.vars[other] = "  " + arg.param(other);
        body.calls.push(`  ${other} = ${id}`);

        if (!dangling(shadow)) {
          arg = arg.split();
        } else {
          meta = { shadowed: other };
        }
      }
    }

    // Shadowed inout: output side
    if ((shadow = arg.meta != null ? arg.meta.shadow : undefined)) {
      other = lookup(shadow);
      if (other) {
        if (!dangling(shadow)) {
          arg = arg.split();
          omit = true;
        } else {
          meta = { shadow: other };
          continue;
        }
      }
    }

    if (isReturn) {
      // Capture return value
      ret = id;
    } else if (!omit) {
      // Pass all non return, non shadow args in
      args.push(other != null ? other : id);
    }

    // Export argument if unconnected
    if (dangling(name)) {
      let op = "push";
      if (isReturn) {
        if (body.return === "") {
          op = "unshift";
          // Preserve 'return' arg name
          copy = name;
          body.type = arg.spec;
          body.return = `  return ${id}`;
          body.vars[id] = "  " + arg.param(id);
        } else {
          body.vars[id] = "  " + arg.param(id);
          body.params.push(arg.param(id, true));
        }
      } else {
        body.params.push(arg.param(id, true));
      }

      // Copy argument into new signature
      arg = arg.copy(copy, meta);
      body.signature[op](arg);
    } else {
      body.vars[id] = "  " + arg.param(id);
    }
  }

  return body.calls.push(invoke(ret, entry, args));
}

// Assemble main() function from body and call reference
export function build(body, calls) {
  const { entry } = body;
  let code = null;

  // Check if we're only calling one snippet with identical signature
  // and not building void main();
  if (calls && calls.length === 1 && entry !== "main") {
    const b = calls[0].module;

    if (same(body.signature, b.main.signature)) {
      code = define(entry, b.entry);
    }
  }

  // Otherwise build function body
  if (code == null) {
    let vars = (() => {
      const result = [];
      for (let v in body.vars) {
        const decl = body.vars[v];
        result.push(decl);
      }
      return result;
    })();
    ({ calls } = body);
    const { post } = body;
    let { params } = body;
    const { type } = body;
    const ret = body.return;

    calls = calls.concat(post);
    if (ret !== "") {
      calls.push(ret);
    }
    calls.push("");

    if (vars.length) {
      vars.push("");
      vars = statements(vars) + "\n";
    } else {
      vars = "";
    }

    calls = statements(calls);
    params = list(params);

    code = fn(type, entry, params, vars, calls);
  }

  return {
    signature: body.signature,
    code,
    name: entry,
  };
}

// Build links to other callbacks
export function links(links) {
  const out = {
    defs: [],
    bodies: [],
  };

  for (let l of Array.from(links)) {
    link(l, out);
  }

  out.defs = lines(out.defs);
  out.bodies = statements(out.bodies);

  if (out.defs === "") {
    delete out.defs;
  }
  if (out.bodies === "") {
    delete out.bodies;
  }

  return out;
}

// Link a module's entry point as a callback
export const link = (link, out) => {
  let arg, list;
  const { module, name, external } = link;
  const { main } = module;
  const { entry } = module;

  // If signatures match, #define alias for the symbol
  if (same(main.signature, external.signature)) {
    return out.defs.push(define(name, entry));
  }

  // Signatures differ, build one-line callback to match defined prototype

  // Map names to names
  const ins = [];
  const outs = [];
  let map = {};
  const returnVar = [module.namespace, $.RETURN_ARG].join("");

  for (arg of Array.from(external.signature)) {
    list = arg.inout === Graph.IN ? ins : outs;
    list.push(arg);
  }

  for (arg of Array.from(main.signature)) {
    list = arg.inout === Graph.IN ? ins : outs;
    const other = list.shift();
    let _name = other.name;

    // Avoid 'return' keyword
    if (_name === $.RETURN_ARG) {
      _name = returnVar;
    }

    map[arg.name] = _name;
  }

  // Build function prototype to invoke the other side
  let _lookup = (name) => map[name];
  const _dangling = () => true;

  const inner = body();
  call(_lookup, _dangling, entry, main.signature, inner);
  inner.entry = entry;

  // Avoid 'return' keyword
  map = { return: returnVar };
  _lookup = (name) => (map[name] != null ? map[name] : name);

  // Build wrapper function for the calling side
  const outer = body();
  call(_lookup, _dangling, entry, external.signature, outer);

  outer.calls = inner.calls;
  outer.entry = name;

  out.bodies.push(build(inner).code.split(" {")[0]);
  return out.bodies.push(build(outer).code);
};

// Remove all function prototypes to avoid redefinition errors
export function defuse(code) {
  // Don't try this at home kids
  const re =
    /([A-Za-z0-9_]+\s+)?[A-Za-z0-9_]+\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*;\s*/gm;
  const strip = (code) => code.replace(re, (_m) => "");

  // Split into scopes by braces
  const blocks = code.split(/(?=[{}])/g);
  let level = 0;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    switch (b[0]) {
      case "{":
        level++;
        break;
      case "}":
        level--;
        break;
    }

    // Only mess with top level scope
    if (level === 0) {
      // Preprocessor lines will fuck us up. Split on them.
      const hash = b.split(/^[ \t]*#/m);
      for (let j = 0; j < hash.length; j++) {
        let line = hash[j];
        if (j > 0) {
          // Trim off preprocessor directive
          line = line.split(/\n/);
          const head = line.shift();
          const rest = line.join("\n");

          // Process rest
          hash[j] = [head, strip(rest)].join("\n");
        } else {
          // Process entire line
          hash[j] = strip(line);
        }
      }

      // Reassemble
      blocks[i] = hash.join("#");
    }
  }

  return (code = blocks.join(""));
}

// Remove duplicate uniforms / varyings / attributes
export function dedupe(code) {
  const map = {};
  const re =
    /((attribute|uniform|varying)\s+)[A-Za-z0-9_]+\s+([A-Za-z0-9_]+)\s*(\[[^\]]*\]\s*)?;\s*/gm;
  return code.replace(re, function (m, qual, type, name, _struct) {
    if (map[name]) {
      return "";
    }
    map[name] = true;
    return m;
  });
}

// Move definitions to top so they compile properly
export function hoist(code) {
  const filter = function (lines, re) {
    const defs = [];
    const out = [];
    for (let line of Array.from(lines)) {
      const list = line.match(re) ? defs : out;
      list.push(line);
    }

    return defs.concat(out);
  };

  let lines = code.split("\n");

  // Hoist symbol defines to the top so (re)definitions use the right alias
  lines = filter(lines, /^#define ([^ ]+ _pg_[0-9]+_|_pg_[0-9]+_ [^ ]+)$/);

  // Hoist extensions
  lines = filter(lines, /^#extension/);

  return lines.join("\n");
}
