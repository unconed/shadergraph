/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// AST node parsers

import { Vector2 } from "three/src/math/Vector2.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Vector4 } from "three/src/math/Vector4.js";
import { Matrix3 } from "three/src/math/Matrix3.js";
import { Matrix4 } from "three/src/math/Matrix4.js";

export let decl = {};

decl.in = 0;
decl.out = 1;
decl.inout = 2;

const get = (n) => n.token.data;

decl.node = function (node) {
  if (
    (node.children[5] != null ? node.children[5].type : undefined) ===
    "function"
  ) {
    return decl.function(node);
  } else if ((node.token != null ? node.token.type : undefined) === "keyword") {
    return decl.external(node);
  }
};

decl.external = function (node) {
  //    console.log 'external', node
  let c = node.children;

  let storage = get(c[1]);
  const type = get(c[4]);
  const list = c[5];

  if (!["attribute", "uniform", "varying"].includes(storage)) {
    storage = "global";
  }

  const out = [];

  for (let i = 0; i < list.children.length; i++) {
    c = list.children[i];
    if (c.type === "ident") {
      const ident = get(c);
      const next = list.children[i + 1];
      const quant = (next != null ? next.type : undefined) === "quantifier";

      out.push({
        decl: "external",
        storage,
        type,
        ident,
        quant: !!quant,
        count: quant,
      });
    }
  }

  return out;
};

decl.function = function (node) {
  const c = node.children;

  //    console.log 'function', node

  const storage = get(c[1]);
  const type = get(c[4]);
  const func = c[5];
  const ident = get(func.children[0]);
  const args = func.children[1];
  const body = func.children[2];

  const decls = Array.from(args.children).map((child) => decl.argument(child));

  return [
    {
      decl: "function",
      storage,
      type,
      ident,
      body: !!body,
      args: decls,
    },
  ];
};

decl.argument = function (node) {
  const c = node.children;

  //    console.log 'argument', node

  const storage = get(c[1]);
  const inout = get(c[2]);
  const type = get(c[4]);
  const list = c[5];
  const ident = get(list.children[0]);
  const quant = list.children[1];

  const count = quant ? quant.children[0].token.data : undefined;

  return {
    decl: "argument",
    storage,
    inout,
    type,
    ident,
    quant: !!quant,
    count,
  };
};

decl.param = function (dir, storage, spec, quant, count) {
  let prefix = [];
  if (storage != null) {
    prefix.push(storage);
  }
  if (spec != null) {
    prefix.push(spec);
  }
  prefix.push("");

  prefix = prefix.join(" ");
  const suffix = quant ? "[" + count + "]" : "";
  if (dir !== "") {
    dir += " ";
  }

  const f = (name, long) => (long ? dir : "") + `${prefix}${name}${suffix}`;
  f.split = (dir) => decl.param(dir, storage, spec, quant, count);

  return f;
};

// Three.js sugar
const win = typeof window !== "undefined";
const threejs = win && !!window.THREE;

const defaults = {
  int: 0,
  float: 0,
  vec2: threejs ? Vector2 : null,
  vec3: threejs ? Vector3 : null,
  vec4: threejs ? Vector4 : null,
  mat2: null,
  mat3: threejs ? Matrix3 : null,
  mat4: threejs ? Matrix4 : null,
  sampler2D: 0,
  samplerCube: 0,
};

const three = {
  int: "i",
  float: "f",
  vec2: "v2",
  vec3: "v3",
  vec4: "v4",
  mat2: "m2",
  mat3: "m3",
  mat4: "m4",
  sampler2D: "t",
  samplerCube: "t",
};

decl.type = function (name, spec, quant, count, dir, storage) {
  const dirs = {
    in: decl.in,
    out: decl.out,
    inout: decl.inout,
  };

  const storages = { const: "const" };

  let type = three[spec];
  if (quant) {
    type += "v";
  }

  let value = defaults[spec];
  if (value != null ? value.call : undefined) {
    value = new value();
  }
  if (quant) {
    value = [value];
  }

  const inout = dirs[dir] != null ? dirs[dir] : dirs.in;
  storage = storages[storage];

  const param = decl.param(dir, storage, spec, quant, count);
  return new Definition(name, type, spec, param, value, inout);
};

class Definition {
  constructor(name, type, spec, param, value, inout, meta) {
    this.name = name;
    this.type = type;
    this.spec = spec;
    this.param = param;
    this.value = value;
    this.inout = inout;
    this.meta = meta;
  }

  split() {
    // Split inouts
    const isIn = this.meta.shadowed != null;
    const dir = isIn ? "in" : "out";
    const inout = isIn ? decl.in : decl.out;
    const param = this.param.split(dir);
    return new Definition(
      this.name,
      this.type,
      this.spec,
      param,
      this.value,
      inout
    );
  }

  copy(name, meta) {
    return new Definition(
      name != null ? name : this.name,
      this.type,
      this.spec,
      this.param,
      this.value,
      this.inout,
      meta
    );
  }
}
