(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
  Graph of nodes with outlets
*/
var Graph;

Graph = (function() {
  class Graph {
    static id(name) {
      return ++Graph.index;
    }

    constructor(nodes, parent = null) {
      this.parent = parent;
      this.id = Graph.id();
      this.nodes = [];
      nodes && this.add(nodes);
    }

    inputs() {
      var i, inputs, j, len, len1, node, outlet, ref, ref1;
      inputs = [];
      ref = this.nodes;
      for (i = 0, len = ref.length; i < len; i++) {
        node = ref[i];
        ref1 = node.inputs;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          outlet = ref1[j];
          if (outlet.input === null) {
            inputs.push(outlet);
          }
        }
      }
      return inputs;
    }

    outputs() {
      var i, j, len, len1, node, outlet, outputs, ref, ref1;
      outputs = [];
      ref = this.nodes;
      for (i = 0, len = ref.length; i < len; i++) {
        node = ref[i];
        ref1 = node.outputs;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          outlet = ref1[j];
          if (outlet.output.length === 0) {
            outputs.push(outlet);
          }
        }
      }
      return outputs;
    }

    getIn(name) {
      var outlet;
      return ((function() {
        var i, len, ref, results;
        ref = this.inputs();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          outlet = ref[i];
          if (outlet.name === name) {
            results.push(outlet);
          }
        }
        return results;
      }).call(this))[0];
    }

    getOut(name) {
      var outlet;
      return ((function() {
        var i, len, ref, results;
        ref = this.outputs();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          outlet = ref[i];
          if (outlet.name === name) {
            results.push(outlet);
          }
        }
        return results;
      }).call(this))[0];
    }

    add(node, ignore) {
      var _node, i, len;
      if (node.length) {
        for (i = 0, len = node.length; i < len; i++) {
          _node = node[i];
          this.add(_node);
        }
        return;
      }
      if (node.graph && !ignore) {
        throw new Error("Adding node to two graphs at once");
      }
      node.graph = this;
      return this.nodes.push(node);
    }

    remove(node, ignore) {
      var _node, i, len;
      if (node.length) {
        for (i = 0, len = node.length; i < len; i++) {
          _node = node[i];
          this.remove(_node);
        }
        return;
      }
      if (node.graph !== this) {
        throw new Error("Removing node from wrong graph.");
      }
      ignore || node.disconnect();
      this.nodes.splice(this.nodes.indexOf(node), 1);
      return node.graph = null;
    }

    adopt(node) {
      var _node, i, len;
      if (node.length) {
        for (i = 0, len = node.length; i < len; i++) {
          _node = node[i];
          this.adopt(_node);
        }
        return;
      }
      node.graph.remove(node, true);
      return this.add(node, true);
    }

  };

  Graph.index = 0;

  Graph.IN = 0;

  Graph.OUT = 1;

  return Graph;

}).call(this);

module.exports = Graph;


},{}],2:[function(require,module,exports){
exports.Graph = require('./graph');

exports.Node = require('./node');

exports.Outlet = require('./outlet');

exports.IN = exports.Graph.IN;

exports.OUT = exports.Graph.OUT;


},{"./graph":1,"./node":3,"./outlet":4}],3:[function(require,module,exports){

/*
 Node in graph.
*/
var Graph, Node, Outlet;

Graph = require('./graph');

Outlet = require('./outlet');

Node = (function() {
  class Node {
    static id(name) {
      return ++Node.index;
    }

    constructor(owner, outlets) {
      this.owner = owner;
      this.graph = null;
      this.inputs = [];
      this.outputs = [];
      this.all = [];
      this.outlets = null;
      this.id = Node.id();
      this.setOutlets(outlets);
    }

    // Retrieve input
    getIn(name) {
      var outlet;
      return ((function() {
        var i, len, ref, results;
        ref = this.inputs;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          outlet = ref[i];
          if (outlet.name === name) {
            results.push(outlet);
          }
        }
        return results;
      }).call(this))[0];
    }

    // Retrieve output
    getOut(name) {
      var outlet;
      return ((function() {
        var i, len, ref, results;
        ref = this.outputs;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          outlet = ref[i];
          if (outlet.name === name) {
            results.push(outlet);
          }
        }
        return results;
      }).call(this))[0];
    }

    // Retrieve by name
    get(name) {
      return this.getIn(name) || this.getOut(name);
    }

    // Set new outlet definition
    setOutlets(outlets) {
      var existing, hash, i, j, k, key, len, len1, len2, match, outlet, ref;
      if (outlets != null) {
        if (this.outlets == null) {
          this.outlets = {};
          for (i = 0, len = outlets.length; i < len; i++) {
            outlet = outlets[i];
            if (!(outlet instanceof Outlet)) {
              outlet = Outlet.make(outlet);
            }
            this._add(outlet);
          }
          return;
        }
        // Return new/old outlet matching hash key
        hash = function(outlet) {
          // Match by name, direction and type.
          return [outlet.name, outlet.inout, outlet.type].join('-');
        };
        // Build hash of new outlets
        match = {};
        for (j = 0, len1 = outlets.length; j < len1; j++) {
          outlet = outlets[j];
          match[hash(outlet)] = true;
        }
        ref = this.outlets;
        // Remove missing outlets, record matches
        for (key in ref) {
          outlet = ref[key];
          key = hash(outlet);
          if (match[key]) {
            match[key] = outlet;
          } else {
            this._remove(outlet);
          }
        }
// Insert new outlets
        for (k = 0, len2 = outlets.length; k < len2; k++) {
          outlet = outlets[k];
          // Find match by hash
          existing = match[hash(outlet)];
          if (existing instanceof Outlet) {
            // Update existing outlets in place to retain connections.
            this._morph(existing, outlet);
          } else {
            if (!(outlet instanceof Outlet)) {
              // Spawn new outlet
              outlet = Outlet.make(outlet);
            }
            this._add(outlet);
          }
        }
        this;
      }
      return this.outlets;
    }

    // Connect to the target node by matching up inputs and outputs.
    connect(node, empty, force) {
      var dest, dests, hint, hints, i, j, k, len, len1, len2, list, outlets, ref, ref1, ref2, source, sources, type, typeHint;
      outlets = {};
      hints = {};
      typeHint = function(outlet) {
        return type + '/' + outlet.hint;
      };
      ref = node.inputs;
      // Hash the types/hints of available target outlets.
      for (i = 0, len = ref.length; i < len; i++) {
        dest = ref[i];
        if (!force && dest.input) {
          // Only autoconnect if not already connected
          continue;
        }
        // Match outlets by type/name hint, then type/position key
        type = dest.type;
        hint = typeHint(dest);
        if (!hints[hint]) {
          hints[hint] = dest;
        }
        outlets[type] = list = outlets[type] || [];
        list.push(dest);
      }
      // Available source outlets
      sources = this.outputs;
      // Ignore connected source if only matching empties.
      sources = sources.filter(function(outlet) {
        return !(empty && outlet.output.length);
      });
      ref1 = sources.slice();
      // Match hints first
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        source = ref1[j];
        // Match outlets by type and name
        type = source.type;
        hint = typeHint(source);
        dests = outlets[type];
        // Connect if found
        if (dest = hints[hint]) {
          source.connect(dest);
          // Remove from potential set
          delete hints[hint];
          dests.splice(dests.indexOf(dest), 1);
          sources.splice(sources.indexOf(source), 1);
        }
      }
      if (!sources.length) {
        // Match what's left
        return this;
      }
      ref2 = sources.slice();
      for (k = 0, len2 = ref2.length; k < len2; k++) {
        source = ref2[k];
        type = source.type;
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
      var i, j, len, len1, outlet, ref, ref1;
      ref = this.inputs;
      for (i = 0, len = ref.length; i < len; i++) {
        outlet = ref[i];
        outlet.disconnect();
      }
      ref1 = this.outputs;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        outlet = ref1[j];
        outlet.disconnect();
      }
      return this;
    }

    // Return hash key for outlet
    _key(outlet) {
      return [outlet.name, outlet.inout].join('-');
    }

    // Add outlet object to node
    _add(outlet) {
      var key;
      key = this._key(outlet);
      if (outlet.node) {
        // Sanity checks
        throw new Error("Adding outlet to two nodes at once.");
      }
      if (this.outlets[key]) {
        throw new Error(`Adding two identical outlets to same node. (${key})`);
      }
      // Link back outlet
      outlet.node = this;
      if (outlet.inout === Graph.IN) {
        // Add to name hash and inout list
        this.inputs.push(outlet);
      }
      if (outlet.inout === Graph.OUT) {
        this.outputs.push(outlet);
      }
      this.all.push(outlet);
      return this.outlets[key] = outlet;
    }

    // Morph outlet to other
    _morph(existing, outlet) {
      var key;
      key = this._key(outlet);
      delete this.outlets[key];
      existing.morph(outlet);
      key = this._key(outlet);
      return this.outlets[key] = outlet;
    }

    // Remove outlet object from node.
    _remove(outlet) {
      var inout, key;
      key = this._key(outlet);
      inout = outlet.inout;
      if (outlet.node !== this) {
        // Sanity checks
        throw new Error("Removing outlet from wrong node.");
      }
      // Disconnect outlet.
      outlet.disconnect();
      // Unlink outlet.
      outlet.node = null;
      // Remove from name list and inout list.
      delete this.outlets[key];
      if (outlet.inout === Graph.IN) {
        this.inputs.splice(this.inputs.indexOf(outlet), 1);
      }
      if (outlet.inout === Graph.OUT) {
        this.outputs.splice(this.outputs.indexOf(outlet), 1);
      }
      this.all.splice(this.all.indexOf(outlet), 1);
      return this;
    }

  };

  Node.index = 0;

  return Node;

}).call(this);

module.exports = Node;


},{"./graph":1,"./outlet":4}],4:[function(require,module,exports){

/*
  In/out outlet on node
*/
var Graph, Outlet;

Graph = require('./graph');

Outlet = (function() {
  class Outlet {
    static make(outlet, extra = {}) {
      var key, meta, ref, value;
      meta = extra;
      if (outlet.meta != null) {
        ref = outlet.meta;
        for (key in ref) {
          value = ref[key];
          meta[key] = value;
        }
      }
      return new Outlet(outlet.inout, outlet.name, outlet.hint, outlet.type, meta);
    }

    static id(name) {
      return `_io_${++Outlet.index}_${name}`;
    }

    static hint(name) {
      name = name.replace(/^_io_[0-9]+_/, '');
      name = name.replace(/_i_o$/, '');
      return name = name.replace(/(In|Out|Inout|InOut)$/, '');
    }

    constructor(inout, name1, hint, type, meta1 = {}, id) {
      this.inout = inout;
      this.name = name1;
      this.hint = hint;
      this.type = type;
      this.meta = meta1;
      this.id = id;
      if (this.hint == null) {
        this.hint = Outlet.hint(this.name);
      }
      this.node = null;
      this.input = null;
      this.output = [];
      if (this.id == null) {
        this.id = Outlet.id(this.hint);
      }
    }

    // Change into given outlet without touching connections
    morph(outlet) {
      this.inout = outlet.inout;
      this.name = outlet.name;
      this.hint = outlet.hint;
      this.type = outlet.type;
      return this.meta = outlet.meta;
    }

    // Copy with unique name and cloned metadata
    dupe(name = this.id) {
      var outlet;
      outlet = Outlet.make(this);
      outlet.name = name;
      return outlet;
    }

    // Connect to given outlet
    connect(outlet) {
      // Auto-reverse in/out to out/in
      if (this.inout === Graph.IN && outlet.inout === Graph.OUT) {
        return outlet.connect(this);
      }
      // Disallow bad combinations
      if (this.inout !== Graph.OUT || outlet.inout !== Graph.IN) {
        throw new Error("Can only connect out to in.");
      }
      // Check for existing connection
      if (outlet.input === this) {
        return;
      }
      // Disconnect existing connections
      outlet.disconnect();
      // Add new connection.
      outlet.input = this;
      return this.output.push(outlet);
    }

    // Disconnect given outlet (or all)
    disconnect(outlet) {
      var i, index, len, ref;
      // Disconnect input from the other side.
      if (this.input) {
        this.input.disconnect(this);
      }
      if (this.output.length) {
        if (outlet) {
          // Remove one outgoing connection.
          index = this.output.indexOf(outlet);
          if (index >= 0) {
            this.output.splice(index, 1);
            return outlet.input = null;
          }
        } else {
          ref = this.output;
          for (i = 0, len = ref.length; i < len; i++) {
            outlet = ref[i];
            // Remove all outgoing connections.
            outlet.input = null;
          }
          return this.output = [];
        }
      }
    }

  };

  Outlet.index = 0;

  return Outlet;

}).call(this);

module.exports = Outlet;


},{"./graph":1}],5:[function(require,module,exports){
var Block, Graph, Layout, OutletError, Program, debug;

Graph = require('../graph');

Program = require('../linker').Program;

Layout = require('../linker').Layout;

debug = false;

Block = class Block {
  static previous(outlet) {
    var ref;
    return (ref = outlet.input) != null ? ref.node.owner : void 0;
  }

  constructor() {
    var ref;
    if (this.namespace == null) {
      this.namespace = Program.entry();
    }
    this.node = new Graph.Node(this, (ref = typeof this.makeOutlets === "function" ? this.makeOutlets() : void 0) != null ? ref : {});
  }

  refresh() {
    var ref;
    return this.node.setOutlets((ref = typeof this.makeOutlets === "function" ? this.makeOutlets() : void 0) != null ? ref : {});
  }

  clone() {
    return new Block();
  }

  // Compile a new program starting from this block
  compile(language, namespace) {
    var program;
    program = new Program(language, namespace != null ? namespace : Program.entry(), this.node.graph);
    this.call(program, 0);
    return program.assemble();
  }

  // Link up programs into a layout, starting from this block
  link(language, namespace) {
    var layout, module;
    module = this.compile(language, namespace);
    layout = new Layout(language, this.node.graph);
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
    var ref, ref1, string;
    string = (ref = (ref1 = this.node.owner.snippet) != null ? ref1._name : void 0) != null ? ref : this.node.owner.namespace;
    if (suffix != null) {
      return string += '.' + suffix;
    }
  }

  // Create an outlet for a signature definition
  _outlet(def, props) {
    var outlet;
    outlet = Graph.Outlet.make(def, props);
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
    var arg, i, len, outlet, ref, ref1, results;
    ref = module.main.signature;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      arg = ref[i];
      outlet = this.node.get(arg.name);
      results.push((ref1 = Block.previous(outlet)) != null ? ref1.call(program, depth + 1) : void 0);
    }
    return results;
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
    var block, ext, i, key, len, orig, outlet, parent, ref, results;
    debug && console.log('block::_link', this.toString(), module.namespace);
    ref = module.symbols;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      key = ref[i];
      ext = module.externals[key];
      outlet = this.node.get(ext.name);
      if (!outlet) {
        throw new OutletError(`External not found on ${this._info(ext.name)}`);
      }
      if (outlet.meta.child != null) {
        continue;
      }
      [orig, parent, block] = [outlet, outlet, null];
      while (!block && parent) {
        [parent, outlet] = [outlet.meta.parent, parent];
      }
      block = Block.previous(outlet);
      if (!block) {
        throw new OutletError(`Missing connection on ${this._info(ext.name)}`);
      }
      debug && console.log('callback -> ', this.toString(), ext.name, outlet);
      block.callback(layout, depth + 1, key, ext, outlet.input);
      results.push(block != null ? block.export(layout, depth + 1) : void 0);
    }
    return results;
  }

  // Trace backwards to discover callbacks further up
  _trace(module, layout, depth) {
    var arg, i, len, outlet, ref, ref1, results;
    debug && console.log('block::_trace', this.toString(), module.namespace);
    ref = module.main.signature;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      arg = ref[i];
      outlet = this.node.get(arg.name);
      results.push((ref1 = Block.previous(outlet)) != null ? ref1.export(layout, depth + 1) : void 0);
    }
    return results;
  }

};

OutletError = function(message) {
  var e;
  e = new Error(message);
  e.name = 'OutletError';
  return e;
};

OutletError.prototype = new Error();

module.exports = Block;


},{"../graph":25,"../linker":30}],6:[function(require,module,exports){
var Block, Call;

Block = require('./block');

Call = class Call extends Block {
  constructor(snippet) {
    super();
    this.snippet = snippet;
    this.namespace = snippet.namespace;
  }

  clone() {
    return new Call(this.snippet);
  }

  makeOutlets() {
    var callbacks, externals, key, main, outlet, params, symbols;
    main = this.snippet.main.signature;
    externals = this.snippet.externals;
    symbols = this.snippet.symbols;
    params = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = main.length; i < len; i++) {
        outlet = main[i];
        results.push(this._outlet(outlet, {
          callback: false
        }));
      }
      return results;
    }).call(this);
    callbacks = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = symbols.length; i < len; i++) {
        key = symbols[i];
        results.push(this._outlet(externals[key], {
          callback: true
        }));
      }
      return results;
    }).call(this);
    return params.concat(callbacks);
  }

  call(program, depth) {
    this._call(this.snippet, program, depth);
    return this._inputs(this.snippet, program, depth);
  }

  export(layout, depth) {
    if (!layout.visit(this.namespace, depth)) {
      return;
    }
    this._link(this.snippet, layout, depth);
    return this._trace(this.snippet, layout, depth);
  }

};

module.exports = Call;


},{"./block":5}],7:[function(require,module,exports){
var Block, Callback, Graph;

Graph = require('../graph');

Block = require('./block');

/*
  Re-use a subgraph as a callback
*/
Callback = class Callback extends Block {
  constructor(graph) {
    super();
    this.graph = graph;
  }

  refresh() {
    super.refresh();
    return delete this.subroutine;
  }

  clone() {
    return new Callback(this.graph);
  }

  makeOutlets() {
    var handle, i, ins, j, len, len1, outlet, outlets, outs, ref, ref1, type;
    this.make();
    outlets = [];
    ins = [];
    outs = [];
    // Pass-through existing callbacks
    // Collect open inputs/outputs
    handle = (outlet, list) => {
      var base, dupe;
      if (outlet.meta.callback) {
        if (outlet.inout === Graph.IN) {
          // Dupe outlet and create two-way link between cloned outlets
          dupe = outlet.dupe();
          if ((base = dupe.meta).child == null) {
            base.child = outlet;
          }
          outlet.meta.parent = dupe;
          return outlets.push(dupe);
        }
      } else {
        return list.push(outlet.type);
      }
    };
    ref = this.graph.inputs();
    for (i = 0, len = ref.length; i < len; i++) {
      outlet = ref[i];
      handle(outlet, ins);
    }
    ref1 = this.graph.outputs();
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      outlet = ref1[j];
      handle(outlet, outs);
    }
    // Merge inputs/outputs into new callback signature
    ins = ins.join(',');
    outs = outs.join(',');
    type = `(${ins})(${outs})`;
    outlets.push({
      name: 'callback',
      type: type,
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
    if (!layout.visit(this.namespace, depth)) {
      return;
    }
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

};

module.exports = Callback;


},{"../graph":25,"./block":5}],8:[function(require,module,exports){
exports.Block = require('./block');

exports.Call = require('./call');

exports.Callback = require('./callback');

exports.Isolate = require('./isolate');

exports.Join = require('./join');


},{"./block":5,"./call":6,"./callback":7,"./isolate":9,"./join":10}],9:[function(require,module,exports){
var Block, Graph, Isolate;

Graph = require('../graph');

Block = require('./block');

/*
  Isolate a subgraph as a single node
*/
Isolate = class Isolate extends Block {
  constructor(graph) {
    super();
    this.graph = graph;
  }

  refresh() {
    super.refresh();
    return delete this.subroutine;
  }

  clone() {
    return new Isolate(this.graph);
  }

  makeOutlets() {
    var base, done, dupe, i, j, len, len1, name, outlet, outlets, ref, ref1, ref2, seen, set;
    this.make();
    outlets = [];
    seen = {};
    done = {};
    ref = ['inputs', 'outputs'];
    for (i = 0, len = ref.length; i < len; i++) {
      set = ref[i];
      ref1 = this.graph[set]();
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        outlet = ref1[j];
        // Preserve name of 'return' and 'callback' outlets
        name = void 0;
        if (((ref2 = outlet.hint) === 'return' || ref2 === 'callback') && outlet.inout === Graph.OUT) {
          name = outlet.hint;
        }
        if (seen[name] != null) {
          // Unless it already exists
          name = void 0;
        }
        // Dupe outlet and remember link to original
        dupe = outlet.dupe(name);
        if ((base = dupe.meta).child == null) {
          base.child = outlet;
        }
        outlet.meta.parent = dupe;
        if (name != null) {
          seen[name] = true;
        }
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
    if (!layout.visit(this.namespace, depth)) {
      return;
    }
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

};

module.exports = Isolate;


},{"../graph":25,"./block":5}],10:[function(require,module,exports){
var Block, Join;

Block = require('./block');

/*
  Join multiple disconnected nodes
*/
Join = class Join extends Block {
  constructor(nodes) {
    super();
    this.nodes = nodes;
  }

  clone() {
    return new Join(this.nodes);
  }

  makeOutlets() {
    return [];
  }

  call(program, depth) {
    var block, i, len, node, ref, results;
    ref = this.nodes;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      node = ref[i];
      block = node.owner;
      results.push(block.call(program, depth));
    }
    return results;
  }

  export(layout, depth) {
    var block, i, len, node, ref, results;
    ref = this.nodes;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      node = ref[i];
      block = node.owner;
      results.push(block.export(layout, depth));
    }
    return results;
  }

};

module.exports = Join;


},{"./block":5}],11:[function(require,module,exports){
/*
  Cache decorator  
  Fetches snippets once, clones for reuse
  Inline code is hashed to avoid bloat
*/
var cache, hash, queue;

queue = require('./queue');

hash = require('./hash');

cache = function(fetch) {
  var cached, push;
  cached = {};
  push = queue(100);
  // Snippet factory
  return function(name) {
    var expire, key;
    key = name.length > 32 ? '##' + hash(name).toString(16) : name;
    // Push new key onto queue, see if an old key expired
    expire = push(key);
    if (expire != null) {
      delete cached[expire];
    }
    if (cached[key] == null) {
      // Clone cached snippet
      cached[key] = fetch(name);
    }
    return cached[key].clone();
  };
};

module.exports = cache;


},{"./hash":13,"./queue":17}],12:[function(require,module,exports){
var Block, Factory, Graph, State, Visualize;

Graph = require('../graph').Graph;

Block = require('../block');

Visualize = require('../visualize');

/*
  Chainable factory

  Exposes methods to build a graph incrementally
*/
Factory = class Factory {
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
    var pass;
    pass = this._stack[2].end;
    this.end();
    this._state.end = this._state.end.concat(pass);
    return this;
  }

  // Leave nested branches and join up with main graph,
  // applying stored op along the way
  end() {
    var main, op, sub;
    [sub, main] = this._exit();
    op = sub.op;
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
    var graph, ref;
    while (((ref = this._stack) != null ? ref.length : void 0) > 1) {
      // Pop remaining stack
      this.end();
    }
    // Remember terminating node(s) of graph
    if (this._graph) {
      this._tail(this._state, this._graph);
    }
    graph = this._graph;
    this._graph = new Graph();
    this._state = new State();
    this._stack = [this._state];
    return graph;
  }

  // Compile shortcut (graph is thrown away)
  compile(namespace = 'main') {
    return this.graph().compile(namespace);
  }

  // Link shortcut (graph is thrown away)
  link(namespace = 'main') {
    return this.graph().link(namespace);
  }

  // Serialize for debug
  serialize() {
    return Visualize.serialize(this._graph);
  }

  // Return true if empty
  empty() {
    return this._graph.nodes.length === 0;
  }

  // Concatenate existing factory onto tail
  // Retains original factory
  _concat(factory) {
    var block, error;
    if (factory._state.nodes.length === 0) {
      // Ignore empty concat
      return this;
    }
    this._tail(factory._state, factory._graph);
    try {
      block = new Block.Isolate(factory._graph);
    } catch (error1) {
      error = error1;
      if (this.config.autoInspect) {
        Visualize.inspect(error, this._graph, factory);
      }
      throw error;
    }
    this._auto(block);
    return this;
  }

  // Add existing factory as callback
  // Retains original factory
  _import(factory) {
    var block, error;
    if (factory._state.nodes.length === 0) {
      // Check for empty require
      throw "Can't import empty callback";
    }
    this._tail(factory._state, factory._graph);
    try {
      block = new Block.Callback(factory._graph);
    } catch (error1) {
      error = error1;
      if (this.config.autoInspect) {
        Visualize.inspect(error, this._graph, factory);
      }
      throw error;
    }
    this._auto(block);
    return this;
  }

  // Connect parallel branches to tail
  _combine(sub, main) {
    var from, j, k, len, len1, ref, ref1, to;
    ref = sub.start;
    for (j = 0, len = ref.length; j < len; j++) {
      to = ref[j];
      ref1 = main.end;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        from = ref1[k];
        from.connect(to, sub.multi);
      }
    }
    main.end = sub.end;
    return main.nodes = main.nodes.concat(sub.nodes);
  }

  // Make subgraph and connect to tail 
  _isolate(sub, main) {
    var block, error, subgraph;
    if (sub.nodes.length) {
      subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);
      try {
        block = new Block.Isolate(subgraph);
      } catch (error1) {
        error = error1;
        if (this.config.autoInspect) {
          Visualize.inspect(error, this._graph, subgraph);
        }
        throw error;
      }
      return this._auto(block);
    }
  }

  // Convert to callback and connect to tail
  _callback(sub, main) {
    var block, error, subgraph;
    if (sub.nodes.length) {
      subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);
      try {
        block = new Block.Callback(subgraph);
      } catch (error1) {
        error = error1;
        if (this.config.autoInspect) {
          Visualize.inspect(error, this._graph, subgraph);
        }
        throw error;
      }
      return this._auto(block);
    }
  }

  // Create next call block
  _call(name, uniforms, namespace, defines) {
    var block, snippet;
    snippet = this.fetch(name);
    snippet.bind(this.config, uniforms, namespace, defines);
    block = new Block.Call(snippet);
    return this._auto(block);
  }

  // Move current state into subgraph
  _subgraph(sub) {
    var subgraph;
    subgraph = new Graph(null, this._graph);
    subgraph.adopt(sub.nodes);
    return subgraph;
  }

  // Finalize graph tail
  _tail(state, graph) {
    var tail;
    // Merge (unique) terminating ends into single tail node if needed
    tail = state.end.concat(state.tail);
    tail = tail.filter(function(node, i) {
      return tail.indexOf(node) === i;
    });
    if (tail.length > 1) {
      tail = new Block.Join(tail);
      tail = [tail.node];
      this._graph.add(tail);
    }
    // Save single endpoint
    graph.tail = tail[0];
    state.end = tail;
    state.tail = [];
    if (!graph.tail) {
      throw new Error("Cannot finalize empty graph");
    }
    // Add compile/link/export/inspect shortcut methods
    graph.compile = (namespace = 'main') => {
      var error;
      try {
        return graph.tail.owner.compile(this.language, namespace);
      } catch (error1) {
        error = error1;
        if (this.config.autoInspect) {
          graph.inspect(error);
        }
        throw error;
      }
    };
    graph.link = (namespace = 'main') => {
      var error;
      try {
        return graph.tail.owner.link(this.language, namespace);
      } catch (error1) {
        error = error1;
        if (this.config.autoInspect) {
          graph.inspect(error);
        }
        throw error;
      }
    };
    graph.export = (layout, depth) => {
      return graph.tail.owner.export(layout, depth);
    };
    return graph.inspect = function(message = null) {
      return Visualize.inspect(message, graph);
    };
  }

  // Create group for branches or callbacks
  _group(op, multi) {
    this._push(op, multi); // Accumulator
    this._push(); // Current
    return this;
  }

  // Merge branch into accumulator and reset state
  _next() {
    var sub;
    sub = this._pop();
    this._state.start = this._state.start.concat(sub.start);
    this._state.end = this._state.end.concat(sub.end);
    this._state.nodes = this._state.nodes.concat(sub.nodes);
    this._state.tail = this._state.tail.concat(sub.tail);
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
    var ref;
    this._state = this._stack[1];
    if (this._state == null) {
      this._state = new State();
    }
    return (ref = this._stack.shift()) != null ? ref : new State();
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
    var end, j, len, node, ref;
    node = block.node;
    this._graph.add(node);
    ref = this._state.end;
    for (j = 0, len = ref.length; j < len; j++) {
      end = ref[j];
      end.connect(node);
    }
    if (!this._state.start.length) {
      this._state.start = [node];
    }
    this._state.end = [node];
    this._state.nodes.push(node);
    if (!node.outputs.length) {
      return this._state.tail.push(node);
    }
  }

  // Add block and connect to start
  _prepend(block) {
    var j, len, node, ref, start;
    node = block.node;
    this._graph.add(node);
    ref = this._state.start;
    for (j = 0, len = ref.length; j < len; j++) {
      start = ref[j];
      node.connect(start);
    }
    if (!this._state.end.length) {
      this._state.end = [node];
    }
    this._state.start = [node];
    this._state.nodes.push(node);
    if (!node.outputs.length) {
      return this._state.tail.push(node);
    }
  }

  // Insert loose block
  _insert(block) {
    var node;
    node = block.node;
    this._graph.add(node);
    this._state.start.push(node);
    this._state.end.push(node);
    this._state.nodes.push(node);
    if (!node.outputs.length) {
      return this._state.tail.push(node);
    }
  }

};

State = class State {
  constructor(op1 = null, multi1 = false, start1 = [], end1 = [], nodes = [], tail1 = []) {
    this.op = op1;
    this.multi = multi1;
    this.start = start1;
    this.end = end1;
    this.nodes = nodes;
    this.tail = tail1;
  }

};

module.exports = Factory;


},{"../block":8,"../graph":25,"../visualize":36}],13:[function(require,module,exports){
// Hash string into a 32-bit key (murmurhash3)
var c1, c2, c3, c4, c5, hash, imul, test;

c1 = 0xcc9e2d51;

c2 = 0x1b873593;

c3 = 0xe6546b64;

c4 = 0x85ebca6b;

c5 = 0xc2b2ae35;

// Fix imul in old/broken browsers
imul = function(a, b) {
  var ah, al, bh, bl;
  ah = (a >>> 16) & 0xffff;
  al = a & 0xffff;
  bh = (b >>> 16) & 0xffff;
  bl = b & 0xffff;
  return (al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0;
};

if (Math.imul != null) {
  test = Math.imul(0xffffffff, 5);
  if (test === -5) {
    imul = Math.imul;
  }
}

hash = function(string) {
  var h, iterate, j, m, n, next;
  n = string.length;
  m = Math.floor(n / 2);
  j = h = 0;
  next = function() {
    return string.charCodeAt(j++);
  };
  iterate = function(a, b) {
    var k;
    k = a | (b << 16); // two utf-16 words
    k ^= k << 9; // whitening for ascii-only strings
    k = imul(k, c1);
    k = (k << 15) | (k >>> 17);
    k = imul(k, c2);
    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = imul(h, 5);
    return h = (h + c3) | 0;
  };
  while (m--) {
    iterate(next(), next());
  }
  if (n & 1) {
    iterate(next(), 0);
  }
  h ^= n;
  h ^= h >>> 16;
  h = imul(h, c4);
  h ^= h >>> 13;
  h = imul(h, c5);
  return h ^= h >>> 16;
};

module.exports = hash;


},{}],14:[function(require,module,exports){
exports.Factory = require('./factory');

exports.Material = require('./material');

exports.library = require('./library');

exports.cache = require('./cache');

exports.queue = require('./queue');

exports.hash = require('./hash');


},{"./cache":11,"./factory":12,"./hash":13,"./library":15,"./material":16,"./queue":17}],15:[function(require,module,exports){
/*
  Snippet library

  Takes:
    - Hash of snippets: named library
    - (name) -> getter: dynamic lookup
    - nothing:          no library, only pass in inline source code

  If 'name' contains any of "{;(#" it is assumed to be direct GLSL code.
*/
var library;

library = function(language, snippets, load) {
  var callback, fetch, inline, used;
  callback = null;
  used = {};
  if (snippets != null) {
    if (typeof snippets === 'function') {
      callback = function(name) {
        return load(language, name, snippets(name));
      };
    } else if (typeof snippets === 'object') {
      callback = function(name) {
        if (snippets[name] == null) {
          throw new Error(`Unknown snippet \`${name}\``);
        }
        return load(language, name, snippets[name]);
      };
    }
  }
  inline = function(code) {
    return load(language, '', code);
  };
  if (callback == null) {
    return inline;
  }
  fetch = function(name) {
    if (name.match(/[{;]/)) {
      return inline(name);
    }
    used[name] = true;
    return callback(name);
  };
  fetch.used = function(_used = used) {
    return used = _used;
  };
  return fetch;
};

module.exports = library;


},{}],16:[function(require,module,exports){
var Material, Visualize, debug, tick;

debug = false;

Visualize = require('../visualize');

tick = function() {
  var now;
  now = +new Date();
  return function(label) {
    var delta;
    delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

Material = class Material {
  constructor(vertex1, fragment1) {
    this.vertex = vertex1;
    this.fragment = fragment1;
    if (debug) {
      this.tock = tick();
    }
  }

  build(options) {
    return this.link(options);
  }

  link(options = {}) {
    var attributes, fragment, i, key, len, ref, ref1, ref2, ref3, shader, uniforms, value, varyings, vertex;
    uniforms = {};
    varyings = {};
    attributes = {};
    vertex = this.vertex.link('main');
    fragment = this.fragment.link('main');
    ref = [vertex, fragment];
    for (i = 0, len = ref.length; i < len; i++) {
      shader = ref[i];
      ref1 = shader.uniforms;
      for (key in ref1) {
        value = ref1[key];
        (uniforms[key] = value);
      }
      ref2 = shader.varyings;
      for (key in ref2) {
        value = ref2[key];
        (varyings[key] = value);
      }
      ref3 = shader.attributes;
      for (key in ref3) {
        value = ref3[key];
        (attributes[key] = value);
      }
    }
    options.vertexShader = vertex.code;
    options.vertexGraph = vertex.graph;
    options.fragmentShader = fragment.code;
    options.fragmentGraph = fragment.graph;
    options.attributes = attributes;
    options.uniforms = uniforms;
    options.varyings = varyings;
    options.inspect = function() {
      return Visualize.inspect('Vertex Shader', vertex, 'Fragment Shader', fragment.graph);
    };
    if (debug) {
      this.tock('Material build');
    }
    return options;
  }

  inspect() {
    return Visualize.inspect('Vertex Shader', this.vertex, 'Fragment Shader', this.fragment.graph);
  }

};

module.exports = Material;


},{"../visualize":36}],17:[function(require,module,exports){
// Least-recently-used queue for key expiry via linked list
var queue;

queue = function(limit = 100) {
  var add, count, head, map, remove, tail;
  map = {};
  head = null;
  tail = null;
  count = 0;
  // Insert at front
  add = function(item) {
    item.prev = null;
    item.next = head;
    if (head != null) {
      head.prev = item;
    }
    head = item;
    if (tail == null) {
      return tail = item;
    }
  };
  // Remove from list
  remove = function(item) {
    var next, prev;
    prev = item.prev;
    next = item.next;
    if (prev != null) {
      prev.next = next;
    }
    if (next != null) {
      next.prev = prev;
    }
    if (head === item) {
      head = next;
    }
    if (tail === item) {
      return tail = prev;
    }
  };
  // Push key to top of list
  return function(key) {
    var dead, item;
    if (item = map[key] && item !== head) {
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
      item = {
        next: head,
        prev: null,
        key: key
      };
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
  Compile snippet back into GLSL, but with certain symbols replaced by prefixes / placeholders
*/
  /*
  String-replacement based compiler
  */
var compile, replaced, string_compiler, tick;

compile = function(program) {
  var assembler, ast, code, placeholders, signatures;
  ({ast, code, signatures} = program);
  // Prepare list of placeholders
  placeholders = replaced(signatures);
  // Compile
  assembler = string_compiler(code, placeholders);
  return [signatures, assembler];
};

// #####
tick = function() {
  var now;
  now = +new Date();
  return function(label) {
    var delta;
    delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

replaced = function(signatures) {
  var i, j, key, len, len1, out, ref, ref1, s, sig;
  out = {};
  s = function(sig) {
    return out[sig.name] = true;
  };
  s(signatures.main);
  ref = ['external', 'internal', 'varying', 'uniform', 'attribute'];
  // Prefix all global symbols
  for (i = 0, len = ref.length; i < len; i++) {
    key = ref[i];
    ref1 = signatures[key];
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      sig = ref1[j];
      s(sig);
    }
  }
  return out;
};

string_compiler = function(code, placeholders) {
  var key, re;
  // Make regexp for finding placeholders
  // Replace on word boundaries
  re = new RegExp('\\b(' + ((function() {
    var results;
    results = [];
    for (key in placeholders) {
      results.push(key);
    }
    return results;
  })()).join('|') + ')\\b', 'g');
  // Strip comments
  code = code.replace(/\/\/[^\n]*/g, '');
  code = code.replace(/\/\*([^*]|\*[^\/])*\*\//g, '');
  // Strip all preprocessor commands (lazy)
  //code = code.replace /^#[^\n]*/mg, ''

    // Assembler function that takes namespace prefix and exceptions
  // and returns GLSL source code
  return function(prefix = '', exceptions = {}, defines = {}) {
    var compiled, defs, replace, value;
    replace = {};
    for (key in placeholders) {
      replace[key] = exceptions[key] != null ? key : prefix + key;
    }
    compiled = code.replace(re, function(key) {
      return replace[key];
    });
    defs = (function() {
      var results;
      results = [];
      for (key in defines) {
        value = defines[key];
        results.push(`#define ${key} ${value}`);
      }
      return results;
    })();
    if (defs.length) {
      defs.push('');
    }
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
// AST node parsers
var Definition, decl, defaults, get, three, threejs, win;

module.exports = decl = {};

decl.in = 0;

decl.out = 1;

decl.inout = 2;

get = function(n) {
  return n.token.data;
};

decl.node = function(node) {
  var ref, ref1;
  if (((ref = node.children[5]) != null ? ref.type : void 0) === 'function') {
    return decl.function(node);
  } else if (((ref1 = node.token) != null ? ref1.type : void 0) === 'keyword') {
    return decl.external(node);
  }
};

decl.external = function(node) {
  var c, i, ident, j, len, list, next, out, quant, ref, storage, struct, type;
  //    console.log 'external', node
  c = node.children;
  storage = get(c[1]);
  struct = get(c[3]);
  type = get(c[4]);
  list = c[5];
  if (storage !== 'attribute' && storage !== 'uniform' && storage !== 'varying') {
    storage = 'global';
  }
  out = [];
  ref = list.children;
  for (i = j = 0, len = ref.length; j < len; i = ++j) {
    c = ref[i];
    if (c.type === 'ident') {
      ident = get(c);
      next = list.children[i + 1];
      quant = (next != null ? next.type : void 0) === 'quantifier';
      out.push({
        decl: 'external',
        storage: storage,
        type: type,
        ident: ident,
        quant: !!quant,
        count: quant
      });
    }
  }
  return out;
};

decl.function = function(node) {
  var args, body, c, child, decls, func, ident, storage, struct, type;
  c = node.children;
  //    console.log 'function', node
  storage = get(c[1]);
  struct = get(c[3]);
  type = get(c[4]);
  func = c[5];
  ident = get(func.children[0]);
  args = func.children[1];
  body = func.children[2];
  decls = (function() {
    var j, len, ref, results;
    ref = args.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      results.push(decl.argument(child));
    }
    return results;
  })();
  return [
    {
      decl: 'function',
      storage: storage,
      type: type,
      ident: ident,
      body: !!body,
      args: decls
    }
  ];
};

decl.argument = function(node) {
  var c, count, ident, inout, list, quant, storage, type;
  c = node.children;
  //    console.log 'argument', node
  storage = get(c[1]);
  inout = get(c[2]);
  type = get(c[4]);
  list = c[5];
  ident = get(list.children[0]);
  quant = list.children[1];
  count = quant ? quant.children[0].token.data : void 0;
  return {
    decl: 'argument',
    storage: storage,
    inout: inout,
    type: type,
    ident: ident,
    quant: !!quant,
    count: count
  };
};

decl.param = function(dir, storage, spec, quant, count) {
  var f, prefix, suffix;
  prefix = [];
  if (storage != null) {
    prefix.push(storage);
  }
  if (spec != null) {
    prefix.push(spec);
  }
  prefix.push('');
  prefix = prefix.join(' ');
  suffix = quant ? '[' + count + ']' : '';
  if (dir !== '') {
    dir += ' ';
  }
  f = function(name, long) {
    return (long ? dir : '') + `${prefix}${name}${suffix}`;
  };
  f.split = function(dir) {
    return decl.param(dir, storage, spec, quant, count);
  };
  return f;
};

// Three.js sugar
win = typeof window !== 'undefined';

threejs = win && !!window.THREE;

defaults = {
  int: 0,
  float: 0,
  vec2: threejs ? THREE.Vector2 : null,
  vec3: threejs ? THREE.Vector3 : null,
  vec4: threejs ? THREE.Vector4 : null,
  mat2: null,
  mat3: threejs ? THREE.Matrix3 : null,
  mat4: threejs ? THREE.Matrix4 : null,
  sampler2D: 0,
  samplerCube: 0
};

three = {
  int: 'i',
  float: 'f',
  vec2: 'v2',
  vec3: 'v3',
  vec4: 'v4',
  mat2: 'm2',
  mat3: 'm3',
  mat4: 'm4',
  sampler2D: 't',
  samplerCube: 't'
};

decl.type = function(name, spec, quant, count, dir, storage) {
  var dirs, inout, param, ref, storages, type, value;
  dirs = {
    in: decl.in,
    out: decl.out,
    inout: decl.inout
  };
  storages = {
    const: 'const'
  };
  type = three[spec];
  if (quant) {
    type += 'v';
  }
  value = defaults[spec];
  if (value != null ? value.call : void 0) {
    value = new value();
  }
  if (quant) {
    value = [value];
  }
  inout = (ref = dirs[dir]) != null ? ref : dirs.in;
  storage = storages[storage];
  param = decl.param(dir, storage, spec, quant, count);
  return new Definition(name, type, spec, param, value, inout);
};

Definition = class Definition {
  constructor(name1, type1, spec1, param1, value1, inout1, meta1) {
    this.name = name1;
    this.type = type1;
    this.spec = spec1;
    this.param = param1;
    this.value = value1;
    this.inout = inout1;
    this.meta = meta1;
  }

  split() {
    var dir, inout, isIn, param;
    // Split inouts
    isIn = this.meta.shadowed != null;
    dir = isIn ? 'in' : 'out';
    inout = isIn ? decl.in : decl.out;
    param = this.param.split(dir);
    return new Definition(this.name, this.type, this.spec, param, this.value, inout);
  }

  copy(name, meta) {
    var def;
    return def = new Definition(name != null ? name : this.name, this.type, this.spec, this.param, this.value, this.inout, meta);
  }

};


},{}],21:[function(require,module,exports){
var $, Graph, _;

Graph = require('../graph');

$ = require('./constants');

/*
 GLSL code generator for compiler and linker stubs
*/
module.exports = _ = {
  // Check if shadow outlet
  unshadow: function(name) {
    var real;
    real = name.replace($.SHADOW_ARG, '');
    if (real !== name) {
      return real;
    } else {
      return null;
    }
  },
  // Line joiners
  lines: function(lines) {
    return lines.join('\n');
  },
  list: function(lines) {
    return lines.join(', ');
  },
  statements: function(lines) {
    return lines.join(';\n');
  },
  // Function body
  body: function(entry) {
    return {
      entry: entry,
      type: 'void',
      params: [],
      signature: [],
      return: '',
      vars: {},
      calls: [],
      post: [],
      chain: {}
    };
  },
  // Symbol define
  define: function(a, b) {
    return `#define ${a} ${b}`;
  },
  // Function define
  function: function(type, entry, params, vars, calls) {
    return `${type} ${entry}(${params}) {\n${vars}${calls}}`;
  },
  // Function invocation
  invoke: function(ret, entry, args) {
    ret = ret ? `${ret} = ` : '';
    args = _.list(args);
    return `  ${ret}${entry}(${args})`;
  },
  // Compare two signatures
  same: function(a, b) {
    var A, B, i, k, len;
    for (i = k = 0, len = a.length; k < len; i = ++k) {
      A = a[i];
      B = b[i];
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
  },
  // Generate call signature for module invocation
  call: function(lookup, dangling, entry, signature, body) {
    var arg, args, copy, id, inout, isReturn, k, len, meta, name, omit, op, other, ref, ref1, ret, rets, shadow;
    args = [];
    ret = '';
    rets = 1;
    for (k = 0, len = signature.length; k < len; k++) {
      arg = signature[k];
      name = arg.name;
      copy = id = lookup(name);
      other = null;
      meta = null;
      omit = false;
      inout = arg.inout;
      isReturn = name === $.RETURN_ARG;
      // Shadowed inout: input side
      if (shadow = (ref = arg.meta) != null ? ref.shadowed : void 0) {
        other = lookup(shadow);
        if (other) {
          body.vars[other] = "  " + arg.param(other);
          body.calls.push(`  ${other} = ${id}`);
          if (!dangling(shadow)) {
            arg = arg.split();
          } else {
            meta = {
              shadowed: other
            };
          }
        }
      }
      // Shadowed inout: output side
      if (shadow = (ref1 = arg.meta) != null ? ref1.shadow : void 0) {
        other = lookup(shadow);
        if (other) {
          if (!dangling(shadow)) {
            arg = arg.split();
            omit = true;
          } else {
            meta = {
              shadow: other
            };
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
        op = 'push';
        if (isReturn) {
          if (body.return === '') {
            op = 'unshift';
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
    return body.calls.push(_.invoke(ret, entry, args));
  },
  // Assemble main() function from body and call reference
  build: function(body, calls) {
    var a, b, code, decl, entry, params, post, ret, type, v, vars;
    entry = body.entry;
    code = null;
    // Check if we're only calling one snippet with identical signature
    // and not building void main();
    if (calls && calls.length === 1 && entry !== 'main') {
      a = body;
      b = calls[0].module;
      if (_.same(body.signature, b.main.signature)) {
        code = _.define(entry, b.entry);
      }
    }
    if (code == null) {
      vars = (function() {
        var ref, results;
        ref = body.vars;
        results = [];
        for (v in ref) {
          decl = ref[v];
          results.push(decl);
        }
        return results;
      })();
      calls = body.calls;
      post = body.post;
      params = body.params;
      type = body.type;
      ret = body.return;
      calls = calls.concat(post);
      if (ret !== '') {
        calls.push(ret);
      }
      calls.push('');
      if (vars.length) {
        vars.push('');
        vars = _.statements(vars) + '\n';
      } else {
        vars = '';
      }
      calls = _.statements(calls);
      params = _.list(params);
      code = _.function(type, entry, params, vars, calls);
    }
    return {
      signature: body.signature,
      code: code,
      name: entry
    };
  },
  // Build links to other callbacks
  links: function(links) {
    var k, l, len, out;
    out = {
      defs: [],
      bodies: []
    };
    for (k = 0, len = links.length; k < len; k++) {
      l = links[k];
      _.link(l, out);
    }
    out.defs = _.lines(out.defs);
    out.bodies = _.statements(out.bodies);
    if (out.defs === '') {
      delete out.defs;
    }
    if (out.bodies === '') {
      delete out.bodies;
    }
    return out;
  },
  // Link a module's entry point as a callback
  link: (link, out) => {
    var _dangling, _lookup, _name, arg, entry, external, inner, ins, k, len, len1, list, main, map, module, n, name, other, outer, outs, ref, ref1, returnVar, wrapper;
    ({module, name, external} = link);
    main = module.main;
    entry = module.entry;
    // If signatures match, #define alias for the symbol
    if (_.same(main.signature, external.signature)) {
      return out.defs.push(_.define(name, entry));
    }
    // Signatures differ, build one-line callback to match defined prototype

    // Map names to names
    ins = [];
    outs = [];
    map = {};
    returnVar = [module.namespace, $.RETURN_ARG].join('');
    ref = external.signature;
    for (k = 0, len = ref.length; k < len; k++) {
      arg = ref[k];
      list = arg.inout === Graph.IN ? ins : outs;
      list.push(arg);
    }
    ref1 = main.signature;
    for (n = 0, len1 = ref1.length; n < len1; n++) {
      arg = ref1[n];
      list = arg.inout === Graph.IN ? ins : outs;
      other = list.shift();
      _name = other.name;
      // Avoid 'return' keyword
      if (_name === $.RETURN_ARG) {
        _name = returnVar;
      }
      map[arg.name] = _name;
    }
    // Build function prototype to invoke the other side
    _lookup = function(name) {
      return map[name];
    };
    _dangling = function() {
      return true;
    };
    inner = _.body();
    _.call(_lookup, _dangling, entry, main.signature, inner);
    inner.entry = entry;
    // Avoid 'return' keyword
    map = {
      return: returnVar
    };
    _lookup = function(name) {
      var ref2;
      return (ref2 = map[name]) != null ? ref2 : name;
    };
    // Build wrapper function for the calling side
    outer = _.body();
    wrapper = _.call(_lookup, _dangling, entry, external.signature, outer);
    outer.calls = inner.calls;
    outer.entry = name;
    out.bodies.push(_.build(inner).code.split(' {')[0]);
    return out.bodies.push(_.build(outer).code);
  },
  // Remove all function prototypes to avoid redefinition errors
  defuse: function(code) {
    var b, blocks, hash, head, i, j, k, len, len1, level, line, n, re, rest, strip;
    // Don't try this at home kids
    re = /([A-Za-z0-9_]+\s+)?[A-Za-z0-9_]+\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*;\s*/mg;
    strip = function(code) {
      return code.replace(re, function(m) {
        return '';
      });
    };
    // Split into scopes by braces
    blocks = code.split(/(?=[{}])/g);
    level = 0;
    for (i = k = 0, len = blocks.length; k < len; i = ++k) {
      b = blocks[i];
      switch (b[0]) {
        case '{':
          level++;
          break;
        case '}':
          level--;
      }
      // Only mess with top level scope
      if (level === 0) {
        // Preprocessor lines will fuck us up. Split on them.
        hash = b.split(/^[ \t]*#/m);
        for (j = n = 0, len1 = hash.length; n < len1; j = ++n) {
          line = hash[j];
          if (j > 0) {
            // Trim off preprocessor directive
            line = line.split(/\n/);
            head = line.shift();
            rest = line.join("\n");
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
  dedupe: function(code) {
    var map, re;
    map = {};
    re = /((attribute|uniform|varying)\s+)[A-Za-z0-9_]+\s+([A-Za-z0-9_]+)\s*(\[[^\]]*\]\s*)?;\s*/mg;
    return code.replace(re, function(m, qual, type, name, struct) {
      if (map[name]) {
        return '';
      }
      map[name] = true;
      return m;
    });
  },
  // Move definitions to top so they compile properly
  hoist: function(code) {
    var filter, lines;
    filter = function(lines, re) {
      var defs, k, len, line, list, out;
      defs = [];
      out = [];
      for (k = 0, len = lines.length; k < len; k++) {
        line = lines[k];
        list = line.match(re) ? defs : out;
        list.push(line);
      }
      return defs.concat(out);
    };
    lines = code.split("\n");
    // Hoist symbol defines to the top so (re)definitions use the right alias
    lines = filter(lines, /^#define ([^ ]+ _pg_[0-9]+_|_pg_[0-9]+_ [^ ]+)$/);
    // Hoist extensions
    lines = filter(lines, /^#extension/);
    return lines.join("\n");
  }
};


},{"../graph":25,"./constants":19}],22:[function(require,module,exports){
var i, k, len, ref, v;

exports.compile = require('./compile');

exports.parse = require('./parse');

exports.generate = require('./generate');

ref = require('./constants');
for (v = i = 0, len = ref.length; i < len; v = ++i) {
  k = ref[v];
  exports[k] = v;
}


},{"./compile":18,"./constants":19,"./generate":21,"./parse":23}],23:[function(require,module,exports){
var $, collect, debug, decl, extractSignatures, mapSymbols, parse, parseGLSL, parser, processAST, sortSymbols, tick, tokenizer, walk;

tokenizer = require('../../vendor/glsl-tokenizer');

parser = require('../../vendor/glsl-parser');

decl = require('./decl');

$ = require('./constants');

debug = false;

/*
parse GLSL into AST
extract all global symbols and make type signatures
*/
// Parse a GLSL snippet
parse = function(name, code) {
  var ast, program;
  ast = parseGLSL(name, code);
  return program = processAST(ast, code);
};

// Parse GLSL language into AST
parseGLSL = function(name, code) {
  var ast, e, error, errors, fmt, j, len, tock;
  if (debug) {
    tock = tick();
  }
  try {
    // Sync stream hack (see /vendor/through)
    [[ast], errors] = tokenizer().process(parser(), code);
  } catch (error1) {
    e = error1;
    errors = [
      {
        message: e
      }
    ];
  }
  if (debug) {
    tock('GLSL Tokenize & Parse');
  }
  fmt = function(code) {
    var max, pad;
    code = code.split("\n");
    max = ("" + code.length).length;
    pad = function(v) {
      if ((v = "" + v).length < max) {
        return ("       " + v).slice(-max);
      } else {
        return v;
      }
    };
    return code.map(function(line, i) {
      return `${pad(i + 1)}: ${line}`;
    }).join("\n");
  };
  if (!ast || errors.length) {
    if (!name) {
      name = '(inline code)';
    }
    console.warn(fmt(code));
    for (j = 0, len = errors.length; j < len; j++) {
      error = errors[j];
      console.error(`${name} -`, error.message);
    }
    throw new Error("GLSL parse error");
  }
  return ast;
};

// Process AST for compilation
processAST = function(ast, code) {
  var externals, internals, main, signatures, symbols, tock;
  if (debug) {
    tock = tick();
  }
  // Walk AST tree and collect global declarations
  symbols = [];
  walk(mapSymbols, collect(symbols), ast, '');
  // Sort symbols into bins
  [main, internals, externals] = sortSymbols(symbols);
  // Extract storage/type signatures of symbols
  signatures = extractSignatures(main, internals, externals);
  if (debug) {
    tock('GLSL AST');
  }
  return {ast, code, signatures};
};

// Extract functions and external symbols from AST
mapSymbols = function(node, collect) {
  switch (node.type) {
    case 'decl':
      collect(decl.node(node));
      return false;
  }
  return true;
};

collect = function(out) {
  return function(value) {
    var j, len, obj, results;
    if (value != null) {
      results = [];
      for (j = 0, len = value.length; j < len; j++) {
        obj = value[j];
        results.push(out.push(obj));
      }
      return results;
    }
  };
};

// Identify internals, externals and main function
sortSymbols = function(symbols) {
  var e, externals, found, internals, j, len, main, maybe, s;
  main = null;
  internals = [];
  externals = [];
  maybe = {};
  found = false;
  for (j = 0, len = symbols.length; j < len; j++) {
    s = symbols[j];
    if (!s.body) {
      // Unmarked globals are definitely internal
      if (s.storage === 'global') {
        internals.push(s);
      } else {
        // Possible external
        externals.push(s);
        maybe[s.ident] = true;
      }
    } else {
      // Remove earlier forward declaration
      if (maybe[s.ident]) {
        externals = (function() {
          var k, len1, results;
          results = [];
          for (k = 0, len1 = externals.length; k < len1; k++) {
            e = externals[k];
            if (e.ident !== s.ident) {
              results.push(e);
            }
          }
          return results;
        })();
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
extractSignatures = function(main, internals, externals) {
  var def, defn, func, j, k, len, len1, sigs, symbol;
  sigs = {
    uniform: [],
    attribute: [],
    varying: [],
    external: [],
    internal: [],
    global: [],
    main: null
  };
  defn = function(symbol) {
    return decl.type(symbol.ident, symbol.type, symbol.quant, symbol.count, symbol.inout, symbol.storage);
  };
  func = function(symbol, inout) {
    var a, arg, b, d, def, inTypes, j, len, outTypes, signature, type;
    signature = (function() {
      var j, len, ref, results;
      ref = symbol.args;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        arg = ref[j];
        results.push(defn(arg));
      }
      return results;
    })();
// Split inouts into in and out
    for (j = 0, len = signature.length; j < len; j++) {
      d = signature[j];
      if (!(d.inout === decl.inout)) {
        continue;
      }
      a = d;
      b = d.copy();
      a.inout = decl.in;
      b.inout = decl.out;
      b.meta = {
        shadow: a.name
      };
      b.name += $.SHADOW_ARG;
      a.meta = {
        shadowed: b.name
      };
      signature.push(b);
    }
    // Add output for return type
    if (symbol.type !== 'void') {
      signature.unshift(decl.type($.RETURN_ARG, symbol.type, false, '', 'out'));
    }
    // Make type string
    inTypes = ((function() {
      var k, len1, results;
      results = [];
      for (k = 0, len1 = signature.length; k < len1; k++) {
        d = signature[k];
        if (d.inout === decl.in) {
          results.push(d.type);
        }
      }
      return results;
    })()).join(',');
    outTypes = ((function() {
      var k, len1, results;
      results = [];
      for (k = 0, len1 = signature.length; k < len1; k++) {
        d = signature[k];
        if (d.inout === decl.out) {
          results.push(d.type);
        }
      }
      return results;
    })()).join(',');
    type = `(${inTypes})(${outTypes})`;
    return def = {
      name: symbol.ident,
      type: type,
      signature: signature,
      inout: inout,
      spec: symbol.type
    };
  };
  // Main
  sigs.main = func(main, decl.out);
// Internals (for name replacement only)
  for (j = 0, len = internals.length; j < len; j++) {
    symbol = internals[j];
    sigs.internal.push({
      name: symbol.ident
    });
  }
// Externals
  for (k = 0, len1 = externals.length; k < len1; k++) {
    symbol = externals[k];
    switch (symbol.decl) {
      // Uniforms/attributes/varyings
      case 'external':
        def = defn(symbol);
        sigs[symbol.storage].push(def);
        break;
      // Callbacks
      case 'function':
        def = func(symbol, decl.in);
        sigs.external.push(def);
    }
  }
  return sigs;
};

// Walk AST, apply map and collect values
debug = false;

walk = function(map, collect, node, indent) {
  var child, i, j, len, recurse, ref, ref1, ref2;
  debug && console.log(indent, node.type, (ref = node.token) != null ? ref.data : void 0, (ref1 = node.token) != null ? ref1.type : void 0);
  recurse = map(node, collect);
  if (recurse) {
    ref2 = node.children;
    for (i = j = 0, len = ref2.length; j < len; i = ++j) {
      child = ref2[i];
      walk(map, collect, child, indent + '  ', debug);
    }
  }
  return null;
};

// #####
tick = function() {
  var now;
  now = +new Date();
  return function(label) {
    var delta;
    delta = +new Date() - now;
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
var Block, Factory, GLSL, Graph, Linker, ShaderGraph, Snippet, Visualize, cache, inspect, library, merge, visualize;

Block = require('./block');

Factory = require('./factory');

GLSL = require('./glsl');

Graph = require('./graph');

Linker = require('./linker');

Visualize = require('./visualize');

library = Factory.library;

cache = Factory.cache;

visualize = Visualize.visualize;

inspect = Visualize.inspect;

Snippet = Linker.Snippet;

merge = function(a, b = {}) {
  var key, out, ref, value;
  out = {};
  for (key in a) {
    value = a[key];
    out[key] = (ref = b[key]) != null ? ref : a[key];
  }
  return out;
};

ShaderGraph = (function() {
  class ShaderGraph {
    constructor(snippets, config) {
      var defaults;
      if (!(this instanceof ShaderGraph)) {
        return new ShaderGraph(snippets, config);
      }
      defaults = {
        globalUniforms: false,
        globalVaryings: true,
        globalAttributes: true,
        globals: [],
        autoInspect: false
      };
      this.config = merge(defaults, config);
      this.fetch = cache(library(GLSL, snippets, Snippet.load));
    }

    shader(config = {}) {
      var _config;
      _config = merge(this.config, config);
      return new Factory.Factory(GLSL, this.fetch, _config);
    }

    material(config) {
      return new Factory.Material(this.shader(config), this.shader(config));
    }

    inspect(shader) {
      return ShaderGraph.inspect(shader);
    }

    visualize(shader) {
      return ShaderGraph.visualize(shader);
    }

    // Static visualization method
    static inspect(shader) {
      return inspect(shader);
    }

    static visualize(shader) {
      return visualize(shader);
    }

  };

  // Expose class hierarchy
  ShaderGraph.Block = Block;

  ShaderGraph.Factory = Factory;

  ShaderGraph.GLSL = GLSL;

  ShaderGraph.Graph = Graph;

  ShaderGraph.Linker = Linker;

  ShaderGraph.Visualize = Visualize;

  return ShaderGraph;

}).call(this);

module.exports = ShaderGraph;

if (typeof window !== 'undefined') {
  window.ShaderGraph = ShaderGraph;
}


},{"./block":8,"./factory":14,"./glsl":22,"./graph":25,"./linker":30,"./visualize":36}],29:[function(require,module,exports){

/*
  Program assembler

  Builds composite program that can act as new module/snippet
  Unconnected input/outputs and undefined callbacks are exposed in the new global/main scope
  If there is only one call with an identical call signature, a #define is output instead.
*/
var Graph, Priority, assemble;

Graph = require('../graph');

Priority = require('./priority');

assemble = function(language, namespace, calls, requires) {
  var adopt, attributes, externals, generate, handle, include, isDangling, library, lookup, process, required, symbols, uniforms, varyings;
  generate = language.generate;
  externals = {};
  symbols = [];
  uniforms = {};
  varyings = {};
  attributes = {};
  library = {};
  process = function() {
    var body, code, includes, lib, main, ns, r, sorted;
    for (ns in requires) {
      r = requires[ns];
      required(r.node, r.module);
    }
    [body, calls] = handle(calls);
    if (namespace != null) {
      body.entry = namespace;
    }
    main = generate.build(body, calls);
    sorted = ((function() {
      var results;
      results = [];
      for (ns in library) {
        lib = library[ns];
        results.push(lib);
      }
      return results;
    })()).sort(function(a, b) {
      return Priority.compare(a.priority, b.priority);
    });
    includes = sorted.map(function(x) {
      return x.code;
    });
    includes.push(main.code);
    code = generate.lines(includes);
    return {
      // Build new virtual snippet
      namespace: main.name,
      library: library, // Included library functions
      body: main.code, // Snippet body
      code: code, // Complete snippet (tests/debug)
      main: main, // Function signature
      entry: main.name, // Entry point name
      symbols: symbols,
      externals: externals,
      uniforms: uniforms,
      varyings: varyings,
      attributes: attributes
    };
  };
  // Sort and process calls
  handle = (calls) => {
    var body, c, call, i, len, ns;
    calls = (function() {
      var results;
      results = [];
      for (ns in calls) {
        c = calls[ns];
        results.push(c);
      }
      return results;
    })();
    calls.sort(function(a, b) {
      return b.priority - a.priority;
    });
    // Call module in DAG chain
    call = (node, module, priority) => {
      var _dangling, _lookup, entry, main;
      include(node, module, priority);
      main = module.main;
      entry = module.entry;
      _lookup = function(name) {
        return lookup(node, name);
      };
      _dangling = function(name) {
        return isDangling(node, name);
      };
      return generate.call(_lookup, _dangling, entry, main.signature, body);
    };
    body = generate.body();
    for (i = 0, len = calls.length; i < len; i++) {
      c = calls[i];
      call(c.node, c.module, c.priority);
    }
    return [body, calls];
  };
  // Adopt given code as a library at given priority
  adopt = function(namespace, code, priority) {
    var record;
    record = library[namespace];
    if (record != null) {
      return record.priority = Priority.max(record.priority, priority);
    } else {
      return library[namespace] = {code, priority};
    }
  };
  // Include snippet for a call
  include = function(node, module, priority) {
    var def, key, lib, ns, ref, ref1, ref2, ref3;
    priority = Priority.make(priority);
    ref = module.library;
    for (ns in ref) {
      lib = ref[ns];
      // Adopt snippet's libraries
      adopt(ns, lib.code, Priority.nest(priority, lib.priority));
    }
    // Adopt snippet body as library
    adopt(module.namespace, module.body, priority);
    ref1 = module.uniforms;
    for (key in ref1) {
      def = ref1[key];
      // Adopt GL vars
      (uniforms[key] = def);
    }
    ref2 = module.varyings;
    for (key in ref2) {
      def = ref2[key];
      (varyings[key] = def);
    }
    ref3 = module.attributes;
    for (key in ref3) {
      def = ref3[key];
      (attributes[key] = def);
    }
    return required(node, module);
  };
  required = function(node, module) {
    var copy, ext, i, k, key, len, ref, results, v;
    ref = module.symbols;
    // Adopt external symbols
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      key = ref[i];
      ext = module.externals[key];
      if (isDangling(node, ext.name)) {
        copy = {};
        for (k in ext) {
          v = ext[k];
          copy[k] = v;
        }
        copy.name = lookup(node, ext.name);
        externals[key] = copy;
        results.push(symbols.push(key));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };
  // Check for dangling input/output
  isDangling = function(node, name) {
    var outlet;
    outlet = node.get(name);
    if (outlet.inout === Graph.IN) {
      return outlet.input === null;
    } else if (outlet.inout === Graph.OUT) {
      return outlet.output.length === 0;
    }
  };
  // Look up unique name for outlet
  lookup = function(node, name) {
    var outlet;
    // Traverse graph edge
    outlet = node.get(name);
    if (!outlet) {
      return null;
    }
    if (outlet.input) {
      outlet = outlet.input;
    }
    name = outlet.name;
    return outlet.id;
  };
  return process();
};

module.exports = assemble;


},{"../graph":25,"./priority":33}],30:[function(require,module,exports){
exports.Snippet = require('./snippet');

exports.Program = require('./program');

exports.Layout = require('./layout');

exports.assemble = require('./assemble');

exports.link = require('./link');

exports.priority = require('./priority');

exports.load = exports.Snippet.load;


},{"./assemble":29,"./layout":31,"./link":32,"./priority":33,"./program":34,"./snippet":35}],31:[function(require,module,exports){
var Layout, Snippet, debug, link;

Snippet = require('./snippet');

link = require('./link');

debug = false;

/*
  Program linkage layout

  Entry points are added to its dependency graph
  Callbacks are linked either with a go-between function
  or a #define if the signatures are identical.
*/
Layout = class Layout {
  constructor(language, graph) {
    this.language = language;
    this.graph = graph;
    this.links = [];
    this.includes = [];
    this.modules = {};
    this.visits = {};
  }

  // Link up a given named external to this module's entry point
  callback(node, module, priority, name, external) {
    return this.links.push({node, module, priority, name, external});
  }

  // Include this module of code
  include(node, module, priority) {
    var m;
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
    if (this.visits[namespace]) {
      return false;
    }
    return this.visits[namespace] = true;
  }

  // Compile queued ops into result
  link(module) {
    var data, key, snippet;
    data = link(this.language, this.links, this.includes, module);
    snippet = new Snippet();
    for (key in data) {
      snippet[key] = data[key];
    }
    snippet.graph = this.graph;
    return snippet;
  }

};

module.exports = Layout;


},{"./link":32,"./snippet":35}],32:[function(require,module,exports){

/*
 Callback linker

 Imports given modules and generates linkages for registered callbacks.

 Builds composite program with single module as exported entry point
*/
var Graph, Priority, link;

Graph = require('../graph');

Priority = require('./priority');

link = function(language, links, modules, exported) {
  var adopt, attributes, externals, generate, include, includes, isDangling, library, process, symbols, uniforms, varyings;
  generate = language.generate;
  includes = [];
  symbols = [];
  externals = {};
  uniforms = {};
  attributes = {};
  varyings = {};
  library = {};
  process = function() {
    var code, e, exports, header, i, len, lib, m, ns, sorted;
    exports = generate.links(links);
    header = [];
    if (exports.defs != null) {
      header.push(exports.defs);
    }
    if (exports.bodies != null) {
      header.push(exports.bodies);
    }
    for (i = 0, len = modules.length; i < len; i++) {
      m = modules[i];
      include(m.node, m.module, m.priority);
    }
    sorted = ((function() {
      var results;
      results = [];
      for (ns in library) {
        lib = library[ns];
        results.push(lib);
      }
      return results;
    })()).sort(function(a, b) {
      return Priority.compare(a.priority, b.priority);
    });
    includes = sorted.map(function(x) {
      return x.code;
    });
    code = generate.lines(includes);
    code = generate.defuse(code);
    if (header.length) {
      code = [generate.lines(header), code].join("\n");
    }
    code = generate.hoist(code);
    code = generate.dedupe(code);
    // Export module's externals
    e = exported;
    return {
      namespace: e.main.name,
      code: code, // Complete snippet (tests/debug)
      main: e.main, // Function signature
      entry: e.main.name, // Entry point name
      externals: externals,
      uniforms: uniforms,
      attributes: attributes,
      varyings: varyings
    };
  };
  // Adopt given code as a library at given priority
  adopt = function(namespace, code, priority) {
    var record;
    record = library[namespace];
    if (record != null) {
      return record.priority = Priority.max(record.priority, priority);
    } else {
      return library[namespace] = {code, priority};
    }
  };
  // Include piece of code
  include = function(node, module, priority) {
    var def, ext, i, key, len, lib, ns, ref, ref1, ref2, ref3, ref4, results;
    priority = Priority.make(priority);
    ref = module.library;
    for (ns in ref) {
      lib = ref[ns];
      // Adopt snippet's libraries
      adopt(ns, lib.code, Priority.nest(priority, lib.priority));
    }
    // Adopt snippet body as library
    adopt(module.namespace, module.body, priority);
    ref1 = module.uniforms;
    for (key in ref1) {
      def = ref1[key];
      // Adopt externals
      (uniforms[key] = def);
    }
    ref2 = module.varyings;
    for (key in ref2) {
      def = ref2[key];
      (varyings[key] = def);
    }
    ref3 = module.attributes;
    for (key in ref3) {
      def = ref3[key];
      (attributes[key] = def);
    }
    ref4 = module.symbols;
    results = [];
    for (i = 0, len = ref4.length; i < len; i++) {
      key = ref4[i];
      ext = module.externals[key];
      if (isDangling(node, ext.name)) {
        externals[key] = ext;
        results.push(symbols.push(key));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };
  // Check for dangling input/output
  isDangling = function(node, name) {
    var module, outlet, ref, ref1;
    outlet = node.get(name);
    if (!outlet) {
      module = (ref = (ref1 = node.owner.snippet) != null ? ref1._name : void 0) != null ? ref : node.owner.namespace;
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
exports.make = function(x) {
  var ref;
  if (x == null) {
    x = [];
  }
  if (!(x instanceof Array)) {
    x = [(ref = +x) != null ? ref : 0];
  }
  return x;
};

exports.nest = function(a, b) {
  return a.concat(b);
};

exports.compare = function(a, b) {
  var i, j, n, p, q, ref;
  n = Math.min(a.length, b.length);
  for (i = j = 0, ref = n; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
    p = a[i];
    q = b[i];
    if (p > q) {
      return -1;
    }
    if (p < q) {
      return 1;
    }
  }
  a = a.length;
  b = b.length;
  if (a > b) {
    return -1;
  } else if (a < b) {
    return 1;
  } else {
    return 0;
  }
};

exports.max = function(a, b) {
  if (exports.compare(a, b) > 0) {
    return b;
  } else {
    return a;
  }
};


},{}],34:[function(require,module,exports){

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
var Program, Snippet, assemble;

Snippet = require('./snippet');

assemble = require('./assemble');

Program = (function() {
  class Program {
    static entry() {
      return `_pg_${++Program.index}_`;
    }

    // Program starts out empty, ready to compile starting from a particular block
    constructor(language, namespace, graph) {
      this.language = language;
      this.namespace = namespace;
      this.graph = graph;
      this.calls = {};
      this.requires = {};
    }

    // Call a given module at certain priority
    call(node, module, priority) {
      var exists, ns;
      ns = module.namespace;
      // Merge all calls down into one with the right priority
      if (exists = this.calls[ns]) {
        exists.priority = Math.max(exists.priority, priority);
      } else {
        this.calls[ns] = {node, module, priority};
      }
      return this;
    }

    // Require a given (callback) module's externals
    require(node, module) {
      var ns;
      ns = module.namespace;
      return this.requires[ns] = {node, module};
    }

    // Compile queued ops into result
    assemble() {
      var data, key, ref, snippet;
      data = assemble(this.language, (ref = this.namespace) != null ? ref : Program.entry, this.calls, this.requires);
      snippet = new Snippet();
      for (key in data) {
        snippet[key] = data[key];
      }
      snippet.graph = this.graph;
      return snippet;
    }

  };

  Program.index = 0;

  return Program;

}).call(this);

module.exports = Program;


},{"./assemble":29,"./snippet":35}],35:[function(require,module,exports){
var Snippet;

Snippet = (function() {
  class Snippet {
    static namespace() {
      return `_sn_${++Snippet.index}_`;
    }

    static load(language, name, code) {
      var compiler, program, sigs;
      program = language.parse(name, code);
      [sigs, compiler] = language.compile(program);
      return new Snippet(language, sigs, compiler, name, code);
    }

    constructor(language1, _signatures, _compiler, _name, _original) {
      var ref;
      this.language = language1;
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
      if (!this.language) {
        // Tidy up object for export
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
      if (!this._name) {
        // Insert snippet name if not provided
        this._name = (ref = this._signatures) != null ? ref.main.name : void 0;
      }
    }

    clone() {
      return new Snippet(this.language, this._signatures, this._compiler, this._name, this._original);
    }

    bind(config, uniforms, namespace, defines) {
      var _a, _e, _u, _v, a, def, defs, e, exceptions, exist, global, i, j, k, key, l, len, len1, len2, len3, len4, len5, local, m, n, name, o, redef, ref, ref1, ref2, ref3, ref4, ref5, ref6, u, v, x;
      // Alt syntax (namespace, uniforms, defines)
      if (uniforms === '' + uniforms) {
        [namespace, uniforms, defines] = [uniforms, namespace != null ? namespace : {}, defines != null ? defines : {}];
      // Alt syntax (uniforms, defines)
      } else if (namespace !== '' + namespace) {
        [defines, namespace] = [namespace != null ? namespace : {}, void 0];
      }
      // Prepare data structure
      this.main = this._signatures.main;
      this.namespace = (ref = namespace != null ? namespace : this.namespace) != null ? ref : Snippet.namespace();
      this.entry = this.namespace + this.main.name;
      this.uniforms = {};
      this.varyings = {};
      this.attributes = {};
      this.externals = {};
      this.symbols = [];
      exist = {};
      exceptions = {};
      // Handle globals and locals for prefixing
      global = function(name) {
        exceptions[name] = true;
        return name;
      };
      local = (name) => {
        return this.namespace + name;
      };
      if (config.globals) {
        ref1 = config.globals;
        for (i = 0, len = ref1.length; i < len; i++) {
          key = ref1[i];
          // Apply config
          global(key);
        }
      }
      _u = config.globalUniforms ? global : local;
      _v = config.globalVaryings ? global : local;
      _a = config.globalAttributes ? global : local;
      _e = local;
      // Build finalized properties
      x = (def) => {
        return exist[def.name] = true;
      };
      u = (def, name) => {
        return this.uniforms[_u(name != null ? name : def.name)] = def;
      };
      v = (def) => {
        return this.varyings[_v(def.name)] = def;
      };
      a = (def) => {
        return this.attributes[_a(def.name)] = def;
      };
      e = (def) => {
        var name;
        name = _e(def.name);
        this.externals[name] = def;
        return this.symbols.push(name);
      };
      redef = function(def) {
        return {
          type: def.type,
          name: def.name,
          value: def.value
        };
      };
      ref2 = this._signatures.uniform;
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        def = ref2[j];
        x(def);
      }
      ref3 = this._signatures.uniform;
      for (l = 0, len2 = ref3.length; l < len2; l++) {
        def = ref3[l];
        u(redef(def));
      }
      ref4 = this._signatures.varying;
      for (m = 0, len3 = ref4.length; m < len3; m++) {
        def = ref4[m];
        v(redef(def));
      }
      ref5 = this._signatures.external;
      for (n = 0, len4 = ref5.length; n < len4; n++) {
        def = ref5[n];
        e(def);
      }
      ref6 = this._signatures.attribute;
      for (o = 0, len5 = ref6.length; o < len5; o++) {
        def = ref6[o];
        a(redef(def));
      }
      for (name in uniforms) {
        def = uniforms[name];
        if (exist[name]) {
          u(def, name);
        }
      }
      this.body = this.code = this._compiler(this.namespace, exceptions, defines);
      // Adds defs to original snippet for inspection
      if (defines) {
        defs = ((function() {
          var results;
          results = [];
          for (k in defines) {
            v = defines[k];
            results.push(`#define ${k} ${v}`);
          }
          return results;
        })()).join('\n');
        if (defs.length) {
          this._original = [defs, "//----------------------------------------", this._original].join("\n");
        }
      }
      return null;
    }

  };

  Snippet.index = 0;

  return Snippet;

}).call(this);

module.exports = Snippet;


},{}],36:[function(require,module,exports){
var Graph, markup, merge, resolve, serialize, visualize;

Graph = require('../Graph').Graph;

exports.serialize = serialize = require('./serialize');

exports.markup = markup = require('./markup');

visualize = function(graph) {
  var data;
  if (!graph) {
    return;
  }
  if (!graph.nodes) {
    return graph;
  }
  data = serialize(graph);
  return markup.process(data);
};

resolve = function(arg) {
  if (arg == null) {
    return arg;
  }
  if (arg instanceof Array) {
    return arg.map(resolve);
  }
  if ((arg.vertex != null) && (arg.fragment != null)) {
    return [resolve(arg.vertex, resolve(arg.fragment))];
  }
  if (arg._graph != null) {
    return arg._graph;
  }
  if (arg.graph != null) {
    return arg.graph;
  }
  return arg;
};

merge = function(args) {
  var arg, i, len, out;
  out = [];
  for (i = 0, len = args.length; i < len; i++) {
    arg = args[i];
    if (arg instanceof Array) {
      out = out.concat(merge(arg));
    } else if (arg != null) {
      out.push(arg);
    }
  }
  return out;
};

exports.visualize = function() {
  var graph, list;
  list = merge(resolve([].slice.call(arguments)));
  return markup.merge((function() {
    var i, len, results;
    results = [];
    for (i = 0, len = list.length; i < len; i++) {
      graph = list[i];
      if (graph) {
        results.push(visualize(graph));
      }
    }
    return results;
  })());
};

exports.inspect = function() {
  var contents, el, element, i, len, ref;
  contents = exports.visualize.apply(null, arguments);
  element = markup.overlay(contents);
  ref = document.querySelectorAll('.shadergraph-overlay');
  for (i = 0, len = ref.length; i < len; i++) {
    el = ref[i];
    el.remove();
  }
  document.body.appendChild(element);
  contents.update();
  return element;
};


},{"../Graph":2,"./markup":37,"./serialize":38}],37:[function(require,module,exports){
var _activate, _markup, _order, connect, cssColor, escapeText, hash, hashColor, makeSVG, merge, overlay, path, process, sqr, trim, wrap;

hash = require('../factory/hash');

trim = function(string) {
  return ("" + string).replace(/^\s+|\s+$/g, '');
};

cssColor = function(r, g, b, alpha) {
  return 'rgba(' + [r, g, b, alpha].join(', ') + ')';
};

hashColor = function(string, alpha = 1) {
  var b, color, g, max, min, norm, r;
  color = hash(string) ^ 0x123456;
  r = color & 0xFF;
  g = (color >>> 8) & 0xFF;
  b = (color >>> 16) & 0xFF;
  max = Math.max(r, g, b);
  norm = 140 / max;
  min = Math.round(max / 3);
  r = Math.min(255, Math.round(norm * Math.max(r, min)));
  g = Math.min(255, Math.round(norm * Math.max(g, min)));
  b = Math.min(255, Math.round(norm * Math.max(b, min)));
  return cssColor(r, g, b, alpha);
};

escapeText = function(string) {
  string = string != null ? string : "";
  return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
};

process = function(data) {
  var el, links;
  links = [];
  el = _markup(data, links);
  el.update = function() {
    return connect(el, links);
  };
  _activate(el);
  return el;
};

_activate = function(el) {
  var code, codes, i, len, results;
  codes = el.querySelectorAll('.shadergraph-code');
  results = [];
  for (i = 0, len = codes.length; i < len; i++) {
    code = codes[i];
    results.push((function() {
      var popup;
      popup = code;
      popup.parentNode.classList.add('shadergraph-has-code');
      return popup.parentNode.addEventListener('click', function(event) {
        return popup.style.display = {
          block: 'none',
          none: 'block'
        }[popup.style.display || 'none'];
      });
    })());
  }
  return results;
};

_order = function(data) {
  var i, j, k, len, len1, len2, link, linkMap, name, node, nodeMap, recurse, ref1, ref2, ref3;
  nodeMap = {};
  linkMap = {};
  ref1 = data.nodes;
  for (i = 0, len = ref1.length; i < len; i++) {
    node = ref1[i];
    nodeMap[node.id] = node;
  }
  ref2 = data.links;
  for (j = 0, len1 = ref2.length; j < len1; j++) {
    link = ref2[j];
    if (linkMap[name = link.from] == null) {
      linkMap[name] = [];
    }
    linkMap[link.from].push(link);
  }
  recurse = function(node, depth = 0) {
    var k, len2, next, ref3;
    node.depth = Math.max((ref3 = node.depth) != null ? ref3 : 0, depth);
    if (next = linkMap[node.id]) {
      for (k = 0, len2 = next.length; k < len2; k++) {
        link = next[k];
        recurse(nodeMap[link.to], depth + 1);
      }
    }
    return null;
  };
  ref3 = data.nodes;
  for (k = 0, len2 = ref3.length; k < len2; k++) {
    node = ref3[k];
    if (node.depth == null) {
      recurse(node);
    }
  }
  return null;
};

_markup = function(data, links) {
  var addOutlet, block, clear, color, column, columns, div, i, j, k, l, len, len1, len2, len3, len4, link, m, node, outlet, outlets, ref1, ref2, ref3, ref4, wrapper;
  _order(data);
  wrapper = document.createElement('div');
  wrapper.classList.add('shadergraph-graph');
  columns = [];
  outlets = {};
  ref1 = data.nodes;
  for (i = 0, len = ref1.length; i < len; i++) {
    node = ref1[i];
    block = document.createElement('div');
    block.classList.add("shadergraph-node");
    block.classList.add(`shadergraph-node-${node.type}`);
    block.innerHTML = `<div class="shadergraph-header">${escapeText(node.name)}</div>`;
    addOutlet = function(outlet, inout) {
      var color, div;
      color = hashColor(outlet.type);
      div = document.createElement('div');
      div.classList.add('shadergraph-outlet');
      div.classList.add(`shadergraph-outlet-${inout}`);
      div.innerHTML = `<div class="shadergraph-point" style="background: ${color}"></div>
<div class="shadergraph-type" style="color: ${color}">${escapeText(outlet.type)}</div>
<div class="shadergraph-name">${escapeText(outlet.name)}</div>`;
      block.appendChild(div);
      return outlets[outlet.id] = div.querySelector('.shadergraph-point');
    };
    ref2 = node.inputs;
    for (j = 0, len1 = ref2.length; j < len1; j++) {
      outlet = ref2[j];
      addOutlet(outlet, 'in');
    }
    ref3 = node.outputs;
    for (k = 0, len2 = ref3.length; k < len2; k++) {
      outlet = ref3[k];
      addOutlet(outlet, 'out');
    }
    if (node.graph != null) {
      block.appendChild(_markup(node.graph, links));
    } else {
      clear = document.createElement('div');
      clear.classList.add('shadergraph-clear');
      block.appendChild(clear);
    }
    if (node.code != null) {
      div = document.createElement('div');
      div.classList.add('shadergraph-code');
      div.innerHTML = escapeText(trim(node.code));
      block.appendChild(div);
    }
    column = columns[node.depth];
    if (column == null) {
      column = document.createElement('div');
      column.classList.add('shadergraph-column');
      columns[node.depth] = column;
    }
    column.appendChild(block);
  }
  for (l = 0, len3 = columns.length; l < len3; l++) {
    column = columns[l];
    if (column != null) {
      wrapper.appendChild(column);
    }
  }
  ref4 = data.links;
  for (m = 0, len4 = ref4.length; m < len4; m++) {
    link = ref4[m];
    color = hashColor(link.type);
    links.push({
      color: color,
      out: outlets[link.out],
      in: outlets[link.in]
    });
  }
  return wrapper;
};

sqr = function(x) {
  return x * x;
};

path = function(x1, y1, x2, y2) {
  var d, dx, dy, f, h, mx, my, vert;
  dx = x2 - x1;
  dy = y2 - y1;
  d = Math.sqrt(sqr(dx) + sqr(dy));
  vert = Math.abs(dy) > Math.abs(dx);
  if (vert) {
    mx = (x1 + x2) / 2;
    my = (y1 + y2) / 2;
    f = dy > 0 ? .3 : -.3;
    h = Math.min(Math.abs(dx) / 2, 20 + d / 8);
    return ['M', x1, y1, 'C', x1 + h, y1 + ',', mx, my - d * f, mx, my, 'C', mx, my + d * f, x2 - h, y2 + ',', x2, y2].join(' ');
  } else {
    h = Math.min(Math.abs(dx) / 2.5, 20 + d / 4);
    return ['M', x1, y1, 'C', x1 + h, y1 + ',', x2 - h, y2 + ',', x2, y2].join(' ');
  }
};

makeSVG = function(tag = 'svg') {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
};

connect = function(element, links) {
  var a, b, box, c, i, j, len, len1, line, link, ref, svg;
  if (element.parentNode == null) {
    return;
  }
  ref = element.getBoundingClientRect();
  for (i = 0, len = links.length; i < len; i++) {
    link = links[i];
    a = link.out.getBoundingClientRect();
    b = link.in.getBoundingClientRect();
    link.coords = {
      x1: (a.left + a.right) / 2 - ref.left,
      y1: (a.top + a.bottom) / 2 - ref.top,
      x2: (b.left + b.right) / 2 - ref.left,
      y2: (b.top + b.bottom) / 2 - ref.top
    };
  }
  svg = element.querySelector('svg');
  if (svg != null) {
    element.removeChild(svg);
  }
  box = element;
  while (box.parentNode && box.offsetHeight === 0) {
    box = box.parentNode;
  }
  svg = makeSVG();
  svg.setAttribute('width', box.offsetWidth);
  svg.setAttribute('height', box.offsetHeight);
  for (j = 0, len1 = links.length; j < len1; j++) {
    link = links[j];
    c = link.coords;
    line = makeSVG('path');
    line.setAttribute('d', path(c.x1, c.y1, c.x2, c.y2));
    line.setAttribute('stroke', link.color);
    line.setAttribute('stroke-width', 3);
    line.setAttribute('fill', 'transparent');
    svg.appendChild(line);
  }
  return element.appendChild(svg);
};

overlay = function(contents) {
  var close, div, inside, view;
  div = document.createElement('div');
  div.setAttribute('class', 'shadergraph-overlay');
  close = document.createElement('div');
  close.setAttribute('class', 'shadergraph-close');
  close.innerHTML = '&times;';
  view = document.createElement('div');
  view.setAttribute('class', 'shadergraph-view');
  inside = document.createElement('div');
  inside.setAttribute('class', 'shadergraph-inside');
  inside.appendChild(contents);
  view.appendChild(inside);
  div.appendChild(view);
  div.appendChild(close);
  close.addEventListener('click', function() {
    return div.parentNode.removeChild(div);
  });
  return div;
};

wrap = function(markup) {
  var p;
  if (markup instanceof Node) {
    return markup;
  }
  p = document.createElement('span');
  p.innerText = markup != null ? markup : '';
  return p;
};

merge = function(markup) {
  var div, el, i, len;
  if (markup.length !== 1) {
    div = document.createElement('div');
    for (i = 0, len = markup.length; i < len; i++) {
      el = markup[i];
      div.appendChild(wrap(el));
    }
    div.update = function() {
      var j, len1, results;
      results = [];
      for (j = 0, len1 = markup.length; j < len1; j++) {
        el = markup[j];
        results.push(typeof el.update === "function" ? el.update() : void 0);
      }
      return results;
    };
    return div;
  } else {
    return wrap(markup[0]);
  }
};

module.exports = {process, merge, overlay};


},{"../factory/hash":13}],38:[function(require,module,exports){
// Dump graph for debug/visualization purposes
var Block, isCallback, serialize;

Block = require('../block');

isCallback = function(outlet) {
  return outlet.type[0] === '(';
};

serialize = function(graph) {
  var block, format, i, inputs, j, k, l, len, len1, len2, len3, links, node, nodes, other, outlet, outputs, record, ref, ref1, ref2, ref3, ref4;
  nodes = [];
  links = [];
  ref = graph.nodes;
  for (i = 0, len = ref.length; i < len; i++) {
    node = ref[i];
    record = {
      // Data
      id: node.id,
      name: null,
      type: null,
      depth: null,
      graph: null,
      inputs: [],
      outputs: []
    };
    nodes.push(record);
    inputs = record.inputs;
    outputs = record.outputs;
    block = node.owner;
    if (block instanceof Block.Call) {
      record.name = block.snippet._name;
      record.type = 'call';
      record.code = block.snippet._original;
    } else if (block instanceof Block.Callback) {
      record.name = "Callback";
      record.type = 'callback';
      record.graph = serialize(block.graph);
    } else if (block instanceof Block.Isolate) {
      record.name = 'Isolate';
      record.type = 'isolate';
      record.graph = serialize(block.graph);
    } else if (block instanceof Block.Join) {
      record.name = 'Join';
      record.type = 'join';
    } else if (block != null) {
      if (record.name == null) {
        record.name = (ref1 = block.name) != null ? ref1 : block.type;
      }
      if (record.type == null) {
        record.type = block.type;
      }
      if (record.code == null) {
        record.code = block.code;
      }
      if (block.graph != null) {
        record.graph = serialize(block.graph);
      }
    }
    format = function(type) {
      type = type.replace(")(", ")→(");
      return type = type.replace("()", "");
    };
    ref2 = node.inputs;
    for (j = 0, len1 = ref2.length; j < len1; j++) {
      outlet = ref2[j];
      inputs.push({
        id: outlet.id,
        name: outlet.name,
        type: format(outlet.type),
        open: outlet.input == null
      });
    }
    ref3 = node.outputs;
    for (k = 0, len2 = ref3.length; k < len2; k++) {
      outlet = ref3[k];
      outputs.push({
        id: outlet.id,
        name: outlet.name,
        type: format(outlet.type),
        open: !outlet.output.length
      });
      ref4 = outlet.output;
      for (l = 0, len3 = ref4.length; l < len3; l++) {
        other = ref4[l];
        links.push({
          from: node.id,
          out: outlet.id,
          to: other.node.id,
          in: other.id,
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
// Synchronous stream wrapper for glsl tokenizer/parser
var through;

through = function(write, end) {
  var errors, output;
  output = [];
  errors = [];
  return {
    output: output,
    parser: null,
    write: write,
    end: end,
    process: function(parser, data) {
      this.parser = parser;
      write(data);
      this.flush();
      return this.parser.flush();
    },
    flush: function() {
      end();
      return [output, errors];
    },
    // From tokenizer
    queue: function(obj) {
      var ref;
      if (obj != null) {
        return (ref = this.parser) != null ? ref.write(obj) : void 0;
      }
    },
    // From parser
    emit: function(type, node) {
      if (type === 'data') {
        if (node.parent == null) {
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
