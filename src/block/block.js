/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import * as Graph from "../graph";
import { Program, Layout } from "../linker";

const debug = false;

export class Block {
  static previous(outlet) {
    return outlet.input != null ? outlet.input.node.owner : undefined;
  }

  constructor(delay) {
    // Subclasses can pass `delay` to allow them to initialize before they call
    // `@construct`.
    if (delay == null) {
      delay = false;
    }
    if (!delay) {
      this.construct();
    }
  }

  construct() {
    let left;
    if (this.namespace == null) {
      this.namespace = Program.entry();
    }
    return (this.node = new Graph.Node(
      this,
      (left =
        typeof this.makeOutlets === "function"
          ? this.makeOutlets()
          : undefined) != null
        ? left
        : {}
    ));
  }

  refresh() {
    let left;
    return this.node.setOutlets(
      (left =
        typeof this.makeOutlets === "function"
          ? this.makeOutlets()
          : undefined) != null
        ? left
        : {}
    );
  }

  clone() {
    return new Block();
  }

  // Compile a new program starting from this block
  compile(language, namespace) {
    const program = new Program(
      language,
      namespace != null ? namespace : Program.entry(),
      this.node.graph
    );
    this.call(program, 0);
    return program.assemble();
  }

  // Link up programs into a layout, starting from this block
  link(language, namespace) {
    const module = this.compile(language, namespace);

    const layout = new Layout(language, this.node.graph);
    this._include(module, layout, 0);
    this.export(layout, 0);
    return layout.link(module);
  }

  // Subclassed methods
  call(_program, _depth) {}
  callback(_layout, _depth, _name, _external, _outlet) {}
  export(_layout, _depth) {}

  // Info string for debugging
  _info(suffix) {
    let string =
      (this.node.owner.snippet != null
        ? this.node.owner.snippet._name
        : undefined) != null
        ? this.node.owner.snippet != null
          ? this.node.owner.snippet._name
          : undefined
        : this.node.owner.namespace;
    if (suffix != null) {
      return (string += "." + suffix);
    }
  }

  // Create an outlet for a signature definition
  _outlet(def, props) {
    const outlet = Graph.Outlet.make(def, props);
    outlet.meta.def = def;
    return outlet;
  }

  // Make a call to this module in the given program
  _call(module, program, depth) {
    return program.call(this.node, module, depth);
  }

  // Require this module's dependencies in the given program
  _require(module, program) {
    return program.require(this.node, module);
  }

  // Make a call to all connected inputs
  _inputs(module, program, depth) {
    return (() => {
      const result = [];
      for (const arg of Array.from(module.main.signature)) {
        const outlet = this.node.get(arg.name);
        result.push(
          __guard__(Block.previous(outlet), (x) => x.call(program, depth + 1))
        );
      }
      return result;
    })();
  }

  // Insert callback to this module in the given layout
  _callback(module, layout, depth, name, external, outlet) {
    return layout.callback(this.node, module, depth, name, external, outlet);
  }

  // Include this module in the given layout
  _include(module, layout, depth) {
    return layout.include(this.node, module, depth);
  }

  // Link this module's connected callbacks
  _link(module, layout, depth) {
    debug && console.log("block::_link", this.toString(), module.namespace);
    return (() => {
      const result = [];
      for (const key of Array.from(module.symbols)) {
        const ext = module.externals[key];
        let outlet = this.node.get(ext.name);
        if (!outlet) {
          throw new OutletError(
            `External not found on ${this._info(ext.name)}`
          );
        }

        if (outlet.meta.child != null) {
          continue;
        }

        let parent = outlet;

        // eslint-disable-next-line prefer-const
        let block;
        while (!block && parent) {
          [parent, outlet] = Array.from([outlet.meta.parent, parent]);
        }

        block = Block.previous(outlet);
        if (!block) {
          throw new OutletError(
            `Missing connection on ${this._info(ext.name)}`
          );
        }

        debug && console.log("callback -> ", this.toString(), ext.name, outlet);
        block.callback(layout, depth + 1, key, ext, outlet.input);
        result.push(
          block != null ? block.export(layout, depth + 1) : undefined
        );
      }
      return result;
    })();
  }

  // Trace backwards to discover callbacks further up
  _trace(module, layout, depth) {
    debug && console.log("block::_trace", this.toString(), module.namespace);
    return (() => {
      const result = [];
      for (const arg of Array.from(module.main.signature)) {
        const outlet = this.node.get(arg.name);
        result.push(
          __guard__(Block.previous(outlet), (x) => x.export(layout, depth + 1))
        );
      }
      return result;
    })();
  }
}

const OutletError = function (message) {
  const e = new Error(message);
  e.name = "OutletError";
  return e;
};

OutletError.prototype = new Error();

function __guard__(value, transform) {
  return typeof value !== "undefined" && value !== null
    ? transform(value)
    : undefined;
}
