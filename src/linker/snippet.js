/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
export class Snippet {
  static initClass() {
    this.index = 0;
  }
  static namespace() {
    return `_sn_${++Snippet.index}_`;
  }

  static load(language, name, code) {
    const program = language.parse(name, code);
    const [sigs, compiler] = Array.from(language.compile(program));
    return new Snippet(language, sigs, compiler, name, code);
  }

  constructor(language, _signatures, _compiler, _name, _original) {
    this.language = language;
    this._signatures = _signatures;
    this._compiler = _compiler;
    this._name = _name;
    this._original = _original;
    this.namespace = null;
    this.code = null;

    this.main = null;
    this.entry = null;

    this.uniforms = null;
    this.externals = null;
    this.symbols = null;
    this.attributes = null;
    this.varyings = null;

    // Tidy up object for export
    if (!this.language) {
      delete this.language;
    }
    if (!this._signatures) {
      delete this._signatures;
    }
    if (!this._compiler) {
      delete this._compiler;
    }
    if (!this._original) {
      delete this._original;
    }

    // Insert snippet name if not provided
    if (!this._name) {
      this._name =
        this._signatures != null ? this._signatures.main.name : undefined;
    }
  }

  clone() {
    return new Snippet(
      this.language,
      this._signatures,
      this._compiler,
      this._name,
      this._original
    );
  }

  bind(config, uniforms, namespace, defines) {
    // Alt syntax (namespace, uniforms, defines)
    let def, left;
    let v;
    if (uniforms === "" + uniforms) {
      [namespace, uniforms, defines] = Array.from([
        uniforms,
        namespace != null ? namespace : {},
        defines != null ? defines : {},
      ]);
      // Alt syntax (uniforms, defines)
    } else if (namespace !== "" + namespace) {
      [defines, namespace] = Array.from([
        namespace != null ? namespace : {},
        undefined,
      ]);
    }

    // Prepare data structure
    this.main = this._signatures.main;
    this.namespace =
      (left = namespace != null ? namespace : this.namespace) != null
        ? left
        : Snippet.namespace();
    this.entry = this.namespace + this.main.name;

    this.uniforms = {};
    this.varyings = {};
    this.attributes = {};
    this.externals = {};
    this.symbols = [];
    const exist = {};
    const exceptions = {};

    // Handle globals and locals for prefixing
    const global = function (name) {
      exceptions[name] = true;
      return name;
    };
    const local = (name) => {
      return this.namespace + name;
    };

    // Apply config
    if (config.globals) {
      for (let key of Array.from(config.globals)) {
        global(key);
      }
    }
    const _u = config.globalUniforms ? global : local;
    const _v = config.globalVaryings ? global : local;
    const _a = config.globalAttributes ? global : local;
    const _e = local;

    // Build finalized properties
    const x = (def) => {
      return (exist[def.name] = true);
    };
    const u = (def, name) => {
      return (this.uniforms[_u(name != null ? name : def.name)] = def);
    };
    v = (def) => {
      return (this.varyings[_v(def.name)] = def);
    };
    const a = (def) => {
      return (this.attributes[_a(def.name)] = def);
    };
    const e = (def) => {
      const name = _e(def.name);
      this.externals[name] = def;
      return this.symbols.push(name);
    };

    const redef = (def) => ({
      type: def.type,
      name: def.name,
      value: def.value,
    });

    for (def of Array.from(this._signatures.uniform)) {
      x(def);
    }
    for (def of Array.from(this._signatures.uniform)) {
      u(redef(def));
    }
    for (def of Array.from(this._signatures.varying)) {
      v(redef(def));
    }
    for (def of Array.from(this._signatures.external)) {
      e(def);
    }
    for (def of Array.from(this._signatures.attribute)) {
      a(redef(def));
    }
    for (let name in uniforms) {
      def = uniforms[name];
      if (exist[name]) {
        u(def, name);
      }
    }

    this.body = this.code = this._compiler(this.namespace, exceptions, defines);

    // Adds defs to original snippet for inspection
    if (defines) {
      const defs = (() => {
        const result = [];
        for (let k in defines) {
          v = defines[k];
          result.push(`#define ${k} ${v}`);
        }
        return result;
      })().join("\n");
      if (defs.length) {
        this._original = [
          defs,
          "//----------------------------------------",
          this._original,
        ].join("\n");
      }
    }

    return null;
  }
}
Snippet.initClass();
