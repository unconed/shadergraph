(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
  Graph of nodes with outlets
*/
class Graph {
  static initClass() {
    this.index = 0;

    this.IN = 0;
    this.OUT = 1;
  }
  static id(name) { return ++Graph.index; }

  constructor(nodes, parent = null) {
    this.parent = parent;
    this.id    = Graph.id();
    this.nodes = [];
    nodes && this.add(nodes);
  }

  inputs() {
    const inputs = [];
    for (let node of Array.from(this.nodes)) {
      for (let outlet of Array.from(node.inputs)) { if (outlet.input === null) { inputs.push(outlet); } }
    }
    return inputs;
  }

  outputs() {
    const outputs = [];
    for (let node of Array.from(this.nodes)) {
      for (let outlet of Array.from(node.outputs)) { if (outlet.output.length === 0) { outputs.push(outlet); } }
    }
    return outputs;
  }

  getIn(name) { return (Array.from(this.inputs()).filter((outlet) => outlet.name === name))[0]; }
  getOut(name) { return (Array.from(this.outputs()).filter((outlet) => outlet.name === name))[0]; }

  add(node, ignore) {

    if (node.length) {
      for (let _node of Array.from(node)) { this.add(_node); }
      return;
    }

    if (node.graph && !ignore) { throw new Error("Adding node to two graphs at once"); }

    node.graph = this;
    return this.nodes.push(node);
  }

  remove(node, ignore) {
    if (node.length) {
      for (let _node of Array.from(node)) { this.remove(_node); }
      return;
    }

    if (node.graph !== this) { throw new Error("Removing node from wrong graph."); }

    ignore || node.disconnect();

    this.nodes.splice(this.nodes.indexOf(node), 1);
    return node.graph = null;
  }

  adopt(node) {
    if (node.length) {
      for (let _node of Array.from(node)) { this.adopt(_node); }
      return;
    }

    node.graph.remove(node, true);
    return this.add(node, true);
  }
}
Graph.initClass();

module.exports = Graph;

},{}],2:[function(require,module,exports){
exports.Graph  = require('./graph');
exports.Node   = require('./node');
exports.Outlet = require('./outlet');

exports.IN  = exports.Graph.IN;
exports.OUT = exports.Graph.OUT;

},{"./graph":1,"./node":3,"./outlet":4}],3:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Graph  = require('./graph');
const Outlet = require('./outlet');

/*
 Node in graph.
*/
class Node {
  static initClass() {
    this.index = 0;
  }
  static id(name) { return ++Node.index; }

  constructor(owner, outlets) {
    this.owner = owner;
    this.graph   = null;
    this.inputs  = [];
    this.outputs = [];
    this.all     = [];
    this.outlets = null;
    this.id      = Node.id();

    this.setOutlets(outlets);
  }

  // Retrieve input
  getIn(name) {
    return (Array.from(this.inputs).filter((outlet) => outlet.name === name))[0];
  }

  // Retrieve output
  getOut(name) {
    return (Array.from(this.outputs).filter((outlet) => outlet.name === name))[0];
  }

  // Retrieve by name
  get(name) {
    return this.getIn(name) || this.getOut(name);
  }

  // Set new outlet definition
  setOutlets(outlets) {
    if (outlets != null) {
      // First init
      let outlet;
      if ((this.outlets == null)) {
        this.outlets = {};
        for (outlet of Array.from(outlets)) {
          if (!(outlet instanceof Outlet)) { outlet = Outlet.make(outlet); }
          this._add(outlet);
        }
        return;
      }

      // Return new/old outlet matching hash key
      const hash = outlet => // Match by name, direction and type.
      [outlet.name, outlet.inout, outlet.type].join('-');

      // Build hash of new outlets
      const match = {};
      for (outlet of Array.from(outlets)) { match[hash(outlet)] = true; }

      // Remove missing outlets, record matches
      for (let key in this.outlets) {
        outlet = this.outlets[key];
        key = hash(outlet);
        if (match[key]) {
          match[key] = outlet;
        } else {
          this._remove(outlet);
        }
      }

      // Insert new outlets
      for (outlet of Array.from(outlets)) {
        // Find match by hash
        const existing = match[hash(outlet)];
        if (existing instanceof Outlet) {
          // Update existing outlets in place to retain connections.
          this._morph(existing, outlet);
        } else {
          // Spawn new outlet
          if (!(outlet instanceof Outlet)) { outlet = Outlet.make(outlet); }
          this._add(outlet);
        }
      }

      this;
    }
    return this.outlets;
  }

  // Connect to the target node by matching up inputs and outputs.
  connect(node, empty, force) {
    let dest, dests, hint, source, type;
    const outlets = {};
    const hints = {};

    const typeHint = outlet => type + '/' + outlet.hint;

    // Hash the types/hints of available target outlets.
    for (dest of Array.from(node.inputs)) {
      // Only autoconnect if not already connected
      var list;
      if (!force && dest.input) { continue; }

      // Match outlets by type/name hint, then type/position key
      ({
        type
      } = dest);
      hint = typeHint(dest);

      if (!hints[hint]) { hints[hint] = dest; }
      outlets[type] = (list = outlets[type] || []);
      list.push(dest);
    }

    // Available source outlets
    let sources = this.outputs;

    // Ignore connected source if only matching empties.
    sources = sources.filter(outlet => !(empty && outlet.output.length));

    // Match hints first
    for (source of Array.from(sources.slice())) {

      // Match outlets by type and name
      ({
        type
      } = source);
      hint = typeHint(source);
      dests = outlets[type];

      // Connect if found
      if (dest = hints[hint]) {
        source.connect(dest);

        // Remove from potential set
        delete hints[hint];
        dests  .splice(dests.indexOf(dest),     1);
        sources.splice(sources.indexOf(source), 1);
      }
    }

    // Match what's left
    if (!sources.length) { return this; }
    for (source of Array.from(sources.slice())) {

      ({
        type
      } = source);
      dests = outlets[type];

      // Match outlets by type and order
      if (dests && dests.length) {
        // Link up and remove from potential set
        source.connect(dests.shift());
      }
    }

    return this;
  }

  // Disconnect entire node
  disconnect(node) {
    let outlet;
    for (outlet of Array.from(this.inputs)) { outlet.disconnect(); }
    for (outlet of Array.from(this.outputs)) { outlet.disconnect(); }

    return this;
  }

  // Return hash key for outlet
  _key(outlet) {
    return [outlet.name, outlet.inout].join('-');
  }

  // Add outlet object to node
  _add(outlet) {
    const key = this._key(outlet);

    // Sanity checks
    if (outlet.node) { throw new Error("Adding outlet to two nodes at once."); }
    if (this.outlets[key]) { throw new Error(`Adding two identical outlets to same node. (${key})`); }

    // Link back outlet
    outlet.node = this;

    // Add to name hash and inout list
    if (outlet.inout === Graph.IN) { this.inputs.push(outlet); }
    if (outlet.inout === Graph.OUT) { this.outputs.push(outlet); }
    this.all.push(outlet);
    return this.outlets[key] = outlet;
  }

  // Morph outlet to other
  _morph(existing, outlet) {
    let key = this._key(outlet);
    delete this.outlets[key];

    existing.morph(outlet);

    key = this._key(outlet);
    return this.outlets[key] = outlet;
  }

  // Remove outlet object from node.
  _remove(outlet) {
    const key = this._key(outlet);
    const {
      inout
    } = outlet;

    // Sanity checks
    if (outlet.node !== this) { throw new Error("Removing outlet from wrong node."); }

    // Disconnect outlet.
    outlet.disconnect();

    // Unlink outlet.
    outlet.node = null;

    // Remove from name list and inout list.
    delete this.outlets[key];
    if (outlet.inout === Graph.IN) { this.inputs .splice(this.inputs .indexOf(outlet), 1); }
    if (outlet.inout === Graph.OUT) { this.outputs.splice(this.outputs.indexOf(outlet), 1); }
    this.all    .splice(this.all    .indexOf(outlet), 1);
    return this;
  }
}
Node.initClass();

module.exports = Node;

},{"./graph":1,"./outlet":4}],4:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Graph = require('./graph');

/*
  In/out outlet on node
*/
class Outlet {
  static initClass() {
  
    this.index = 0;
  }
  static make(outlet, extra) {
    if (extra == null) { extra = {}; }
    const meta = extra;
    if (outlet.meta != null) { for (let key in outlet.meta) { const value = outlet.meta[key]; meta[key] = value; } }
    return new Outlet(outlet.inout,
               outlet.name,
               outlet.hint,
               outlet.type,
               meta);
  }
  static id(name) {
    return `_io_${++Outlet.index}_${name}`;
  }

  static hint(name) {
    name = name.replace(/^_io_[0-9]+_/, '');
    name = name.replace(/_i_o$/, '');
    return name = name.replace(/(In|Out|Inout|InOut)$/, '');
  }

  constructor(inout, name, hint, type, meta, id) {
    this.inout = inout;
    this.name = name;
    this.hint = hint;
    this.type = type;
    if (meta == null) { meta = {}; }
    this.meta = meta;
    this.id = id;
    if (this.hint == null) {  this.hint = Outlet.hint(this.name); }

    this.node   = null;
    this.input  = null;
    this.output = [];
    if (this.id == null) {    this.id = Outlet.id(this.hint); }
  }

  // Change into given outlet without touching connections
  morph(outlet) {
    this.inout = outlet.inout;
    this.name  = outlet.name;
    this.hint  = outlet.hint;
    this.type  = outlet.type;
    return this.meta  = outlet.meta;
  }

  // Copy with unique name and cloned metadata
  dupe(name) {
    if (name == null) { name = this.id; }
    const outlet = Outlet.make(this);
    outlet.name = name;
    return outlet;
  }

  // Connect to given outlet
  connect(outlet) {

    // Auto-reverse in/out to out/in
    if ((this.inout === Graph.IN)  && (outlet.inout === Graph.OUT)) {
      return outlet.connect(this);
    }

    // Disallow bad combinations
    if ((this.inout !== Graph.OUT) || (outlet.inout !== Graph.IN)) {
      throw new Error("Can only connect out to in.");
    }

    // Check for existing connection
    if (outlet.input === this) { return; }

    // Disconnect existing connections
    outlet.disconnect();

    // Add new connection.
    outlet.input = this;
    return this.output.push(outlet);
  }

  // Disconnect given outlet (or all)
  disconnect(outlet) {
    // Disconnect input from the other side.
    if (this.input) {
      this.input.disconnect(this);
    }

    if (this.output.length) {

      if (outlet) {
        // Remove one outgoing connection.
        const index = this.output.indexOf(outlet);
        if (index >= 0) {
          this.output.splice(index, 1);
          return outlet.input = null;
        }

      } else {
        // Remove all outgoing connections.
        for (outlet of Array.from(this.output)) { outlet.input = null; }
        return this.output = [];
      }
    }
  }
}
Outlet.initClass();

module.exports = Outlet;

},{"./graph":1}],5:[function(require,module,exports){
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
const Graph   = require('../graph');
const {
  Program
} = require('../linker');
const {
  Layout
} = require('../linker');

const debug = false;

class Block {
  static previous(outlet) { return (outlet.input != null ? outlet.input.node.owner : undefined); }

  constructor(delay) {
    // Subclasses can pass `delay` to allow them to initialize before they call
    // `@construct`.
    if (delay == null) { delay = false; }
    if (!delay) { this.construct(); }
  }

  construct() {
    let left;
    if (this.namespace == null) { this.namespace = Program.entry(); }
    return this.node       = new Graph.Node(this, (left = (typeof this.makeOutlets === 'function' ? this.makeOutlets() : undefined)) != null ? left : {});
  }

  refresh() {
    let left;
    return this.node.setOutlets((left = (typeof this.makeOutlets === 'function' ? this.makeOutlets() : undefined)) != null ? left : {});
  }

  clone() {
    return new Block;
  }

  // Compile a new program starting from this block
  compile(language, namespace) {
    const program = new Program(language, namespace != null ? namespace : Program.entry(), this.node.graph);
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
  call(program, depth) {}
  callback(layout, depth, name, external, outlet) {}
  export(layout, depth) {}

  // Info string for debugging
  _info(suffix) {
    let string = (this.node.owner.snippet != null ? this.node.owner.snippet._name : undefined) != null ? (this.node.owner.snippet != null ? this.node.owner.snippet._name : undefined) : this.node.owner.namespace;
    if (suffix != null) { return string += '.' + suffix; }
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
      for (let arg of Array.from(module.main.signature)) {
        const outlet = this.node.get(arg.name);
        result.push(__guard__(Block.previous(outlet), x => x.call(program, depth + 1)));
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
    debug && console.log('block::_link', this.toString(), module.namespace);
    return (() => {
      const result = [];
      for (let key of Array.from(module.symbols)) {
        const ext = module.externals[key];
        let outlet = this.node.get(ext.name);
        if (!outlet) { throw new OutletError(`External not found on ${this._info(ext.name)}`); }

        if (outlet.meta.child != null) { continue; }

        let [orig, parent, block] = Array.from([outlet, outlet, null]);
        while (!block && parent) {
          [parent, outlet] = Array.from([outlet.meta.parent, parent]);
        }

        block  = Block.previous(outlet);
        if (!block) { throw new OutletError(`Missing connection on ${this._info(ext.name)}`); }

        debug && console.log('callback -> ', this.toString(), ext.name, outlet);
        block.callback(layout, depth + 1, key, ext, outlet.input);
        result.push((block != null ? block.export(layout, depth + 1) : undefined));
      }
      return result;
    })();
  }

  // Trace backwards to discover callbacks further up
  _trace(module, layout, depth) {
    debug && console.log('block::_trace', this.toString(), module.namespace);
    return (() => {
      const result = [];
      for (let arg of Array.from(module.main.signature)) {
        const outlet = this.node.get(arg.name);
        result.push(__guard__(Block.previous(outlet), x => x.export(layout, depth + 1)));
      }
      return result;
    })();
  }
}

var OutletError = function(message) {
  const e = new Error(message);
  e.name = 'OutletError';
  return e;
};

OutletError.prototype = new Error;

module.exports = Block;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
},{"../graph":25,"../linker":30}],6:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Block   = require('./block');

class Call extends Block {
  constructor(snippet) {
    super(true);

    this.snippet = snippet;
    this.namespace = snippet.namespace;
    this.construct();
  }

  clone() {
    return new Call(this.snippet);
  }

  makeOutlets() {
    const main      = this.snippet.main.signature;
    const {
      externals
    } = this.snippet;
    const {
      symbols
    } = this.snippet;

    const params    = (Array.from(main).map((outlet) => this._outlet(outlet,         {callback: false})));
    const callbacks = (Array.from(symbols).map((key) => this._outlet(externals[key], {callback: true})));

    return params.concat(callbacks);
  }

  call(program, depth) {
    this._call(this.snippet, program, depth);
    return this._inputs(this.snippet, program, depth);
  }

  export(layout, depth) {
    if (!layout.visit(this.namespace, depth)) { return; }

    this._link(this.snippet, layout, depth);
    return this._trace(this.snippet, layout, depth);
  }
}

module.exports = Call;

},{"./block":5}],7:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Graph   = require('../graph');
const Block   = require('./block');

/*
  Re-use a subgraph as a callback
*/
class Callback extends Block {
  constructor(graph) {
    super(true);
    this.graph = graph;
    this.construct();
  }

  refresh() {
    super.refresh();
    return delete this.subroutine;
  }

  clone() {
    return new Callback(this.graph);
  }

  makeOutlets() {
    let outlet;
    this.make();

    const outlets = [];
    let ins     = [];
    let outs    = [];

    // Pass-through existing callbacks
    // Collect open inputs/outputs
    const handle = (outlet, list) => {
      if (outlet.meta.callback) {
        if (outlet.inout === Graph.IN) {
          // Dupe outlet and create two-way link between cloned outlets
          const dupe = outlet.dupe();
          if (dupe  .meta.child == null) { dupe.meta.child = outlet; }
          outlet.meta.parent = dupe;

          return outlets.push(dupe);
        }
      } else {
        return list.push(outlet.type);
      }
    };

    for (outlet of Array.from(this.graph.inputs())) { handle(outlet, ins); }
    for (outlet of Array.from(this.graph.outputs())) { handle(outlet, outs); }

    // Merge inputs/outputs into new callback signature
    ins  = ins.join(',');
    outs = outs.join(',');
    const type = `(${ins})(${outs})`;

    outlets.push({
      name:  'callback',
      type,
      inout: Graph.OUT,
      meta: {
        callback: true,
        def: this.subroutine.main
      }
    });

    return outlets;
  }

  make() {
    return this.subroutine = this.graph.compile(this.namespace);
  }

  export(layout, depth) {
    if (!layout.visit(this.namespace, depth)) { return; }

    this._link(this.subroutine, layout, depth);
    return this.graph.export(layout, depth);
  }

  call(program, depth) {
    return this._require(this.subroutine, program, depth);
  }

  callback(layout, depth, name, external, outlet) {
    this._include(this.subroutine, layout, depth);
    return this._callback(this.subroutine, layout, depth, name, external, outlet);
  }
}

module.exports = Callback;

},{"../graph":25,"./block":5}],8:[function(require,module,exports){
exports.Block    = require('./block');
exports.Call     = require('./call');
exports.Callback = require('./callback');
exports.Isolate  = require('./isolate');
exports.Join     = require('./join');

},{"./block":5,"./call":6,"./callback":7,"./isolate":9,"./join":10}],9:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Graph   = require('../graph');
const Block   = require('./block');

/*
  Isolate a subgraph as a single node
*/
class Isolate extends Block {
  constructor(graph) {
    super(true);
    this.graph = graph;
    this.construct();
  }

  refresh() {
    super.refresh();
    return delete this.subroutine;
  }

  clone() {
    return new Isolate(this.graph);
  }

  makeOutlets() {
    this.make();

    const outlets = [];

    const seen = {};
    const done = {};
    for (let set of ['inputs', 'outputs']) {
      for (let outlet of Array.from(this.graph[set]())) {
        // Preserve name of 'return' and 'callback' outlets
        let name = undefined;
        if (['return', 'callback'].includes(outlet.hint) &&
                              (outlet.inout === Graph.OUT)) { name = outlet.hint; }

        // Unless it already exists
        if (seen[name] != null) { name = undefined; }

        // Dupe outlet and remember link to original
        const dupe = outlet.dupe(name);
        if (dupe  .meta.child == null) { dupe.meta.child = outlet; }
        outlet.meta.parent = dupe;
        if (name != null) { seen[name] = true; }
        done[outlet.name] = dupe;

        outlets.push(dupe);
      }
    }

    return outlets;
  }

  make() {
    return this.subroutine = this.graph.compile(this.namespace);
  }

  call(program, depth) {
    this._call(this.subroutine, program, depth);
    return this._inputs(this.subroutine, program, depth);
  }

  export(layout, depth) {
    if (!layout.visit(this.namespace, depth)) { return; }

    // Link up with normal inputs
    this._link(this.subroutine, layout, depth);
    this._trace(this.subroutine, layout, depth);

    // Export callbacks needed to call the subroutine
    return this.graph.export(layout, depth);
  }

  callback(layout, depth, name, external, outlet) {
    outlet = outlet.meta.child;
    return outlet.node.owner.callback(layout, depth, name, external, outlet);
  }
}

module.exports = Isolate;

},{"../graph":25,"./block":5}],10:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Block   = require('./block');

/*
  Join multiple disconnected nodes
*/
class Join extends Block {
  constructor(nodes) {
    super(true);
    this.nodes = nodes;
    this.construct();
  }

  clone() {
    return new Join(this.nodes);
  }

  makeOutlets() { return []; }

  call(program, depth) {
    return (() => {
      const result = [];
      for (let node of Array.from(this.nodes)) {
        const block = node.owner;
        result.push(block.call(program, depth));
      }
      return result;
    })();
  }

  export(layout, depth) {
    return (() => {
      const result = [];
      for (let node of Array.from(this.nodes)) {
        const block = node.owner;
        result.push(block.export(layout, depth));
      }
      return result;
    })();
  }
}

module.exports = Join;

},{"./block":5}],11:[function(require,module,exports){
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
},{"./hash":13,"./queue":17}],12:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  Graph
} = require('../graph');
const Block     = require('../block');
const Visualize = require('../visualize');

/*
  Chainable factory
  
  Exposes methods to build a graph incrementally
*/
class Factory {
  constructor(language, fetch, config) {
    this.language = language;
    this.fetch = fetch;
    this.config = config;
    this.graph();
  }

  // Combined call/concat shortcut
  pipe(name, uniforms, namespace, defines) {
    if (name instanceof Factory) {
      this._concat(name);
    } else if (name != null) {
      this._call(name, uniforms, namespace, defines);
    }
    return this;
  }

  // Old name
  call(name, uniforms, namespace, defines) {
    return this.pipe(name, uniforms, namespace, defines);
  }

  // Combined callback/import shortcut
  require(name, uniforms, namespace, defines) {
    if (name instanceof Factory) {
      this._import(name);
    } else if (name != null) {
      this.callback();
      this._call(name, uniforms, namespace, defines);
      this.end();
    }
    return this;
  }

  // Old name
  import(name, uniforms, namespace, defines) {
    return this.require(name, uniforms, namespace, defines);
  }

  // Create parallel branches that connect as one block to the end
  // (one outgoing connection per outlet)
  split() {
    this._group('_combine', true);
    return this;
  }

  // Create parallel branches that fan out from the end
  // (multiple outgoing connections per outlet)
  fan() {
    this._group('_combine', false);
    return this;
  }

  // Create isolated subgraph
  isolate() {
    this._group('_isolate');
    return this;
  }

  // Create callback subgraph
  callback() {
    this._group('_callback');
    return this;
  }

  // Next branch in group
  next() {
    this._next();
    return this;
  }

  // Connect branches to previous tail and add pass-through from end
  pass() {
    const pass = this._stack[2].end;
    this.end();
    this._state.end = this._state.end.concat(pass);
    return this;
  }

  // Leave nested branches and join up with main graph,
  // applying stored op along the way
  end() {
    const [sub, main] = Array.from(this._exit());
    const {
      op
    } = sub;
    if (this[op]) {
      this[op](sub, main);
    }
    return this;
  }

  // Old name
  join() {
    return this.end();
  }

  // Return finalized graph / reset factory
  graph() {
    // Pop remaining stack
    while ((this._stack != null ? this._stack.length : undefined) > 1) { this.end(); }

    // Remember terminating node(s) of graph
    if (this._graph) {
      this._tail(this._state, this._graph);
    }

    const graph = this._graph;

    this._graph = new Graph;
    this._state = new State;
    this._stack = [this._state];

    return graph;
  }

  // Compile shortcut (graph is thrown away)
  compile(namespace) {
    if (namespace == null) { namespace = 'main'; }
    return this.graph().compile(namespace);
  }

  // Link shortcut (graph is thrown away)
  link(namespace) {
    if (namespace == null) { namespace = 'main'; }
    return this.graph().link(namespace);
  }

  // Serialize for debug
  serialize() {
    return Visualize.serialize(this._graph);
  }

  // Return true if empty
  empty() { return this._graph.nodes.length === 0; }

  // Concatenate existing factory onto tail
  // Retains original factory
  _concat(factory) {
    // Ignore empty concat
    let block;
    if (factory._state.nodes.length === 0) { return this; }

    this._tail(factory._state, factory._graph);

    try {
      block = new Block.Isolate(factory._graph);
    } catch (error) {
      if (this.config.autoInspect) { Visualize.inspect(error, this._graph, factory); }
      throw error;
    }

    this._auto(block);
    return this;
  }

  // Add existing factory as callback
  // Retains original factory
  _import(factory) {
    // Check for empty require
    let block;
    if (factory._state.nodes.length === 0) { throw "Can't import empty callback"; }

    this._tail(factory._state, factory._graph);

    try {
      block = new Block.Callback(factory._graph);
    } catch (error) {
      if (this.config.autoInspect) { Visualize.inspect(error, this._graph, factory); }
      throw error;
    }

    this._auto(block);
    return this;
  }

  // Connect parallel branches to tail
  _combine(sub, main) {
    for (let to of Array.from(sub.start)) {
      for (let from of Array.from(main.end)) { from.connect(to, sub.multi); }
    }

    main.end   = sub.end;
    return main.nodes = main.nodes.concat(sub.nodes);
  }

  // Make subgraph and connect to tail 
  _isolate(sub, main) {
    if (sub.nodes.length) {
      let block;
      const subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);

      try {
        block = new Block.Isolate(subgraph);
      } catch (error) {
        if (this.config.autoInspect) { Visualize.inspect(error, this._graph, subgraph); }
        throw error;
      }

      return this._auto(block);
    }
  }

  // Convert to callback and connect to tail
  _callback(sub, main) {
    if (sub.nodes.length) {
      let block;
      const subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);

      try {
        block = new Block.Callback(subgraph);
      } catch (error) {
        if (this.config.autoInspect) { Visualize.inspect(error, this._graph, subgraph); }
        throw error;
      }

      return this._auto(block);
    }
  }

  // Create next call block
  _call(name, uniforms, namespace, defines) {
    const snippet = this.fetch(name);
    snippet.bind(this.config, uniforms, namespace, defines);
    const block = new Block.Call(snippet);
    return this._auto(block);
  }

  // Move current state into subgraph
  _subgraph(sub) {
    const subgraph = new Graph(null, this._graph);
    subgraph.adopt(sub.nodes);
    return subgraph;
  }

  // Finalize graph tail
  _tail(state, graph) {

    // Merge (unique) terminating ends into single tail node if needed
    let tail = state.end.concat(state.tail);
    tail = tail.filter((node, i) => tail.indexOf(node) === i);

    if (tail.length > 1) {
      tail = new Block.Join(tail);
      tail = [tail.node];
      this._graph.add(tail);
    }

    // Save single endpoint
    graph.tail = tail[0];
    state.end  = tail;
    state.tail = [];

    if (!graph.tail) {
      throw new Error("Cannot finalize empty graph");
    }

    // Add compile/link/export/inspect shortcut methods
    graph.compile = namespace => {
      if (namespace == null) { namespace = 'main'; }
      try {
        return graph.tail.owner.compile(this.language, namespace);
      } catch (error) {
        if (this.config.autoInspect) { graph.inspect(error); }
        throw error;
      }
    };

    graph.link    = namespace => {
      if (namespace == null) { namespace = 'main'; }
      try {
        return graph.tail.owner.link(this.language, namespace);
      } catch (error) {
        if (this.config.autoInspect) { graph.inspect(error); }
        throw error;
      }
    };

    graph.export  = (layout, depth) => {
      return graph.tail.owner.export(layout, depth);
    };

    return graph.inspect = (message = null) => Visualize.inspect(message, graph);
  }

  // Create group for branches or callbacks
  _group(op, multi) {
    this._push(op, multi); // Accumulator
    this._push();         // Current
    return this;
  }

  // Merge branch into accumulator and reset state
  _next() {
    const sub = this._pop();

    this._state.start = this._state.start.concat(sub.start);
    this._state.end   = this._state.end  .concat(sub.end);
    this._state.nodes = this._state.nodes.concat(sub.nodes);
    this._state.tail  = this._state.tail .concat(sub.tail);

    return this._push();
  }

  // Exit nested branches
  _exit() {
    this._next();
    this._pop();
    return [this._pop(), this._state];
  }

  // State stack
  _push(op, multi) {
    this._stack.unshift(new State(op, multi));
    return this._state = this._stack[0];
  }

  _pop() {
    let left;
    this._state = this._stack[1];
    if (this._state == null) { this._state = new State; }
    return (left = this._stack.shift()) != null ? left : new State;
  }

  // Auto append or insert depending on whether we have inputs
  _auto(block) {
    if (block.node.inputs.length) {
      return this._append(block);
    } else {
      return this._insert(block);
    }
  }

  // Add block and connect to end
  _append(block) {
    let end;
    const {
      node
    } = block;
    this._graph.add(node);

    for (end of Array.from(this._state.end)) { end.connect(node); }

    if (!this._state.start.length) { this._state.start = [node]; }
    this._state.end   = [node];

    this._state.nodes.push(node);
    if (!node.outputs.length) { return this._state.tail .push(node); }
  }

  // Add block and connect to start
  _prepend(block) {
    let start;
    const {
      node
    } = block;
    this._graph.add(node);

    for (start of Array.from(this._state.start)) { node.connect(start); }

    if (!this._state.end.length) { this._state.end   = [node]; }
    this._state.start = [node];

    this._state.nodes.push(node);
    if (!node.outputs.length) { return this._state.tail .push(node); }
  }

  // Insert loose block
  _insert(block) {
    const {
      node
    } = block;
    this._graph.add(node);

    this._state.start.push(node);
    this._state.end  .push(node);

    this._state.nodes.push(node);
    if (!node.outputs.length) { return this._state.tail .push(node); }
  }
}

class State {
  constructor(op = null, multi, start, end, nodes, tail) {
    this.op = op;
    if (multi == null) { multi = false; }
    this.multi = multi;
    if (start == null) { start = []; }
    this.start = start;
    if (end == null) { end = []; }
    this.end = end;
    if (nodes == null) { nodes = []; }
    this.nodes = nodes;
    if (tail == null) { tail = []; }
    this.tail = tail;
  }
}

module.exports = Factory;
},{"../block":8,"../graph":25,"../visualize":36}],13:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Hash string into a 32-bit key (murmurhash3)
const c1 = 0xcc9e2d51;
const c2 = 0x1b873593;
const c3 = 0xe6546b64;
const c4 = 0x85ebca6b;
const c5 = 0xc2b2ae35;

// Fix imul in old/broken browsers
let imul = function(a, b) {
  const ah = (a >>> 16) & 0xffff;
  const al = a & 0xffff;
  const bh = (b >>> 16) & 0xffff;
  const bl = b & 0xffff;
  return ((al * bl) + ((((ah * bl) + (al * bh)) << 16) >>> 0)) | 0;
};

if (Math.imul != null) {
  const test = Math.imul(0xffffffff, 5);
  if (test === -5) { ({
    imul
  } = Math); }
}


const hash = function(string) {
  let h;
  const n = string.length;
  let m = Math.floor(n / 2);
  let j = (h = 0);

  const next = () => string.charCodeAt(j++);
  const iterate = function(a, b) {
    let k  = a | (b << 16); // two utf-16 words
    k ^= (k << 9);      // whitening for ascii-only strings

    k  = imul(k, c1);
    k  = (k << 15) | (k >>> 17);
    k  = imul(k, c2);

    h ^= k;

    h  = (h << 13) | (h >>> 19);
    h  = imul(h, 5);
    return h  = (h + c3) | 0;
  };

  while (m--) { iterate(next(), next()); }
  if (n & 1) { iterate(next(), 0); }

  h ^= n;
  h ^= h >>> 16;
  h  = imul(h, c4);
  h ^= h >>> 13;
  h  = imul(h, c5);
  return h ^= h >>> 16;
};

module.exports = hash;
},{}],14:[function(require,module,exports){
exports.Factory  = require('./factory');
exports.Material = require('./material');

exports.library   = require('./library');
exports.cache     = require('./cache');
exports.queue     = require('./queue');
exports.hash      = require('./hash');

},{"./cache":11,"./factory":12,"./hash":13,"./library":15,"./material":16,"./queue":17}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = false;
const Visualize = require('../visualize');

const tick = function() {
  const now = +new Date;
  return function(label) {
    const delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

class Material {
  constructor(vertex, fragment) {
    this.vertex = vertex;
    this.fragment = fragment;
    if (debug) { this.tock = tick(); }
  }

  build(options) { return this.link(options); }
  link(options) {
    if (options == null) { options = {}; }
    const uniforms   = {};
    const varyings   = {};
    const attributes = {};

    const vertex   = this.vertex  .link('main');
    const fragment = this.fragment.link('main');

    for (let shader of [vertex, fragment]) {
      var key, value;
      for (key in shader.uniforms) { value = shader.uniforms[key]; uniforms[key]   = value; }
      for (key in shader.varyings) { value = shader.varyings[key]; varyings[key]   = value; }
      for (key in shader.attributes) { value = shader.attributes[key]; attributes[key] = value; }
    }

    options.vertexShader   = vertex  .code;
    options.vertexGraph    = vertex  .graph;
    options.fragmentShader = fragment.code;
    options.fragmentGraph  = fragment.graph;
    options.attributes     = attributes;
    options.uniforms       = uniforms;
    options.varyings       = varyings;
    options.inspect        = () => Visualize.inspect('Vertex Shader', vertex, 'Fragment Shader', fragment.graph);

    if (debug) { this.tock('Material build'); }

    return options;
  }

  inspect() {
    return Visualize.inspect('Vertex Shader', this.vertex, 'Fragment Shader', this.fragment.graph);
  }
}

module.exports = Material;

},{"../visualize":36}],17:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Least-recently-used queue for key expiry via linked list
const queue = function(limit) {
  if (limit == null) { limit = 100; }
  const map = {};

  let head  = null;
  let tail  = null;
  let count = 0;

  // Insert at front
  const add = function(item) {
    item.prev = null;
    item.next = head;

    if (head != null) { head.prev = item; }

    head      = item;
    if ((tail == null)) { return tail      = item; }
  };

  // Remove from list
  const remove = function(item) {
    const {
      prev
    } = item;
    const {
      next
    } = item;

    if (prev != null) { prev.next = next; }
    if (next != null) { next.prev = prev; }

    if (head === item) { head = next; }
    if (tail === item) { return tail = prev; }
  };

  // Push key to top of list
  return function(key) {
    let dead, item;
    if (item = map[key] && (item !== head)) {
      // Already in queue
      remove(item);
      add(item);

    } else {
      // Check capacity
      if (count === limit) {
        // Pop tail
        dead = tail.key;
        remove(tail);

        // Expire key
        delete map[dead];
      } else {
        count++;
      }

      // Replace head
      item = {next: head, prev: null, key};
      add(item);

      // Map record for lookup
      map[key] = item;
    }

    // Return expired key
    return dead;
  };
};

module.exports = queue;

},{}],18:[function(require,module,exports){
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

const compile = function(program) {
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

module.exports = compile;

},{}],19:[function(require,module,exports){
module.exports = {
  SHADOW_ARG: '_i_o',
  RETURN_ARG: 'return'
};

},{}],20:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// AST node parsers

let decl;
module.exports = (decl = {});

decl.in    = 0;
decl.out   = 1;
decl.inout = 2;

const get = n => n.token.data;

decl.node = function(node) {

  if ((node.children[5] != null ? node.children[5].type : undefined) === 'function') {
    return decl.function(node);

  } else if ((node.token != null ? node.token.type : undefined) === 'keyword') {
    return decl.external(node);
  }
};

decl.external = function(node) {
  //    console.log 'external', node
  let c = node.children;

  let storage = get(c[1]);
  const struct  = get(c[3]);
  const type    = get(c[4]);
  const list    = c[5];

  if (!['attribute', 'uniform', 'varying'].includes(storage)) { storage = 'global'; }

  const out = [];

  for (let i = 0; i < list.children.length; i++) {
    c = list.children[i];
    if (c.type === 'ident') {
      const ident   = get(c);
      const next    = list.children[i + 1];
      const quant   = ((next != null ? next.type : undefined) === 'quantifier');

      out.push({
        decl: 'external',
        storage,
        type,
        ident,
        quant: !!quant,
        count: quant
      });
    }
  }

  return out;
};

decl.function = function(node) {
  const c = node.children;

  //    console.log 'function', node

  const storage = get(c[1]);
  const struct  = get(c[3]);
  const type    = get(c[4]);
  const func    = c[5];
  const ident   = get(func.children[0]);
  const args    = func.children[1];
  const body    = func.children[2];

  const decls = (Array.from(args.children).map((child) => decl.argument(child)));

  return [{
    decl: 'function',
    storage,
    type,
    ident,
    body: !!body,
    args: decls
  }
  ];
};

decl.argument = function(node) {
  const c = node.children;

  //    console.log 'argument', node

  const storage = get(c[1]);
  const inout   = get(c[2]);
  const type    = get(c[4]);
  const list    = c[5];
  const ident   = get(list.children[0]);
  const quant   = list.children[1];

  const count   = quant ? quant.children[0].token.data : undefined;

  return {
    decl: 'argument',
    storage,
    inout,
    type,
    ident,
    quant: !!quant,
    count
  };
};

decl.param = function(dir, storage, spec, quant, count) {
  let prefix = [];
  if (storage != null) { prefix.push(storage); }
  if (spec != null) { prefix.push(spec); }
  prefix.push('');

  prefix = prefix.join(' ');
  const suffix = quant ? '[' + count + ']' : '';
  if (dir !== '') { dir += ' '; }

  const f = (name, long) => (long ? dir : '') + `${prefix}${name}${suffix}`;
  f.split = dir => decl.param(dir, storage, spec, quant, count);

  return f;
};

// Three.js sugar
const win = typeof window !== 'undefined';
const threejs = win && !!window.THREE;

const defaults = {
  int:         0,
  float:       0,
  vec2:        threejs ? THREE.Vector2 : null,
  vec3:        threejs ? THREE.Vector3 : null,
  vec4:        threejs ? THREE.Vector4 : null,
  mat2:        null,
  mat3:        threejs ? THREE.Matrix3 : null,
  mat4:        threejs ? THREE.Matrix4 : null,
  sampler2D:   0,
  samplerCube: 0
};

const three = {
  int:         'i',
  float:       'f',
  vec2:        'v2',
  vec3:        'v3',
  vec4:        'v4',
  mat2:        'm2',
  mat3:        'm3',
  mat4:        'm4',
  sampler2D:   't',
  samplerCube: 't'
};

decl.type = function(name, spec, quant, count, dir, storage) {

  const dirs = {
    in:    decl.in,
    out:   decl.out,
    inout: decl.inout
  };

  const storages =
    {const: 'const'};

  let type    = three[spec];
  if (quant) { type   += 'v'; }

  let value   = defaults[spec];
  if (value != null ? value.call : undefined) { value   = new value; }
  if (quant) { value   = [value]; }

  const inout   = dirs[dir] != null ? dirs[dir] : dirs.in;
  storage = storages[storage];

  const param   = decl.param(dir, storage, spec, quant, count);
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
    const isIn  = (this.meta.shadowed != null);
    const dir   = isIn ? 'in' : 'out';
    const inout = isIn ? decl.in : decl.out;
    const param = this.param.split(dir);
    return new Definition(this.name, this.type, this.spec, param, this.value, inout);
  }

  copy(name, meta) {
    let def;
    return def = new Definition(name != null ? name : this.name, this.type, this.spec, this.param, this.value, this.inout, meta);
  }
}


},{}],21:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let _;
const Graph = require('../graph');
const $     = require('./constants');

/*
 GLSL code generator for compiler and linker stubs
*/

module.exports = (_ = {

  // Check if shadow outlet
  unshadow(name) {
    const real = name.replace($.SHADOW_ARG, '');
    if (real !== name) { return real; } else { return null; }
  },

  // Line joiners
  lines(lines) { return lines.join('\n'); },
  list(lines) { return lines.join(', '); },
  statements(lines) { return lines.join(';\n'); },

  // Function body
  body(entry) {
    return {
      entry,
      type:      'void',
      params:    [],
      signature: [],
      return:    '',
      vars:      {},
      calls:     [],
      post:      [],
      chain:     {}
    };
  },

  // Symbol define
  define(a, b) {
    return `#define ${a} ${b}`;
  },

  // Function define
  function(type, entry, params, vars, calls) {
    return `${type} ${entry}(${params}) {\n${vars}${calls}}`;
  },

  // Function invocation
  invoke(ret, entry, args) {
    ret = ret ? `${ret} = ` : '';
    args = _.list(args);
    return `  ${ret}${entry}(${args})`;
  },

  // Compare two signatures
  same(a, b) {
    for (let i = 0; i < a.length; i++) {
      const A = a[i];
      const B = b[i];
      if (!B) { return false; }
      if (A.type !== B.type) { return false; }
      if ((A.name === $.RETURN_ARG) !== (B.name === $.RETURN_ARG)) { return false; }
    }
    return true;
  },

  // Generate call signature for module invocation
  call(lookup, dangling, entry, signature, body) {
    const args      = [];
    let ret       = '';
    const rets      = 1;

    for (let arg of Array.from(signature)) {
      var id, shadow;
      const {
        name
      } = arg;

      let copy = (id = lookup(name));
      let other = null;
      let meta  = null;
      let omit  = false;
      const {
        inout
      } = arg;

      const isReturn = name === $.RETURN_ARG;

      // Shadowed inout: input side
      if (shadow = arg.meta != null ? arg.meta.shadowed : undefined) {
        other = lookup(shadow);
        if (other) {
          body.vars[other] = "  " + arg.param(other);
          body.calls.push(`  ${other} = ${id}`);

          if (!dangling(shadow)) {
            arg = arg.split();
          } else {
            meta = {shadowed: other};
          }
        }
      }

      // Shadowed inout: output side
      if (shadow = arg.meta != null ? arg.meta.shadow : undefined) {
        other = lookup(shadow);
        if (other) {
          if (!dangling(shadow)) {
            arg = arg.split();
            omit = true;
          } else {
            meta = {shadow: other};
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
        let op = 'push';
        if (isReturn) {
          if (body.return === '') {
            op = 'unshift';
            // Preserve 'return' arg name
            copy = name;
            body.type     = arg.spec;
            body.return   = `  return ${id}`;
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

    return body.calls.push(_.invoke(ret, entry, args));
  },

  // Assemble main() function from body and call reference
  build(body, calls) {
    const {
      entry
    } = body;
    let code    = null;

    // Check if we're only calling one snippet with identical signature
    // and not building void main();
    if (calls && (calls.length === 1) && (entry !== 'main')) {
      const a = body;
      const b = calls[0].module;

      if (_.same(body.signature, b.main.signature)) {
        code = _.define(entry, b.entry);
      }
    }

    // Otherwise build function body
    if ((code == null)) {
      let vars    = ((() => {
        const result = [];
        for (let v in body.vars) {
          const decl = body.vars[v];
          result.push(decl);
        }
        return result;
      })());
      ({
        calls
      } = body);
      const {
        post
      } = body;
      let {
        params
      } = body;
      const {
        type
      } = body;
      const ret     = body.return;

      calls = calls.concat(post);
      if (ret !== '') { calls.push(ret); }
      calls.push('');

      if (vars.length) {
        vars.push('');
        vars = _.statements(vars) + '\n';
      } else {
        vars = '';
      }

      calls  = _.statements(calls);
      params = _.list(params);

      code   = _.function(type, entry, params, vars, calls);
    }

    return {
      signature: body.signature,
      code,
      name:      entry
    };
  },

  // Build links to other callbacks
  links(links) {
    const out = {
      defs: [],
      bodies: []
    };

    for (let l of Array.from(links)) { _.link(l, out); }

    out.defs   = _.lines(out.defs);
    out.bodies = _.statements(out.bodies);

    if (out.defs   === '') { delete out.defs; }
    if (out.bodies === '') { delete out.bodies; }

    return out;
  },

  // Link a module's entry point as a callback
  link: (link, out) => {
    let arg, list;
    const {module, name, external} = link;
    const {
      main
    } = module;
    const {
      entry
    } = module;

    // If signatures match, #define alias for the symbol
    if (_.same(main.signature, external.signature)) {
      return out.defs.push(_.define(name, entry));
    }

    // Signatures differ, build one-line callback to match defined prototype

    // Map names to names
    const ins  = [];
    const outs = [];
    let map  = {};
    const returnVar = [module.namespace, $.RETURN_ARG].join('');

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
    let _lookup = name => map[name];
    const _dangling = () => true;

    const inner   = _.body();
    _.call(_lookup, _dangling, entry, main.signature, inner);
    inner.entry = entry;

    // Avoid 'return' keyword
    map =
      {return: returnVar};
    _lookup = name => map[name] != null ? map[name] : name;

    // Build wrapper function for the calling side
    const outer   = _.body();
    const wrapper = _.call(_lookup, _dangling, entry, external.signature, outer);
    outer.calls = inner.calls;
    outer.entry = name;

    out.bodies.push(_.build(inner).code.split(' {')[0]);
    return out.bodies.push(_.build(outer).code);
  },

  // Remove all function prototypes to avoid redefinition errors
  defuse(code) {
    // Don't try this at home kids
    const re = /([A-Za-z0-9_]+\s+)?[A-Za-z0-9_]+\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*;\s*/mg;
    const strip = code => code.replace(re, m => '');

    // Split into scopes by braces
    const blocks = code.split(/(?=[{}])/g);
    let level  = 0;
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      switch (b[0]) {
        case '{': level++; break;
        case '}': level--; break;
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
            hash[j] = [head, strip(rest)].join('\n');
          } else {
            // Process entire line
            hash[j] = strip(line);
          }
        }

        // Reassemble
        blocks[i] = hash.join('#');
      }
    }

    return code = blocks.join('');
  },

  // Remove duplicate uniforms / varyings / attributes
  dedupe(code) {
    const map = {};
    const re  = /((attribute|uniform|varying)\s+)[A-Za-z0-9_]+\s+([A-Za-z0-9_]+)\s*(\[[^\]]*\]\s*)?;\s*/mg;
    return code.replace(re, function(m, qual, type, name, struct) {
      if (map[name]) { return ''; }
      map[name] = true;
      return m;
    });
  },

  // Move definitions to top so they compile properly
  hoist(code) {

    const filter = function(lines, re) {
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
});

},{"../graph":25,"./constants":19}],22:[function(require,module,exports){
exports.compile  = require('./compile');
exports.parse    = require('./parse');
exports.generate = require('./generate');

const iterable = require('./constants');
for (let v = 0; v < iterable.length; v++) { const k = iterable[v]; exports[k] = v; }

},{"./compile":18,"./constants":19,"./generate":21,"./parse":23}],23:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const tokenizer = require('../../vendor/glsl-tokenizer');
const parser    = require('../../vendor/glsl-parser');
const decl      = require('./decl');
const $         = require('./constants');

let debug = false;

/*
parse GLSL into AST
extract all global symbols and make type signatures
*/
// Parse a GLSL snippet
const parse = function(name, code) {
  let program;
  const ast        = parseGLSL(name, code);
  return program    = processAST(ast, code);
};

// Parse GLSL language into AST
var parseGLSL = function(name, code) {

  let ast, errors, tock;
  if (debug) { tock = tick(); }

  // Sync stream hack (see /vendor/through)
  try {
    let array;
    array = tokenizer().process(parser(), code), [ast] = Array.from(array[0]), errors = array[1];
  } catch (e) {
    errors = [{message:e}];
  }

  if (debug) { tock('GLSL Tokenize & Parse'); }

  const fmt = function(code) {
    code = code.split("\n");
    const max  = ("" + code.length).length;
    const pad  = function(v) { if ((v = "" + v).length < max) { return ("       " + v).slice(-max); } else { return v; } };
    return code.map((line, i) => `${pad(i + 1)}: ${line}`).join("\n");
  };

  if (!ast || errors.length) {
    if (!name) { name = '(inline code)'; }
    console.warn(fmt(code));
    for (let error of Array.from(errors)) { console.error(`${name} -`, error.message); }
    throw new Error("GLSL parse error");
  }

  return ast;
};

// Process AST for compilation
var processAST = function(ast, code) {
  let tock;
  if (debug) { tock = tick(); }

  // Walk AST tree and collect global declarations
  const symbols = [];
  walk(mapSymbols, collect(symbols), ast, '');

  // Sort symbols into bins
  const [main, internals, externals] = Array.from(sortSymbols(symbols));

  // Extract storage/type signatures of symbols
  const signatures = extractSignatures(main, internals, externals);

  if (debug) { tock('GLSL AST'); }

  return {ast, code, signatures};
};

// Extract functions and external symbols from AST
var mapSymbols = function(node, collect) {
  switch (node.type) {
    case 'decl':
      collect(decl.node(node));
      return false;
      break;
  }
  return true;
};

var collect = out => (function(value) { if (value != null) { return Array.from(value).map((obj) => out.push(obj)); } });

// Identify internals, externals and main function
var sortSymbols = function(symbols) {
  let main = null;
  const internals = [];
  let externals = [];
  const maybe = {};
  let found = false;

  for (var s of Array.from(symbols)) {
    if (!s.body) {
      // Unmarked globals are definitely internal
      if (s.storage === 'global') {
        internals.push(s);

      // Possible external
      } else {
        externals.push(s);
        maybe[s.ident] = true;
      }
    } else {
      // Remove earlier forward declaration
      if (maybe[s.ident]) {
        externals = (Array.from(externals).filter((e) => e.ident !== s.ident));
        delete maybe[s.ident];
      }

      // Internal function
      internals.push(s);

      // Last function is main
      // unless there is a function called 'main'
      if (s.ident === 'main') {
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
var extractSignatures = function(main, internals, externals) {
  let symbol;
  const sigs = {
    uniform:   [],
    attribute: [],
    varying:   [],
    external:  [],
    internal:  [],
    global:    [],
    main:      null
  };

  const defn = symbol => decl.type(symbol.ident, symbol.type, symbol.quant, symbol.count, symbol.inout, symbol.storage);

  const func = function(symbol, inout) {
    let def;
    let d;
    const signature = (Array.from(symbol.args).map((arg) => defn(arg)));

    // Split inouts into in and out
    for (d of Array.from(signature)) {
      if (d.inout === decl.inout) {
        const a = d;
        const b = d.copy();

        a.inout  = decl.in;
        b.inout  = decl.out;
        b.meta   = {shadow: a.name};
        b.name  += $.SHADOW_ARG;
        a.meta   = {shadowed: b.name};

        signature.push(b);
      }
    }

    // Add output for return type
    if (symbol.type !== 'void') {
      signature.unshift(decl.type($.RETURN_ARG, symbol.type, false, '', 'out'));
    }

    // Make type string
    const inTypes  = ((() => {
      const result = [];
      for (d of Array.from(signature)) {         if (d.inout === decl.in) {
          result.push(d.type);
        }
      } 
      return result;
    })()).join(',');
    const outTypes = ((() => {
      const result1 = [];
      for (d of Array.from(signature)) {         if (d.inout === decl.out) {
          result1.push(d.type);
        }
      }
      return result1;
    })()).join(',');
    const type     = `(${inTypes})(${outTypes})`;

    return def = {
      name: symbol.ident,
      type,
      signature,
      inout,
      spec: symbol.type
    };
  };

  // Main
  sigs.main = func(main, decl.out);

  // Internals (for name replacement only)
  for (symbol of Array.from(internals)) {
    sigs.internal.push({
      name: symbol.ident});
  }

  // Externals
  for (symbol of Array.from(externals)) {
    switch (symbol.decl) {

      // Uniforms/attributes/varyings
      case 'external':
        var def = defn(symbol);
        sigs[symbol.storage].push(def);
        break;

      // Callbacks
      case 'function':
        def = func(symbol, decl.in);
        sigs.external.push(def);
        break;
    }
  }

  return sigs;
};

// Walk AST, apply map and collect values
debug = false;

var walk = function(map, collect, node, indent) {
  debug && console.log(indent, node.type, node.token != null ? node.token.data : undefined, node.token != null ? node.token.type : undefined);

  const recurse = map(node, collect);

  if (recurse) {
    for (let i = 0; i < node.children.length; i++) { const child = node.children[i]; walk(map, collect, child, indent + '  ', debug); }
  }

  return null;
};

// #####

var tick = function() {
  const now = +new Date;
  return function(label) {
    const delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};


module.exports = walk;
module.exports = parse;


},{"../../vendor/glsl-parser":39,"../../vendor/glsl-tokenizer":43,"./constants":19,"./decl":20}],24:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],25:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"./graph":24,"./node":26,"./outlet":27,"dup":2}],26:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"./graph":24,"./outlet":27,"dup":3}],27:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"./graph":24,"dup":4}],28:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Block     = require('./block');
const Factory   = require('./factory');
const GLSL      = require('./glsl');
const Graph     = require('./graph');
const Linker    = require('./linker');
const Visualize = require('./visualize');

const {
  library
} = Factory;
const {
  cache
} = Factory;
const {
  visualize
} = Visualize;
const {
  inspect
} = Visualize;

const {
  Snippet
} = Linker;

const merge = function(a, b) {
  if (b == null) { b = {}; }
  const out = {};
  for (let key in a) { const value = a[key]; out[key] = b[key] != null ? b[key] : a[key]; }
  return out;
};

class ShaderGraph {
  static initClass() {
  
    // Expose class hierarchy
    this.Block =     Block;
    this.Factory =   Factory;
    this.GLSL =      GLSL;
    this.Graph =     Graph;
    this.Linker =    Linker;
    this.Visualize = Visualize;
  }
  constructor(snippets, config) {
    if (!(this instanceof ShaderGraph)) { return new ShaderGraph(snippets, config); }

    const defaults = {
      globalUniforms:   false,
      globalVaryings:   true,
      globalAttributes: true,
      globals:          [],
      autoInspect:      false
    };

    this.config = merge(defaults, config);
    this.fetch  = cache(library(GLSL, snippets, Snippet.load));
  }

  shader(config) {
    if (config == null) { config = {}; }
    const _config = merge(this.config, config);
    return new Factory.Factory(GLSL, this.fetch, _config);
  }

  material(config) {
    return new Factory.Material(this.shader(config), this.shader(config));
  }

  inspect(shader) { return ShaderGraph.inspect(shader); }
  visualize(shader) { return ShaderGraph.visualize(shader); }

  // Static visualization method
  static inspect(shader) { return inspect(shader); }
  static visualize(shader) { return visualize(shader); }
}
ShaderGraph.initClass();

module.exports = ShaderGraph;
if (typeof window !== 'undefined') { window.ShaderGraph = ShaderGraph; }

},{"./block":8,"./factory":14,"./glsl":22,"./graph":25,"./linker":30,"./visualize":36}],29:[function(require,module,exports){
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


},{"../graph":25,"./priority":33}],30:[function(require,module,exports){
exports.Snippet  = require('./snippet');
exports.Program  = require('./program');
exports.Layout   = require('./layout');
exports.assemble = require('./assemble');
exports.link     = require('./link');
exports.priority = require('./priority');

exports.load = exports.Snippet.load;

},{"./assemble":29,"./layout":31,"./link":32,"./priority":33,"./program":34,"./snippet":35}],31:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Snippet  = require('./snippet');
const link     = require('./link');

const debug = false;

/*
  Program linkage layout
  
  Entry points are added to its dependency graph
  Callbacks are linked either with a go-between function
  or a #define if the signatures are identical.
*/
class Layout {

  constructor(language, graph) {
    this.language = language;
    this.graph = graph;
    this.links    = [];
    this.includes = [];
    this.modules  = {};
    this.visits   = {};
  }

  // Link up a given named external to this module's entry point
  callback(node, module, priority, name, external) {
    return this.links.push({node, module, priority, name, external});
  }

  // Include this module of code
  include(node, module, priority) {
    let m;
    if ((m = this.modules[module.namespace]) != null) {
      return m.priority = Math.max(priority, m.priority);
    } else {
      this.modules[module.namespace] = true;
      return this.includes.push({node, module, priority});
    }
  }

  // Visit each namespace at most once to avoid infinite recursion
  visit(namespace) {
    debug && console.log('Visit', namespace, !this.visits[namespace]);
    if (this.visits[namespace]) { return false; }
    return this.visits[namespace] = true;
  }

  // Compile queued ops into result
  link(module) {
    const data          = link(this.language, this.links, this.includes, module);
    const snippet       = new Snippet;
    for (let key in data) { snippet[key]  = data[key]; }
    snippet.graph = this.graph;
    return snippet;
  }
}


module.exports = Layout;

},{"./link":32,"./snippet":35}],32:[function(require,module,exports){
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
 Callback linker
 
 Imports given modules and generates linkages for registered callbacks.

 Builds composite program with single module as exported entry point
*/

const link = function(language, links, modules, exported) {

  const {
    generate
  } = language;
  let includes   = [];

  const symbols    = [];
  const externals  = {};
  const uniforms   = {};
  const attributes = {};
  const varyings   = {};
  const library    = {};

  const process = function() {

    const exports = generate.links(links);

    const header = [];
    if (exports.defs != null) { header.push(exports.defs); }
    if (exports.bodies != null) { header.push(exports.bodies); }

    for (let m of Array.from(modules)) { include(m.node, m.module, m.priority); }
    const sorted   = ((() => {
      const result = [];
      for (let ns in library) {
        const lib = library[ns];
        result.push(lib);
      }
      return result;
    })()).sort((a, b) => Priority.compare(a.priority, b.priority));
    includes = sorted.map(x => x.code);

    let code =  generate.lines(includes);
    code =  generate.defuse(code);
    if (header.length) { code = [generate.lines(header), code].join("\n"); }
    code =  generate.hoist(code);
    code =  generate.dedupe(code);

    // Export module's externals
    const e = exported;
    return {
      namespace:   e.main.name,
      code,          // Complete snippet (tests/debug)
      main:        e.main,        // Function signature
      entry:       e.main.name,   // Entry point name
      externals,
      uniforms,
      attributes,
      varyings
    };
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

  // Include piece of code
  var include = function(node, module, priority) {
    let def, key;
    priority = Priority.make(priority);

    // Adopt snippet's libraries
    for (let ns in module.library) { const lib = module.library[ns]; adopt(ns, lib.code, Priority.nest(priority, lib.priority)); }

    // Adopt snippet body as library
    adopt(module.namespace, module.body, priority);

    // Adopt externals
    for (key in module.uniforms) { def = module.uniforms[key]; uniforms[key]   = def; }
    for (key in module.varyings) { def = module.varyings[key]; varyings[key]   = def; }
    for (key in module.attributes) { def = module.attributes[key]; attributes[key] = def; }

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
  var isDangling = function(node, name) {
    const outlet = node.get(name);

    if (!outlet) {
      const module = (node.owner.snippet != null ? node.owner.snippet._name : undefined) != null ? (node.owner.snippet != null ? node.owner.snippet._name : undefined) : node.owner.namespace;
      throw new Error(`Unable to link program. Unlinked callback \`${name}\` on \`${module}\``);
    }

    if (outlet.inout === Graph.IN) {
      return outlet.input === null;

    } else if (outlet.inout === Graph.OUT) {
      return outlet.output.length === 0;
    }
  };

  return process();
};


module.exports = link;
},{"../graph":25,"./priority":33}],33:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
exports.make = function(x) {
  if ((x == null)) { x = []; }
  if (!(x instanceof Array)) { x = [+x != null ? +x : 0]; }
  return x;
};

exports.nest = (a, b) => a.concat(b);

exports.compare = function(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0, end = n, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
    const p = a[i];
    const q = b[i];
    if (p > q) {
      return -1;
    }
    if (p < q) {
      return 1;
    }
  }
  a = a.length;
  b = b.length;
  if (a > b) { return -1; } else if (a < b) { return 1; } else { return 0; }
};

exports.max  = function(a, b) {
  if (exports.compare(a, b) > 0) { return b; } else { return a; }
};

},{}],34:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Snippet  = require('./snippet');
const assemble = require('./assemble');

/*
  Program assembly model
  
  Snippets are added to its queue, registering calls and code includes.
  Calls are de-duped and scheduled at the earliest point required for correct data flow.
  
  When assemble() is called, it builds a main() function to
  execute all calls in final order.
  
  The result is a new instance of Snippet that acts as if it
  was parsed from the combined source of the component
  nodes.
*/
class Program {
  static initClass() {
    this.index = 0;
  }
  static entry() { return `_pg_${++Program.index}_`; }

  // Program starts out empty, ready to compile starting from a particular block
  constructor(language, namespace, graph) {
    this.language = language;
    this.namespace = namespace;
    this.graph = graph;
    this.calls      = {};
    this.requires   = {};
  }

  // Call a given module at certain priority
  call(node, module, priority) {
    let exists;
    const ns = module.namespace;

    // Merge all calls down into one with the right priority
    if ((exists = this.calls[ns])) {
      exists.priority = Math.max(exists.priority, priority);
    } else {
      this.calls[ns] = {node, module, priority};
    }

    return this;
  }

  // Require a given (callback) module's externals
  require(node, module) {
    const ns = module.namespace;
    return this.requires[ns] = {node, module};
  }

  // Compile queued ops into result
  assemble() {
    const data          = assemble(this.language, this.namespace != null ? this.namespace : Program.entry, this.calls, this.requires);
    const snippet       = new Snippet;
    for (let key in data) { snippet[key]  = data[key]; }
    snippet.graph = this.graph;
    return snippet;
  }
}
Program.initClass();

module.exports = Program;



},{"./assemble":29,"./snippet":35}],35:[function(require,module,exports){
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
class Snippet {
  static initClass() {
    this.index = 0;
  }
  static namespace() { return `_sn_${++Snippet.index}_`; }

  static load(language, name, code) {
    const program          = language.parse(name, code);
    const [sigs, compiler] = Array.from(language.compile(program));
    return new Snippet(language, sigs, compiler, name, code);
  }

  constructor(language, _signatures, _compiler, _name, _original) {
    this.language = language;
    this._signatures = _signatures;
    this._compiler = _compiler;
    this._name = _name;
    this._original = _original;
    this.namespace  = null;
    this.code       = null;

    this.main       = null;
    this.entry      = null;

    this.uniforms   = null;
    this.externals  = null;
    this.symbols    = null;
    this.attributes = null;
    this.varyings   = null;

    // Tidy up object for export
    if (!this.language) { delete this.language; }
    if (!this._signatures) { delete this._signatures; }
    if (!this._compiler) { delete this._compiler; }
    if (!this._original) { delete this._original; }

    // Insert snippet name if not provided
    if (!this._name) { this._name = this._signatures != null ? this._signatures.main.name : undefined; }
  }

  clone() {
    return new Snippet(this.language, this._signatures, this._compiler, this._name, this._original);
  }

  bind(config, uniforms, namespace, defines) {

    // Alt syntax (namespace, uniforms, defines)
    let def, left;
    let v;
    if (uniforms === ('' + uniforms)) {
      [namespace, uniforms, defines] = Array.from([uniforms, namespace != null ? namespace : {}, defines != null ? defines : {}]);
    // Alt syntax (uniforms, defines)
    } else if (namespace !== ('' + namespace)) {
      [defines, namespace] = Array.from([namespace != null ? namespace : {}, undefined]);
    }

    // Prepare data structure
    this.main       = this._signatures.main;
    this.namespace  = (left = namespace != null ? namespace : this.namespace) != null ? left : Snippet.namespace();
    this.entry      = this.namespace + this.main.name;

    this.uniforms   = {};
    this.varyings   = {};
    this.attributes = {};
    this.externals  = {};
    this.symbols    = [];
    const exist       = {};
    const exceptions  = {};

    // Handle globals and locals for prefixing
    const global = function(name) {
      exceptions[name] = true;
      return name;
    };
    const local  = name => {
      return this.namespace + name;
    };

    // Apply config
    if (config.globals) { for (let key of Array.from(config.globals)) { global(key); } }
    const _u = config.globalUniforms   ? global : local;
    const _v = config.globalVaryings   ? global : local;
    const _a = config.globalAttributes ? global : local;
    const _e = local;

    // Build finalized properties
    const x = def       => {       return exist[def.name]           = true; };
    const u = (def, name) => {   return this.uniforms[_u(name != null ? name : def.name)] = def; };
    v = def       => {   return this.varyings[_v(def.name)]        = def; };
    const a = def       => { return this.attributes[_a(def.name)]        = def; };
    const e = def       => {
                        const name = _e(def.name);
                        this.externals[name]               = def;
                        return this.symbols.push(name);
                      };

    const redef = def => ({
      type: def.type,
      name: def.name,
      value: def.value
    });

    for (def of Array.from(this._signatures.uniform)) { x(def); }
    for (def of Array.from(this._signatures.uniform)) { u(redef(def)); }
    for (def of Array.from(this._signatures.varying)) { v(redef(def)); }
    for (def of Array.from(this._signatures.external)) { e(def); }
    for (def of Array.from(this._signatures.attribute)) { a(redef(def)); }
    for (let name in uniforms) { def = uniforms[name]; if (exist[name]) { u(def, name); } }

    this.body = (this.code = this._compiler(this.namespace, exceptions, defines));

    // Adds defs to original snippet for inspection
    if (defines) {
      const defs = ((() => {
        const result = [];
        for (let k in defines) {
          v = defines[k];
          result.push(`#define ${k} ${v}`);
        }
        return result;
      })()).join('\n');
      if (defs.length) { this._original = [defs, "//----------------------------------------", this._original].join("\n"); }
    }

    return null;
  }
}
Snippet.initClass();

module.exports = Snippet;
},{}],36:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let markup, serialize;
const {
  Graph
} = require('../Graph');

exports.serialize = (serialize = require('./serialize'));
exports.markup    = (markup    = require('./markup'));

const visualize = function(graph) {
  if (!graph) { return; }
  if (!graph.nodes) { return graph; }

  const data   = serialize(graph);
  return markup.process(data);
};

var resolve = function(arg) {
  if ((arg == null)) { return arg; }
  if (arg instanceof Array) { return arg.map(resolve); }
  if ((arg.vertex != null) && (arg.fragment != null)) { return [resolve(arg.vertex, resolve(arg.fragment))]; }
  if (arg._graph != null) { return arg._graph; }
  if (arg.graph != null) { return arg.graph; }
  return arg;
};

var merge = function(args) {
  let out = [];
  for (let arg of Array.from(args)) {
    if (arg instanceof Array) {
      out = out.concat(merge(arg));
    } else if (arg != null) {
      out.push(arg);
    }
  }
  return out;
};

exports.visualize = function() {
  const list = merge(resolve([].slice.call(arguments)));
  return markup.merge((Array.from(list).filter((graph) => graph).map((graph) => visualize(graph))));
};

exports.inspect = function() {
  const contents = exports.visualize.apply(null, arguments);
  const element  = markup.overlay(contents);

  for (let el of Array.from(document.querySelectorAll('.shadergraph-overlay'))) { el.remove(); }
  document.body.appendChild(element);
  contents.update();

  return element;
};

},{"../Graph":2,"./markup":37,"./serialize":38}],37:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const hash = require('../factory/hash');

const trim = string => ("" + string).replace(/^\s+|\s+$/g, '');

const cssColor = (r, g, b, alpha) => 'rgba(' + [r, g, b, alpha].join(', ') + ')';

const hashColor = function(string, alpha) {
  if (alpha == null) { alpha = 1; }
  const color = hash(string) ^ 0x123456;

  let r =  color & 0xFF;
  let g = (color >>> 8) & 0xFF;
  let b = (color >>> 16) & 0xFF;

  const max  = Math.max(r, g, b);
  const norm = 140 / max;
  const min  = Math.round(max / 3);

  r = Math.min(255, Math.round(norm * Math.max(r, min)));
  g = Math.min(255, Math.round(norm * Math.max(g, min)));
  b = Math.min(255, Math.round(norm * Math.max(b, min)));

  return cssColor(r, g, b, alpha);
};

const escapeText = function(string) {
  string = string != null ? string : "";
  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;');
};

const process = function(data) {
  const links = [];
  const el = _markup(data, links);
  el.update = () => connect(el, links);
  _activate(el);
  return el;
};

var _activate = function(el) {
  const codes = el.querySelectorAll('.shadergraph-code');
  return Array.from(codes).map((code) =>
    (function() {
      const popup = code;
      popup.parentNode.classList.add('shadergraph-has-code');
      return popup.parentNode.addEventListener('click', event => popup.style.display = {
        block: 'none',
        none:  'block'
      }[popup.style.display || 'none']);
    })());
};

const _order = function(data) {
  let link, node;
  const nodeMap = {};
  const linkMap = {};
  for (node of Array.from(data.nodes)) {
    nodeMap[node.id] = node;
  }

  for (link of Array.from(data.links)) {
    if (linkMap[link.from] == null) { linkMap[link.from] = []; }
    linkMap[link.from].push(link);
  }

  var recurse = function(node, depth) {
    let next;
    if (depth == null) { depth = 0; }
    node.depth = Math.max(node.depth != null ? node.depth : 0, depth);
    if (next = linkMap[node.id]) {
      for (link of Array.from(next)) { recurse(nodeMap[link.to], depth + 1); }
    }
    return null;
  };

  for (node of Array.from(data.nodes)) {
    if ((node.depth == null)) { recurse(node); }
  }

  return null;
};

var _markup = function(data, links) {
  let column;
  _order(data);

  const wrapper = document.createElement('div');
  wrapper.classList.add('shadergraph-graph');

  const columns = [];
  const outlets = {};

  for (let node of Array.from(data.nodes)) {
    var outlet;
    var block = document.createElement('div');
    block.classList.add("shadergraph-node");
    block.classList.add(`shadergraph-node-${node.type}`);

    block.innerHTML = `\
<div class="shadergraph-header">${escapeText(node.name)}</div>\
`;

    const addOutlet = function(outlet, inout) {
      const color = hashColor(outlet.type);

      const div = document.createElement('div');
      div.classList.add('shadergraph-outlet');
      div.classList.add(`shadergraph-outlet-${inout}`);
      div.innerHTML = `\
<div class="shadergraph-point" style="background: ${color}"></div>
<div class="shadergraph-type" style="color: ${color}">${escapeText(outlet.type)}</div>
<div class="shadergraph-name">${escapeText(outlet.name)}</div>\
`;
      block.appendChild(div);

      return outlets[outlet.id] = div.querySelector('.shadergraph-point');
    };

    for (outlet of Array.from(node.inputs)) { addOutlet(outlet, 'in'); }
    for (outlet of Array.from(node.outputs)) { addOutlet(outlet, 'out'); }

    if (node.graph != null) {
      block.appendChild(_markup(node.graph, links));
    } else {
      const clear = document.createElement('div');
      clear.classList.add('shadergraph-clear');
      block.appendChild(clear);
    }

    if (node.code != null) {
      const div = document.createElement('div');
      div.classList.add('shadergraph-code');
      div.innerHTML = escapeText(trim(node.code));
      block.appendChild(div);
    }

    column = columns[node.depth];
    if ((column == null)) {
      column = document.createElement('div');
      column.classList.add('shadergraph-column');
      columns[node.depth] = column;
    }
    column.appendChild(block);
  }

  for (column of Array.from(columns)) { if (column != null) { wrapper.appendChild(column); } }

  for (let link of Array.from(data.links)) {
    const color = hashColor(link.type);

    links.push({
      color,
      out: outlets[link.out],
      in:  outlets[link.in]});
  }

  return wrapper;
};

const sqr    = x => x * x;

const path   = function(x1, y1, x2, y2) {
  let h;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(sqr(dx) + sqr(dy));

  const vert = Math.abs(dy) > Math.abs(dx);
  if (vert) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    const f = dy > 0 ? .3 : -.3;
    h = Math.min(Math.abs(dx) / 2, 20 + (d / 8));

    return [
      'M', x1, y1,
      'C', x1 + h, y1 + ',',
           mx, my - (d * f),
           mx, my,
      'C', mx, my + (d * f),
           x2 - h, y2 + ',',
           x2, y2,
    ].join(' ');
  } else {
    h = Math.min(Math.abs(dx) / 2.5, 20 + (d / 4));

    return [
      'M', x1, y1,
      'C', x1 + h, y1 + ',',
           x2 - h, y2 + ',',
           x2, y2,
    ].join(' ');
  }
};

const makeSVG = function(tag) {
  if (tag == null) { tag = 'svg'; }
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
};

var connect = function(element, links) {
  let link;
  if (element.parentNode == null) { return; }

  const ref = element.getBoundingClientRect();

  for (link of Array.from(links)) {
    const a = link.out.getBoundingClientRect();
    const b = link.in .getBoundingClientRect();

    link.coords = {
      x1: ((a.left + a.right)  / 2) - ref.left,
      y1: ((a.top  + a.bottom) / 2) - ref.top,
      x2: ((b.left + b.right)  / 2) - ref.left,
      y2: ((b.top  + b.bottom) / 2) - ref.top
    };
  }

  let svg = element.querySelector('svg');
  if (svg != null) { element.removeChild(svg); }

  let box = element;
  while (box.parentNode && (box.offsetHeight === 0)) { box = box.parentNode; }

  svg = makeSVG();
  svg.setAttribute('width',  box.offsetWidth);
  svg.setAttribute('height', box.offsetHeight);

  for (link of Array.from(links)) {
    const c = link.coords;

    const line = makeSVG('path');
    line.setAttribute('d', path(c.x1, c.y1, c.x2, c.y2));
    line.setAttribute('stroke',       link.color);
    line.setAttribute('stroke-width', 3);
    line.setAttribute('fill',         'transparent');
    svg.appendChild(line);
  }

  return element.appendChild(svg);
};

const overlay = function(contents) {
  const div = document.createElement('div');
  div.setAttribute('class', 'shadergraph-overlay');

  const close = document.createElement('div');
  close.setAttribute('class', 'shadergraph-close');
  close.innerHTML = '&times;';

  const view = document.createElement('div');
  view.setAttribute('class', 'shadergraph-view');

  const inside = document.createElement('div');
  inside.setAttribute('class', 'shadergraph-inside');

  inside.appendChild(contents);
  view.appendChild(inside);
  div.appendChild(view);
  div.appendChild(close);

  close.addEventListener('click', () => div.parentNode.removeChild(div));

  return div;
};

const wrap = function(markup) {
  if (markup instanceof Node) { return markup; }
  const p = document.createElement('span');
  p.innerText = markup != null ? markup : '';
  return p;
};

const merge = function(markup) {
  if (markup.length !== 1) {
    let el;
    const div = document.createElement('div');
    for (el of Array.from(markup)) { div.appendChild(wrap(el)); }
    div.update = () => (() => {
      const result = [];
      for (el of Array.from(markup)) {         result.push((typeof el.update === 'function' ? el.update() : undefined));
      }
      return result;
    })();
    return div;
  } else {
    return wrap(markup[0]);
  }
};

module.exports = {process, merge, overlay};


},{"../factory/hash":13}],38:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Dump graph for debug/visualization purposes
const Block = require('../block');

const isCallback = outlet => outlet.type[0] === '(';

var serialize = function(graph) {

  const nodes = [];
  const links = [];

  for (let node of Array.from(graph.nodes)) {
    var outlet;
    const record = {
      // Data
      id:    node.id,
      name:  null,
      type:  null,
      depth: null,
      graph: null,
      inputs:  [],
      outputs: []
    };

    nodes.push(record);

    const {
      inputs
    } = record;
    const {
      outputs
    } = record;

    const block = node.owner;

    if      (block instanceof Block.Call) {
      record.name  = block.snippet._name;
      record.type  = 'call';
      record.code  = block.snippet._original;

    } else if (block instanceof Block.Callback) {
      record.name  = "Callback";
      record.type  = 'callback';
      record.graph = serialize(block.graph);

    } else if (block instanceof Block.Isolate) {
      record.name  = 'Isolate';
      record.type  = 'isolate';
      record.graph = serialize(block.graph);

    } else if (block instanceof Block.Join) {
      record.name  = 'Join';
      record.type  = 'join';

    } else if (block != null) {
      if (record.name == null) { record.name = block.name != null ? block.name : block.type; }
      if (record.type == null) { record.type = block.type; }
      if (record.code == null) { record.code = block.code; }
      if (block.graph != null) { record.graph = serialize(block.graph); }
    }

    const format = function(type) {
      type = type.replace(")(", ")→(");
      return type = type.replace("()", "");
    };

    for (outlet of Array.from(node.inputs)) {
      inputs.push({
        id:   outlet.id,
        name: outlet.name,
        type: format(outlet.type),
        open: (outlet.input == null)
      });
    }

    for (outlet of Array.from(node.outputs)) {
      outputs.push({
        id:   outlet.id,
        name: outlet.name,
        type: format(outlet.type),
        open: !outlet.output.length
      });

      for (let other of Array.from(outlet.output)) {
        links.push({
          from: node.id,
          out:  outlet.id,
          to:   other.node.id,
          in:   other.id,
          type: format(outlet.type)
        });
      }
    }
  }

  return {nodes, links};
};

module.exports = serialize;
},{"../block":8}],39:[function(require,module,exports){
module.exports = require('./lib/index')

},{"./lib/index":41}],40:[function(require,module,exports){
var state
  , token
  , tokens
  , idx

var original_symbol = {
    nud: function() { return this.children && this.children.length ? this : fail('unexpected')() }
  , led: fail('missing operator')
}

var symbol_table = {}

function itself() {
  return this
}

symbol('(ident)').nud = itself
symbol('(keyword)').nud = itself
symbol('(builtin)').nud = itself
symbol('(literal)').nud = itself
symbol('(end)')

symbol(':')
symbol(';')
symbol(',')
symbol(')')
symbol(']')
symbol('}')

infixr('&&', 30)
infixr('||', 30)
infix('|', 43)
infix('^', 44)
infix('&', 45)
infix('==', 46)
infix('!=', 46)
infix('<', 47)
infix('<=', 47)
infix('>', 47)
infix('>=', 47)
infix('>>', 48)
infix('<<', 48)
infix('+', 50)
infix('-', 50)
infix('*', 60)
infix('/', 60)
infix('%', 60)
infix('?', 20, function(left) {
  this.children = [left, expression(0), (advance(':'), expression(0))]
  this.type = 'ternary'
  return this
})
infix('.', 80, function(left) {
  token.type = 'literal'
  state.fake(token)
  this.children = [left, token]
  advance()
  return this
})
infix('[', 80, function(left) {
  this.children = [left, expression(0)]
  this.type = 'binary'
  advance(']')
  return this
})
infix('(', 80, function(left) {
  this.children = [left]
  this.type = 'call'

  if(token.data !== ')') while(1) {
    this.children.push(expression(0))
    if(token.data !== ',') break
    advance(',')
  }
  advance(')')
  return this
})

prefix('-')
prefix('+')
prefix('!')
prefix('~')
prefix('defined')
prefix('(', function() {
  this.type = 'group'
  this.children = [expression(0)]
  advance(')')
  return this 
})
prefix('++')
prefix('--')
suffix('++')
suffix('--')

assignment('=')
assignment('+=')
assignment('-=')
assignment('*=')
assignment('/=')
assignment('%=')
assignment('&=')
assignment('|=')
assignment('^=')
assignment('>>=')
assignment('<<=')

module.exports = function(incoming_state, incoming_tokens) {
  state = incoming_state
  tokens = incoming_tokens
  idx = 0
  var result

  if(!tokens.length) return

  advance()
  result = expression(0)
  result.parent = state[0]
  emit(result)

  if(idx < tokens.length) {
    throw new Error('did not use all tokens')
  }

  result.parent.children = [result]

  function emit(node) {
    state.unshift(node, false)
    for(var i = 0, len = node.children.length; i < len; ++i) {
      emit(node.children[i])
    }
    state.shift()
  }

}

function symbol(id, binding_power) {
  var sym = symbol_table[id]
  binding_power = binding_power || 0
  if(sym) {
    if(binding_power > sym.lbp) {
      sym.lbp = binding_power
    }
  } else {
    sym = Object.create(original_symbol)
    sym.id = id 
    sym.lbp = binding_power
    symbol_table[id] = sym
  }
  return sym
}

function expression(rbp) {
  var left, t = token
  advance()

  left = t.nud()
  while(rbp < token.lbp) {
    t = token
    advance()
    left = t.led(left)
  }
  return left
}

function infix(id, bp, led) {
  var sym = symbol(id, bp)
  sym.led = led || function(left) {
    this.children = [left, expression(bp)]
    this.type = 'binary'
    return this
  }
}

function infixr(id, bp, led) {
  var sym = symbol(id, bp)
  sym.led = led || function(left) {
    this.children = [left, expression(bp - 1)]
    this.type = 'binary'
    return this
  }
  return sym
}

function prefix(id, nud) {
  var sym = symbol(id)
  sym.nud = nud || function() {
    this.children = [expression(70)]
    this.type = 'unary'
    return this
  }
  return sym
}

function suffix(id) {
  var sym = symbol(id, 150)
  sym.led = function(left) {
    this.children = [left]
    this.type = 'suffix'
    return this
  }
}

function assignment(id) {
  return infixr(id, 10, function(left) {
    this.children = [left, expression(9)]
    this.assignment = true
    this.type = 'assign'
    return this
  })
}

function advance(id) {
  var next
    , value
    , type
    , output

  if(id && token.data !== id) {
    return state.unexpected('expected `'+ id + '`, got `'+token.data+'`')
  }

  if(idx >= tokens.length) {
    token = symbol_table['(end)']
    return
  }

  next = tokens[idx++]
  value = next.data
  type = next.type

  if(type === 'ident') {
    output = state.scope.find(value) || state.create_node()
    type = output.type
  } else if(type === 'builtin') {
    output = symbol_table['(builtin)']
  } else if(type === 'keyword') {
    output = symbol_table['(keyword)']
  } else if(type === 'operator') {
    output = symbol_table[value]
    if(!output) {
      return state.unexpected('unknown operator `'+value+'`')
    }
  } else if(type === 'float' || type === 'integer') {
    type = 'literal'
    output = symbol_table['(literal)']
  } else {
    return state.unexpected('unexpected token.')
  }

  if(output) {
    if(!output.nud) { output.nud = itself }
    if(!output.children) { output.children = [] }
  }

  output = Object.create(output)
  output.token = next
  output.type = type
  if(!output.data) output.data = value

  return token = output
}

function fail(message) {
  return function() { return state.unexpected(message) }
}

},{}],41:[function(require,module,exports){
module.exports = parser

var through = require('../../through')
  , full_parse_expr = require('./expr')
  , Scope = require('./scope')

// singleton!
var Advance = new Object

var DEBUG = false

var _ = 0
  , IDENT = _++
  , STMT = _++
  , STMTLIST = _++
  , STRUCT = _++
  , FUNCTION = _++
  , FUNCTIONARGS = _++
  , DECL = _++
  , DECLLIST = _++
  , FORLOOP = _++
  , WHILELOOP = _++
  , IF = _++
  , EXPR = _++
  , PRECISION = _++
  , COMMENT = _++
  , PREPROCESSOR = _++
  , KEYWORD = _++
  , KEYWORD_OR_IDENT = _++
  , RETURN = _++
  , BREAK = _++
  , CONTINUE = _++
  , DISCARD = _++
  , DOWHILELOOP = _++
  , PLACEHOLDER = _++
  , QUANTIFIER = _++

var DECL_ALLOW_ASSIGN = 0x1
  , DECL_ALLOW_COMMA = 0x2
  , DECL_REQUIRE_NAME = 0x4
  , DECL_ALLOW_INVARIANT = 0x8
  , DECL_ALLOW_STORAGE = 0x10
  , DECL_NO_INOUT = 0x20
  , DECL_ALLOW_STRUCT = 0x40
  , DECL_STATEMENT = 0xFF
  , DECL_FUNCTION = DECL_STATEMENT & ~(DECL_ALLOW_ASSIGN | DECL_ALLOW_COMMA | DECL_NO_INOUT | DECL_ALLOW_INVARIANT | DECL_REQUIRE_NAME)
  , DECL_STRUCT = DECL_STATEMENT & ~(DECL_ALLOW_ASSIGN | DECL_ALLOW_INVARIANT | DECL_ALLOW_STORAGE | DECL_ALLOW_STRUCT)

var QUALIFIERS = ['const', 'attribute', 'uniform', 'varying']

var NO_ASSIGN_ALLOWED = false
  , NO_COMMA_ALLOWED = false

// map of tokens to stmt types
var token_map = {
    'block-comment': COMMENT
  , 'line-comment': COMMENT
  , 'preprocessor': PREPROCESSOR
}

// map of stmt types to human
var stmt_type = _ = [ 
    'ident'
  , 'stmt'
  , 'stmtlist'
  , 'struct'
  , 'function'
  , 'functionargs'
  , 'decl'
  , 'decllist'
  , 'forloop'
  , 'whileloop'
  , 'i'+'f'
  , 'expr'
  , 'precision'
  , 'comment'
  , 'preprocessor'
  , 'keyword'
  , 'keyword_or_ident'
  , 'return'
  , 'break'
  , 'continue'
  , 'discard'
  , 'do-while'
  , 'placeholder'
  , 'quantifier'
]

function parser() {
  var stmtlist = n(STMTLIST)
    , stmt = n(STMT)
    , decllist = n(DECLLIST)
    , precision = n(PRECISION)
    , ident = n(IDENT)
    , keyword_or_ident = n(KEYWORD_OR_IDENT)
    , fn = n(FUNCTION)
    , fnargs = n(FUNCTIONARGS)
    , forstmt = n(FORLOOP)
    , ifstmt = n(IF)
    , whilestmt = n(WHILELOOP)
    , returnstmt = n(RETURN)
    , dowhilestmt = n(DOWHILELOOP)
    , quantifier = n(QUANTIFIER)

  var parse_struct
    , parse_precision
    , parse_quantifier
    , parse_forloop
    , parse_if
    , parse_return
    , parse_whileloop
    , parse_dowhileloop
    , parse_function
    , parse_function_args

  var stream = through(write, end)
    , check = arguments.length ? [].slice.call(arguments) : []
    , depth = 0
    , state = []
    , tokens = []
    , whitespace = []
    , errored = false
    , program
    , token
    , node

  // setup state
  state.shift = special_shift
  state.unshift = special_unshift
  state.fake = special_fake
  state.unexpected = unexpected
  state.scope = new Scope(state)
  state.create_node = function() {
    var n = mknode(IDENT, token)
    n.parent = stream.program
    return n
  }

  setup_stative_parsers()

  // setup root node
  node = stmtlist()
  node.expecting = '(eof)'
  node.mode = STMTLIST
  node.token = {type: '(program)', data: '(program)'}
  program = node

  stream.program = program
  stream.scope = function(scope) {
    if(arguments.length === 1) {
      state.scope = scope
    }
    return state.scope
  }

  state.unshift(node)
  return stream

  // stream functions ---------------------------------------------

  function write(input) {
    if(input.type === 'whitespace' || input.type === 'line-comment' || input.type === 'block-comment') {

      whitespace.push(input)
      return
    }
    tokens.push(input)
    token = token || tokens[0]

    if(token && whitespace.length) {
      token.preceding = token.preceding || []
      token.preceding = token.preceding.concat(whitespace)
      whitespace = []
    }

    while(take()) switch(state[0].mode) {
      case STMT: parse_stmt(); break
      case STMTLIST: parse_stmtlist(); break
      case DECL: parse_decl(); break
      case DECLLIST: parse_decllist(); break
      case EXPR: parse_expr(); break
      case STRUCT: parse_struct(true, true); break
      case PRECISION: parse_precision(); break
      case IDENT: parse_ident(); break
      case KEYWORD: parse_keyword(); break
      case KEYWORD_OR_IDENT: parse_keyword_or_ident(); break
      case FUNCTION: parse_function(); break
      case FUNCTIONARGS: parse_function_args(); break
      case FORLOOP: parse_forloop(); break
      case WHILELOOP: parse_whileloop(); break
      case DOWHILELOOP: parse_dowhileloop(); break
      case RETURN: parse_return(); break
      case IF: parse_if(); break
      case QUANTIFIER: parse_quantifier(); break
    }
  }
  
  function end(tokens) {
    if(arguments.length) {
      write(tokens)
    }

    if(state.length > 1) {
      unexpected('unexpected EOF')
      return
    }

    stream.emit('end')
  }

  function take() {
    if(errored || !state.length)
      return false

    return (token = tokens[0]) && !stream.paused
  }

  // ----- state manipulation --------

  function special_fake(x) {
    state.unshift(x)
    state.shift()
  }

  function special_unshift(_node, add_child) {
    _node.parent = state[0]

    var ret = [].unshift.call(this, _node)

    add_child = add_child === undefined ? true : add_child

    if(DEBUG) {
      var pad = ''
      for(var i = 0, len = this.length - 1; i < len; ++i) {
        pad += ' |'
      }
      console.log(pad, '\\'+_node.type, _node.token.data)
    }

    if(add_child && node !== _node) node.children.push(_node)
    node = _node

    return ret
  }

  function special_shift() {
    var _node = [].shift.call(this)
      , okay = check[this.length]
      , emit = false

    if(DEBUG) {
      var pad = ''
      for(var i = 0, len = this.length; i < len; ++i) {
        pad += ' |'
      }
      console.log(pad, '/'+_node.type)
    }

    if(check.length) { 
      if(typeof check[0] === 'function') {
        emit = check[0](_node)
      } else if(okay !== undefined) {
        emit = okay.test ? okay.test(_node.type) : okay === _node.type
      }
    } else {
      emit = true
    }

    if(emit) stream.emit('data', _node) 
  
    node = _node.parent
    return _node
  }

  // parse states ---------------

  function parse_stmtlist() {
    // determine the type of the statement
    // and then start parsing
    return stative(
      function() { state.scope.enter(); return Advance }
    , normal_mode
    )()

    function normal_mode() {
      if(token.data === state[0].expecting) {
        return state.scope.exit(), state.shift()
      }
      switch(token.type) {
        case 'preprocessor':
          state.fake(adhoc())
          tokens.shift()
        return
        default:
          state.unshift(stmt())
        return 
      }
    }
  }

  function parse_stmt() {
    if(state[0].brace) {
      if(token.data !== '}') {
        return unexpected('expected `}`, got '+token.data)
      }
      state[0].brace = false
      return tokens.shift(), state.shift()
    }
    switch(token.type) {
      case 'eof': return state.shift()
      case 'keyword': 
        switch(token.data) {
          case 'for': return state.unshift(forstmt());
          case 'if': return state.unshift(ifstmt());
          case 'while': return state.unshift(whilestmt());
          case 'do': return state.unshift(dowhilestmt());
          case 'break': return state.fake(mknode(BREAK, token)), tokens.shift()
          case 'continue': return state.fake(mknode(CONTINUE, token)), tokens.shift()
          case 'discard': return state.fake(mknode(DISCARD, token)), tokens.shift()
          case 'return': return state.unshift(returnstmt());
          case 'precision': return state.unshift(precision());
        }
        return state.unshift(decl(DECL_STATEMENT))
      case 'ident':
        var lookup
        if(lookup = state.scope.find(token.data)) {
          if(lookup.parent.type === 'struct') {
            // this is strictly untrue, you could have an
            // expr that starts with a struct constructor.
            //      ... sigh
            return state.unshift(decl(DECL_STATEMENT))
          }
          return state.unshift(expr(';'))
        }
      case 'operator':
        if(token.data === '{') {
          state[0].brace = true
          var n = stmtlist()
          n.expecting = '}'
          return tokens.shift(), state.unshift(n)
        }
        if(token.data === ';') {
          return tokens.shift(), state.shift()
        }
      default: return state.unshift(expr(';'))
    }
  }

  function parse_decl() {
    var stmt = state[0]

    return stative(
      invariant_or_not,
      storage_or_not,
      parameter_or_not,
      precision_or_not,
      struct_or_type,
      maybe_name,
      maybe_lparen,     // lparen means we're a function
      is_decllist,
      done
    )()

    function invariant_or_not() {
      if(token.data === 'invariant') {
        if(stmt.flags & DECL_ALLOW_INVARIANT) {
          state.unshift(keyword())
          return Advance
        } else {
          return unexpected('`invariant` is not allowed here') 
        }
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function storage_or_not() {
      if(is_storage(token)) {
        if(stmt.flags & DECL_ALLOW_STORAGE) {
          state.unshift(keyword()) 
          return Advance
        } else {
          return unexpected('storage is not allowed here') 
        }
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function parameter_or_not() {
      if(is_parameter(token)) {
        if(!(stmt.flags & DECL_NO_INOUT)) {
          state.unshift(keyword()) 
          return Advance
        } else {
          return unexpected('parameter is not allowed here') 
        }
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function precision_or_not() {
      if(is_precision(token)) {
        state.unshift(keyword())
        return Advance
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function struct_or_type() {
      if(token.data === 'struct') {
        if(!(stmt.flags & DECL_ALLOW_STRUCT)) {
          return unexpected('cannot nest structs')
        }
        state.unshift(struct())
        return Advance
      }

      if(token.type === 'keyword') {
        state.unshift(keyword())
        return Advance
      }

      var lookup = state.scope.find(token.data)

      if(lookup) {
        state.fake(Object.create(lookup))
        tokens.shift()
        return Advance  
      }
      return unexpected('expected user defined type, struct or keyword, got '+token.data)
    }

    function maybe_name() {
      if(token.data === ',' && !(stmt.flags & DECL_ALLOW_COMMA)) {
        return state.shift()
      }

      if(token.data === '[') {
        // oh lord.
        state.unshift(quantifier())
        return
      }

      if(token.data === ')') return state.shift()

      if(token.data === ';') {
        return stmt.stage + 3
      }

      if(token.type !== 'ident') {
        console.log(token);
        return unexpected('expected identifier, got '+token.data)
      }

      stmt.collected_name = tokens.shift()
      return Advance      
    }

    function maybe_lparen() {
      if(token.data === '(') {
        tokens.unshift(stmt.collected_name)
        delete stmt.collected_name
        state.unshift(fn())
        return stmt.stage + 2 
      }
      return Advance
    }

    function is_decllist() {
      tokens.unshift(stmt.collected_name)
      delete stmt.collected_name
      state.unshift(decllist())
      return Advance
    }

    function done() {
      return state.shift()
    }
  }
  
  function parse_decllist() {
    // grab ident

    if(token.type === 'ident') {
      var name = token.data
      state.unshift(ident())
      state.scope.define(name)
      return
    }

    if(token.type === 'operator') {

      if(token.data === ',') {
        // multi-decl!
        if(!(state[1].flags & DECL_ALLOW_COMMA)) {
          return state.shift()
        }

        return tokens.shift()
      } else if(token.data === '=') {
        if(!(state[1].flags & DECL_ALLOW_ASSIGN)) return unexpected('`=` is not allowed here.')

        tokens.shift()

        state.unshift(expr(',', ';'))
        return
      } else if(token.data === '[') {
        state.unshift(quantifier())
        return
      }
    }
    return state.shift()
  }

  function parse_keyword_or_ident() {
    if(token.type === 'keyword') {
      state[0].type = 'keyword'
      state[0].mode = KEYWORD
      return
    }

    if(token.type === 'ident') {
      state[0].type = 'ident'
      state[0].mode = IDENT
      return
    }

    return unexpected('expected keyword or user-defined name, got '+token.data)
  }

  function parse_keyword() {
    if(token.type !== 'keyword') {
      return unexpected('expected keyword, got '+token.data)
    }

    return state.shift(), tokens.shift()
  }

  function parse_ident() {
    if(token.type !== 'ident') {
      return unexpected('expected user-defined name, got '+token.data)
    }

    state[0].data = token.data
    return state.shift(), tokens.shift()
  }


  function parse_expr() {
    var expecting = state[0].expecting

    state[0].tokens = state[0].tokens || []

    if(state[0].parenlevel === undefined) {
      state[0].parenlevel = 0
      state[0].bracelevel = 0
    }
    if(state[0].parenlevel < 1 && expecting.indexOf(token.data) > -1) {
      return parseexpr(state[0].tokens)
    }
    if(token.data === '(') {
      ++state[0].parenlevel
    } else if(token.data === ')') {
      --state[0].parenlevel
    }

    switch(token.data) {
      case '{': ++state[0].bracelevel; break
      case '}': --state[0].bracelevel; break
      case '(': ++state[0].parenlevel; break
      case ')': --state[0].parenlevel; break
    }

    if(state[0].parenlevel < 0) return unexpected('unexpected `)`')
    if(state[0].bracelevel < 0) return unexpected('unexpected `}`')

    state[0].tokens.push(tokens.shift())
    return

    function parseexpr(tokens) {
      return full_parse_expr(state, tokens), state.shift()
    }
  }

  // node types ---------------

  function n(type) {
    // this is a function factory that suffices for most kinds of expressions and statements
    return function() {
      return mknode(type, token)
    }
  }

  function adhoc() {
    return mknode(token_map[token.type], token, node)
  }

  function decl(flags) {
    var _ = mknode(DECL, token, node)
    _.flags = flags

    return _
  }

  function struct(allow_assign, allow_comma) {
    var _ = mknode(STRUCT, token, node)
    _.allow_assign = allow_assign === undefined ? true : allow_assign
    _.allow_comma = allow_comma === undefined ? true : allow_comma
    return _
  }

  function expr() {
    var n = mknode(EXPR, token, node)

    n.expecting = [].slice.call(arguments)
    return n
  }
  
  function keyword(default_value) {
    var t = token
    if(default_value) {
      t = {'type': '(implied)', data: '(default)', position: t.position} 
    }
    return mknode(KEYWORD, t, node)
  }

  // utils ----------------------------

  function unexpected(str) {
    errored = true
    stream.emit('error', new Error(
      (str || 'unexpected '+state) +
      ' at line '+state[0].token.line
    ))
  }

  function assert(type, data) {
    return 1,
      assert_null_string_or_array(type, token.type) && 
      assert_null_string_or_array(data, token.data)
  }

  function assert_null_string_or_array(x, y) {
    switch(typeof x) {
      case 'string': if(y !== x) {
        unexpected('expected `'+x+'`, got '+y+'\n'+token.data);
      } return !errored

      case 'object': if(x && x.indexOf(y) === -1) {
        unexpected('expected one of `'+x.join('`, `')+'`, got '+y);
      } return !errored
    }
    return true
  }

  // stative ----------------------------

  function stative() {
    var steps = [].slice.call(arguments)
      , step
      , result

    return function() {
      var current = state[0]

      current.stage || (current.stage = 0)

      step = steps[current.stage]
      if(!step) return unexpected('parser in undefined state!')

      result = step()

      if(result === Advance) return ++current.stage
      if(result === undefined) return
      current.stage = result
    } 
  }

  function advance(op, t) {
    t = t || 'operator'
    return function() {
      if(!assert(t, op)) return

      var last = tokens.shift()
        , children = state[0].children
        , last_node = children[children.length - 1]

      if(last_node && last_node.token && last.preceding) {
        last_node.token.succeeding = last_node.token.succeeding || []
        last_node.token.succeeding = last_node.token.succeeding.concat(last.preceding)
      }
      return Advance
    }
  }

  function advance_expr(until) {
    return function() { return state.unshift(expr(until)), Advance }
  }

  function advance_ident(declare) {
    return declare ? function() {
      var name = token.data
      return assert('ident') && (state.unshift(ident()), state.scope.define(name), Advance)
    } :  function() {
      if(!assert('ident')) return

      var s = Object.create(state.scope.find(token.data))
      s.token = token

      return (tokens.shift(), Advance)
    }
  }

  function advance_stmtlist() {
    return function() {
      var n = stmtlist()
      n.expecting = '}'
      return state.unshift(n), Advance
    }
  }

  function maybe_stmtlist(skip) {
    return function() {
      var current = state[0].stage
      if(token.data !== '{') { return state.unshift(stmt()), current + skip }
      return tokens.shift(), Advance
    }
  }

  function popstmt() {
    return function() { return state.shift(), state.shift() }
  }


  function setup_stative_parsers() {

    // could also be
    // struct { } decllist
    parse_struct =
        stative(
          advance('struct', 'keyword')
        , function() {
            if(token.data === '{') {
              state.fake(mknode(IDENT, {data:'', position: token.position, type:'ident'}))
              return Advance
            }

            return advance_ident(true)()
          }
        , function() { state.scope.enter(); return Advance }
        , advance('{')
        , function() {
            if(token.data === '}') {
              state.scope.exit()
              tokens.shift()
              return state.shift()
            }
            if(token.data === ';') { tokens.shift(); return }
            state.unshift(decl(DECL_STRUCT))
          }
        )

    parse_precision =
        stative(
          function() { return tokens.shift(), Advance }
        , function() { 
            return assert(
            'keyword', ['lowp', 'mediump', 'highp']
            ) && (state.unshift(keyword()), Advance) 
          }
        , function() { return (state.unshift(keyword()), Advance) }
        , function() { return state.shift() } 
        )

    parse_quantifier =
        stative(
          advance('[')
        , advance_expr(']')
        , advance(']')
        , function() { return state.shift() }
        )

    parse_forloop = 
        stative(
          advance('for', 'keyword')
        , advance('(')
        , function() {
            var lookup
            if(token.type === 'ident') {
              if(!(lookup = state.scope.find(token.data))) {
                lookup = state.create_node()
              }
             
              if(lookup.parent.type === 'struct') {
                return state.unshift(decl(DECL_STATEMENT)), Advance
              }
            } else if(token.type === 'builtin' || token.type === 'keyword') {
              return state.unshift(decl(DECL_STATEMENT)), Advance
            }
            return advance_expr(';')()
          }
        , advance(';')
        , advance_expr(';')
        , advance(';')
        , advance_expr(')')
        , advance(')')
        , maybe_stmtlist(3)
        , advance_stmtlist()
        , advance('}')
        , popstmt()
        )

    parse_if = 
        stative(
          advance('if', 'keyword')
        , advance('(')
        , advance_expr(')')
        , advance(')')
        , maybe_stmtlist(3)
        , advance_stmtlist()
        , advance('}')
        , function() {
            if(token.data === 'else') {
              return tokens.shift(), state.unshift(stmt()), Advance
            }
            return popstmt()()
          }
        , popstmt()
        )

    parse_return =
        stative(
          advance('return', 'keyword')
        , function() {
            if(token.data === ';') return Advance
            return state.unshift(expr(';')), Advance
          }
        , function() { tokens.shift(), popstmt()() } 
        )

    parse_whileloop =
        stative(
          advance('while', 'keyword')
        , advance('(')
        , advance_expr(')')
        , advance(')')
        , maybe_stmtlist(3)
        , advance_stmtlist()
        , advance('}')
        , popstmt()
        )

    parse_dowhileloop = 
      stative(
        advance('do', 'keyword')
      , maybe_stmtlist(3)
      , advance_stmtlist()
      , advance('}')
      , advance('while', 'keyword')
      , advance('(')
      , advance_expr(')')
      , advance(')')
      , popstmt()
      )

    parse_function =
      stative(
        function() {
          for(var i = 1, len = state.length; i < len; ++i) if(state[i].mode === FUNCTION) {
            return unexpected('function definition is not allowed within another function')
          }

          return Advance
        }
      , function() {
          if(!assert("ident")) return

          var name = token.data
            , lookup = state.scope.find(name)

          state.unshift(ident())
          state.scope.define(name)

          state.scope.enter(lookup ? lookup.scope : null)
          return Advance
        }
      , advance('(')
      , function() { return state.unshift(fnargs()), Advance }
      , advance(')')
      , function() { 
          // forward decl
          if(token.data === ';') {
            return state.scope.exit(), state.shift(), state.shift()
          }
          return Advance
        }
      , advance('{')
      , advance_stmtlist()
      , advance('}')
      , function() { state.scope.exit(); return Advance } 
      , function() { return state.shift(), state.shift(), state.shift() }
      )

    parse_function_args =
      stative(
        function() {
          if(token.data === 'void') { state.fake(keyword()); tokens.shift(); return Advance }
          if(token.data === ')') { state.shift(); return }
          if(token.data === 'struct') {
            state.unshift(struct(NO_ASSIGN_ALLOWED, NO_COMMA_ALLOWED))
            return Advance
          }
          state.unshift(decl(DECL_FUNCTION))
          return Advance
        }
      , function() {
          if(token.data === ',') { tokens.shift(); return 0 }
          if(token.data === ')') { state.shift(); return }
          unexpected('expected one of `,` or `)`, got '+token.data)
        }
      )
  }
}

function mknode(mode, sourcetoken) {
  return {
      mode: mode
    , token: sourcetoken
    , children: []
    , type: stmt_type[mode]
//    , id: (Math.random() * 0xFFFFFFFF).toString(16)
  }
}

function is_storage(token) {
  return token.data === 'const' ||
         token.data === 'attribute' ||
         token.data === 'uniform' ||
         token.data === 'varying'
}

function is_parameter(token) {
  return token.data === 'in' ||
         token.data === 'inout' ||
         token.data === 'out'
}

function is_precision(token) {
  return token.data === 'highp' ||
         token.data === 'mediump' ||
         token.data === 'lowp'
}

},{"../../through":47,"./expr":40,"./scope":42}],42:[function(require,module,exports){
module.exports = scope

function scope(state) {
  if(this.constructor !== scope)
    return new scope(state)

  this.state = state
  this.scopes = []
  this.current = null
}

var cons = scope
  , proto = cons.prototype

proto.enter = function(s) {
  this.scopes.push(
    this.current = this.state[0].scope = s || {}
  )
}

proto.exit = function() {
  this.scopes.pop()
  this.current = this.scopes[this.scopes.length - 1]
}

proto.define = function(str) {
  this.current[str] = this.state[0]
}

proto.find = function(name, fail) {
  for(var i = this.scopes.length - 1; i > -1; --i) {
    if(this.scopes[i].hasOwnProperty(name)) {
      return this.scopes[i][name]
    }
  }

  return null
}

},{}],43:[function(require,module,exports){
module.exports = tokenize

var through = require('../through')

var literals = require('./lib/literals')
  , operators = require('./lib/operators')
  , builtins = require('./lib/builtins')

var NORMAL = 999          // <-- never emitted
  , TOKEN = 9999          // <-- never emitted 
  , BLOCK_COMMENT = 0 
  , LINE_COMMENT = 1
  , PREPROCESSOR = 2
  , OPERATOR = 3
  , INTEGER = 4
  , FLOAT = 5
  , IDENT = 6
  , BUILTIN = 7
  , KEYWORD = 8
  , WHITESPACE = 9
  , EOF = 10 
  , HEX = 11

var map = [
    'block-comment'
  , 'line-comment'
  , 'preprocessor'
  , 'operator'
  , 'integer'
  , 'float'
  , 'ident'
  , 'builtin'
  , 'keyword'
  , 'whitespace'
  , 'eof'
  , 'integer'
]

function tokenize() {
  var stream = through(write, end)

  var i = 0
    , total = 0
    , mode = NORMAL 
    , c
    , last
    , content = []
    , token_idx = 0
    , token_offs = 0
    , line = 1
    , start = 0
    , isnum = false
    , isoperator = false
    , input = ''
    , len

  return stream

  function token(data) {
    if(data.length) {
      stream.queue({
        type: map[mode]
      , data: data
      , position: start
      , line: line
      })
    }
  }

  function write(chunk) {
    i = 0
    input += chunk.toString()
    len = input.length

    while(c = input[i], i < len) switch(mode) {
      case BLOCK_COMMENT: i = block_comment(); break
      case LINE_COMMENT: i = line_comment(); break
      case PREPROCESSOR: i = preprocessor(); break 
      case OPERATOR: i = operator(); break
      case INTEGER: i = integer(); break
      case HEX: i = hex(); break
      case FLOAT: i = decimal(); break
      case TOKEN: i = readtoken(); break
      case WHITESPACE: i = whitespace(); break
      case NORMAL: i = normal(); break
    }

    total += i
    input = input.slice(i)
  } 

  function end(chunk) {
    if(content.length) {
      token(content.join(''))
    }

    mode = EOF
    token('(eof)')

    stream.queue(null)
  }

  function normal() {
    content = content.length ? [] : content

    if(last === '/' && c === '*') {
      start = total + i - 1
      mode = BLOCK_COMMENT
      last = c
      return i + 1
    }

    if(last === '/' && c === '/') {
      start = total + i - 1
      mode = LINE_COMMENT
      last = c
      return i + 1
    }

    if(c === '#') {
      mode = PREPROCESSOR
      start = total + i
      return i
    }

    if(/\s/.test(c)) {
      mode = WHITESPACE
      start = total + i
      return i
    }

    isnum = /\d/.test(c)
    isoperator = /[^\w_]/.test(c)

    start = total + i
    mode = isnum ? INTEGER : isoperator ? OPERATOR : TOKEN
    return i
  }

  function whitespace() {
    if(c === '\n') ++line

    if(/[^\s]/g.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function preprocessor() {
    if(c === '\n') ++line

    if(c === '\n' && last !== '\\') {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function line_comment() {
    return preprocessor()
  }

  function block_comment() {
    if(c === '/' && last === '*') {
      content.push(c)
      token(content.join(''))
      mode = NORMAL
      return i + 1
    }

    if(c === '\n') ++line

    content.push(c)
    last = c
    return i + 1
  }

  function operator() {
    if(last === '.' && /\d/.test(c)) {
      mode = FLOAT
      return i
    }

    if(last === '/' && c === '*') {
      mode = BLOCK_COMMENT
      return i
    }

    if(last === '/' && c === '/') {
      mode = LINE_COMMENT
      return i
    }

    if(c === '.' && content.length) {
      while(determine_operator(content));
      
      mode = FLOAT
      return i
    }

    if(c === ';') {
      if(content.length) while(determine_operator(content));
      token(c)
      mode = NORMAL
      return i + 1
    }

    var is_composite_operator = content.length === 2 && c !== '='
    if(/[\w_\d\s]/.test(c) || is_composite_operator) {
      while(determine_operator(content));
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function determine_operator(buf) {
    var j = 0
      , k = buf.length
      , idx

    do {
      idx = operators.indexOf(buf.slice(0, buf.length + j).join(''))
      if(idx === -1) { 
        j -= 1
        k -= 1
        if (k < 0) return 0
        continue
      }
      
      token(operators[idx])

      start += operators[idx].length
      content = content.slice(operators[idx].length)
      return content.length
    } while(1)
  }

  function hex() {
    if(/[^a-fA-F0-9]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1    
  }

  function integer() {
    if(c === '.') {
      content.push(c)
      mode = FLOAT
      last = c
      return i + 1
    }

    if(/[eE]/.test(c)) {
      content.push(c)
      mode = FLOAT
      last = c
      return i + 1
    }

    if(c === 'x' && content.length === 1 && content[0] === '0') {
      mode = HEX
      content.push(c)
      last = c
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function decimal() {
    if(c === 'f') {
      content.push(c)
      last = c
      i += 1
    }

    if(/[eE]/.test(c)) {
      content.push(c)
      last = c
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function readtoken() {
    if(/[^\d\w_]/.test(c)) {
      var contentstr = content.join('')
      if(literals.indexOf(contentstr) > -1) {
        mode = KEYWORD
      } else if(builtins.indexOf(contentstr) > -1) {
        mode = BUILTIN
      } else {
        mode = IDENT
      }
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }
}

},{"../through":47,"./lib/builtins":44,"./lib/literals":45,"./lib/operators":46}],44:[function(require,module,exports){
module.exports = [
    'gl_Position'
  , 'gl_PointSize'
  , 'gl_ClipVertex'
  , 'gl_FragCoord'
  , 'gl_FrontFacing'
  , 'gl_FragColor'
  , 'gl_FragData'
  , 'gl_FragDepth'
  , 'gl_Color'
  , 'gl_SecondaryColor'
  , 'gl_Normal'
  , 'gl_Vertex'
  , 'gl_MultiTexCoord0'
  , 'gl_MultiTexCoord1'
  , 'gl_MultiTexCoord2'
  , 'gl_MultiTexCoord3'
  , 'gl_MultiTexCoord4'
  , 'gl_MultiTexCoord5'
  , 'gl_MultiTexCoord6'
  , 'gl_MultiTexCoord7'
  , 'gl_FogCoord'
  , 'gl_MaxLights'
  , 'gl_MaxClipPlanes'
  , 'gl_MaxTextureUnits'
  , 'gl_MaxTextureCoords'
  , 'gl_MaxVertexAttribs'
  , 'gl_MaxVertexUniformComponents'
  , 'gl_MaxVaryingFloats'
  , 'gl_MaxVertexTextureImageUnits'
  , 'gl_MaxCombinedTextureImageUnits'
  , 'gl_MaxTextureImageUnits'
  , 'gl_MaxFragmentUniformComponents'
  , 'gl_MaxDrawBuffers'
  , 'gl_ModelViewMatrix'
  , 'gl_ProjectionMatrix'
  , 'gl_ModelViewProjectionMatrix'
  , 'gl_TextureMatrix'
  , 'gl_NormalMatrix'
  , 'gl_ModelViewMatrixInverse'
  , 'gl_ProjectionMatrixInverse'
  , 'gl_ModelViewProjectionMatrixInverse'
  , 'gl_TextureMatrixInverse'
  , 'gl_ModelViewMatrixTranspose'
  , 'gl_ProjectionMatrixTranspose'
  , 'gl_ModelViewProjectionMatrixTranspose'
  , 'gl_TextureMatrixTranspose'
  , 'gl_ModelViewMatrixInverseTranspose'
  , 'gl_ProjectionMatrixInverseTranspose'
  , 'gl_ModelViewProjectionMatrixInverseTranspose'
  , 'gl_TextureMatrixInverseTranspose'
  , 'gl_NormalScale'
  , 'gl_DepthRangeParameters'
  , 'gl_DepthRange'
  , 'gl_ClipPlane'
  , 'gl_PointParameters'
  , 'gl_Point'
  , 'gl_MaterialParameters'
  , 'gl_FrontMaterial'
  , 'gl_BackMaterial'
  , 'gl_LightSourceParameters'
  , 'gl_LightSource'
  , 'gl_LightModelParameters'
  , 'gl_LightModel'
  , 'gl_LightModelProducts'
  , 'gl_FrontLightModelProduct'
  , 'gl_BackLightModelProduct'
  , 'gl_LightProducts'
  , 'gl_FrontLightProduct'
  , 'gl_BackLightProduct'
  , 'gl_FogParameters'
  , 'gl_Fog'
  , 'gl_TextureEnvColor'
  , 'gl_EyePlaneS'
  , 'gl_EyePlaneT'
  , 'gl_EyePlaneR'
  , 'gl_EyePlaneQ'
  , 'gl_ObjectPlaneS'
  , 'gl_ObjectPlaneT'
  , 'gl_ObjectPlaneR'
  , 'gl_ObjectPlaneQ'
  , 'gl_FrontColor'
  , 'gl_BackColor'
  , 'gl_FrontSecondaryColor'
  , 'gl_BackSecondaryColor'
  , 'gl_TexCoord'
  , 'gl_FogFragCoord'
  , 'gl_Color'
  , 'gl_SecondaryColor'
  , 'gl_TexCoord'
  , 'gl_FogFragCoord'
  , 'gl_PointCoord'
  , 'radians'
  , 'degrees'
  , 'sin'
  , 'cos'
  , 'tan'
  , 'asin'
  , 'acos'
  , 'atan'
  , 'pow'
  , 'exp'
  , 'log'
  , 'exp2'
  , 'log2'
  , 'sqrt'
  , 'inversesqrt'
  , 'abs'
  , 'sign'
  , 'floor'
  , 'ceil'
  , 'fract'
  , 'mod'
  , 'min'
  , 'max'
  , 'clamp'
  , 'mix'
  , 'step'
  , 'smoothstep'
  , 'length'
  , 'distance'
  , 'dot'
  , 'cross'
  , 'normalize'
  , 'faceforward'
  , 'reflect'
  , 'refract'
  , 'matrixCompMult'
  , 'lessThan'
  , 'lessThanEqual'
  , 'greaterThan'
  , 'greaterThanEqual'
  , 'equal'
  , 'notEqual'
  , 'any'
  , 'all'
  , 'not'
  , 'texture2D'
  , 'texture2DProj'
  , 'texture2DLod'
  , 'texture2DProjLod'
  , 'textureCube'
  , 'textureCubeLod'
]

},{}],45:[function(require,module,exports){
module.exports = [
  // current
    'precision'
  , 'highp'
  , 'mediump'
  , 'lowp'
  , 'attribute'
  , 'const'
  , 'uniform'
  , 'varying'
  , 'break'
  , 'continue'
  , 'do'
  , 'fo'+'r'
  , 'whi'+'le'
  , 'i'+'f'
  , 'else'
  , 'in'
  , 'out'
  , 'inout'
  , 'float'
  , 'int'
  , 'void'
  , 'bool'
  , 'true'
  , 'false'
  , 'discard'
  , 'return'
  , 'mat2'
  , 'mat3'
  , 'mat4'
  , 'vec2'
  , 'vec3'
  , 'vec4'
  , 'ivec2'
  , 'ivec3'
  , 'ivec4'
  , 'bvec2'
  , 'bvec3'
  , 'bvec4'
  , 'sampler1D'
  , 'sampler2D'
  , 'sampler3D'
  , 'samplerCube'
  , 'sampler1DShadow'
  , 'sampler2DShadow'
  , 'struct'

  // future
  , 'asm'
  , 'class'
  , 'union'
  , 'enum'
  , 'typedef'
  , 'template'
  , 'this'
  , 'packed'
  , 'goto'
  , 'switch'
  , 'default'
  , 'inline'
  , 'noinline'
  , 'volatile'
  , 'public'
  , 'static'
  , 'extern'
  , 'external'
  , 'interface'
  , 'long'
  , 'short'
  , 'double'
  , 'half'
  , 'fixed'
  , 'unsigned'
  , 'input'
  , 'output'
  , 'hvec2'
  , 'hvec3'
  , 'hvec4'
  , 'dvec2'
  , 'dvec3'
  , 'dvec4'
  , 'fvec2'
  , 'fvec3'
  , 'fvec4'
  , 'sampler2DRect'
  , 'sampler3DRect'
  , 'sampler2DRectShadow'
  , 'sizeof'
  , 'cast'
  , 'namespace'
  , 'using'
]

},{}],46:[function(require,module,exports){
module.exports = [
    '<<='
  , '>>='
  , '++'
  , '--'
  , '<<'
  , '>>'
  , '<='
  , '>='
  , '=='
  , '!='
  , '&&'
  , '||'
  , '+='
  , '-='
  , '*='
  , '/='
  , '%='
  , '&='
  , '^='
  , '|='
  , '('
  , ')'
  , '['
  , ']'
  , '.'
  , '!'
  , '~'
  , '*'
  , '/'
  , '%'
  , '+'
  , '-'
  , '<'
  , '>'
  , '&'
  , '^'
  , '|'
  , '?'
  , ':'
  , '='
  , ','
  , ';'
  , '{'
  , '}'
]

},{}],47:[function(require,module,exports){
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Synchronous stream wrapper for glsl tokenizer/parser

const through = function(write, end) {
  const output = [];
  const errors = [];

  return {
    output,
    parser: null,
    write,
    end,

    process(parser, data) {
      this.parser = parser;
      write(data);
      this.flush();
      return this.parser.flush();
    },

    flush() {
      end();
      return [output, errors];
    },

    // From tokenizer
    queue(obj) {
      if (obj != null) { return (this.parser != null ? this.parser.write(obj) : undefined); }
    },

    // From parser
    emit(type, node) {
      if (type === 'data') {
        if ((node.parent == null)) {
          output.push(node);
        }
      }
      if (type === 'error') {
        return errors.push(node);
      }
    }
  };
};

module.exports = through;
},{}]},{},[28]);
