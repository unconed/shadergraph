/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import tokenize from "glsl-tokenizer/string";
import parser from "@sicmutils/glsl-parser/direct";
import { decl } from "./decl";
import { SHADOW_ARG, RETURN_ARG } from "./constants";

let debug = false;

/*
parse GLSL into AST
extract all global symbols and make type signatures
*/
// Parse a GLSL snippet
export const parse = function (name, code) {
  const ast = parseGLSL(name, code);
  return processAST(ast, code);
};

// Parse GLSL language into AST
const parseGLSL = function (name, code) {
  let ast, tock;
  let errors = [];
  if (debug) {
    tock = tick();
  }

  try {
    const tokens = tokenize(code);
    ast = parser(tokens);
  } catch (e) {
    errors = [{ message: e }];
  }

  if (debug) {
    tock("GLSL Tokenize & Parse");
  }

  const fmt = function (code) {
    code = code.split("\n");
    const max = ("" + code.length).length;
    const pad = function (v) {
      if ((v = "" + v).length < max) {
        return ("       " + v).slice(-max);
      } else {
        return v;
      }
    };
    return code.map((line, i) => `${pad(i + 1)}: ${line}`).join("\n");
  };

  if (!ast || errors.length) {
    if (!name) {
      name = "(inline code)";
    }
    console.warn(fmt(code));
    for (const error of errors) {
      console.error(`${name} -`, error.message);
    }
    throw new Error("GLSL parse error");
  }

  return ast;
};

// Process AST for compilation
const processAST = function (ast, code) {
  let tock;
  if (debug) {
    tock = tick();
  }

  // Walk AST tree and collect global declarations
  const symbols = [];
  walk(mapSymbols, collect(symbols), ast, "");

  // Sort symbols into bins
  const [main, internals, externals] = Array.from(sortSymbols(symbols));

  // Extract storage/type signatures of symbols
  const signatures = extractSignatures(main, internals, externals);

  if (debug) {
    tock("GLSL AST");
  }

  return { ast, code, signatures };
};

// Extract functions and external symbols from AST
const mapSymbols = function (node, collect) {
  switch (node.type) {
    case "decl":
      collect(decl.node(node));
      return false;
  }
  return true;
};

const collect = (out) =>
  function (value) {
    if (value != null) {
      Array.from(value).map((obj) => out.push(obj));
    }
  };

// Identify internals, externals and main function
const sortSymbols = function (symbols) {
  let main = null;
  const internals = [];
  let externals = [];
  const maybe = {};
  let found = false;

  for (const s of Array.from(symbols)) {
    if (!s.body) {
      // Unmarked globals are definitely internal
      if (s.storage === "global") {
        internals.push(s);

        // Possible external
      } else {
        externals.push(s);
        maybe[s.ident] = true;
      }
    } else {
      // Remove earlier forward declaration
      if (maybe[s.ident]) {
        externals = Array.from(externals).filter((e) => e.ident !== s.ident);
        delete maybe[s.ident];
      }

      // Internal function
      internals.push(s);

      // Last function is main
      // unless there is a function called 'main'
      if (s.ident === "main") {
        main = s;
        found = true;
      } else if (!found) {
        main = s;
      }
    }
  }

  return [main, internals, externals];
};

// Generate type signatures and appropriate ins/outs
const extractSignatures = function (main, internals, externals) {
  let symbol;
  const sigs = {
    uniform: [],
    attribute: [],
    varying: [],
    external: [],
    internal: [],
    global: [],
    main: null,
  };

  const defn = (symbol) =>
    decl.type(
      symbol.ident,
      symbol.type,
      symbol.quant,
      symbol.count,
      symbol.inout,
      symbol.storage
    );

  const func = function (symbol, inout) {
    let d;
    const signature = Array.from(symbol.args).map((arg) => defn(arg));

    // Split inouts into in and out
    for (d of Array.from(signature)) {
      if (d.inout === decl.inout) {
        const a = d;
        const b = d.copy();

        a.inout = decl.in;
        b.inout = decl.out;
        b.meta = { shadow: a.name };
        b.name += SHADOW_ARG;
        a.meta = { shadowed: b.name };

        signature.push(b);
      }
    }

    // Add output for return type
    if (symbol.type !== "void") {
      signature.unshift(decl.type(RETURN_ARG, symbol.type, false, "", "out"));
    }

    // Make type string
    const inTypes = (() => {
      const result = [];
      for (d of Array.from(signature)) {
        if (d.inout === decl.in) {
          result.push(d.type);
        }
      }
      return result;
    })().join(",");
    const outTypes = (() => {
      const result1 = [];
      for (d of Array.from(signature)) {
        if (d.inout === decl.out) {
          result1.push(d.type);
        }
      }
      return result1;
    })().join(",");
    const type = `(${inTypes})(${outTypes})`;

    return {
      name: symbol.ident,
      type,
      signature,
      inout,
      spec: symbol.type,
    };
  };

  // Main
  sigs.main = func(main, decl.out);

  // Internals (for name replacement only)
  for (symbol of Array.from(internals)) {
    sigs.internal.push({
      name: symbol.ident,
    });
  }

  // Externals
  for (symbol of Array.from(externals)) {
    let def;
    switch (symbol.decl) {
      // Uniforms/attributes/varyings
      case "external":
        def = defn(symbol);
        sigs[symbol.storage].push(def);
        break;

      // Callbacks
      case "function":
        def = func(symbol, decl.in);
        sigs.external.push(def);
        break;
    }
  }

  return sigs;
};

// Walk AST, apply map and collect values
debug = false;

export const walk = function (map, collect, node, indent) {
  debug &&
    console.log(
      indent,
      node.type,
      node.token != null ? node.token.data : undefined,
      node.token != null ? node.token.type : undefined
    );

  const recurse = map(node, collect);

  if (recurse) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      walk(map, collect, child, indent + "  ", debug);
    }
  }

  return null;
};

// #####

const tick = function () {
  const now = +new Date();
  return function (label) {
    const delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};
