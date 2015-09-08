(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/*
  Graph of nodes with outlets
 */
var Graph;

Graph = (function() {
  Graph.index = 0;

  Graph.id = function(name) {
    return ++Graph.index;
  };

  Graph.IN = 0;

  Graph.OUT = 1;

  function Graph(nodes, parent) {
    this.parent = parent != null ? parent : null;
    this.id = Graph.id();
    this.nodes = [];
    nodes && this.add(nodes);
  }

  Graph.prototype.inputs = function() {
    var inputs, node, outlet, _i, _j, _len, _len1, _ref, _ref1;
    inputs = [];
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _ref1 = node.inputs;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        outlet = _ref1[_j];
        if (outlet.input === null) {
          inputs.push(outlet);
        }
      }
    }
    return inputs;
  };

  Graph.prototype.outputs = function() {
    var node, outlet, outputs, _i, _j, _len, _len1, _ref, _ref1;
    outputs = [];
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _ref1 = node.outputs;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        outlet = _ref1[_j];
        if (outlet.output.length === 0) {
          outputs.push(outlet);
        }
      }
    }
    return outputs;
  };

  Graph.prototype.getIn = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.inputs();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Graph.prototype.getOut = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.outputs();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Graph.prototype.add = function(node, ignore) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
        this.add(_node);
      }
      return;
    }
    if (node.graph && !ignore) {
      throw new Error("Adding node to two graphs at once");
    }
    node.graph = this;
    return this.nodes.push(node);
  };

  Graph.prototype.remove = function(node, ignore) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
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
  };

  Graph.prototype.adopt = function(node) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
        this.adopt(_node);
      }
      return;
    }
    node.graph.remove(node, true);
    return this.add(node, true);
  };

  return Graph;

})();

module.exports = Graph;


},{}],2:[function(require,module,exports){
exports.Graph = require('./graph');

exports.Node = require('./node');

exports.Outlet = require('./outlet');

exports.IN = exports.Graph.IN;

exports.OUT = exports.Graph.OUT;


},{"./graph":1,"./node":3,"./outlet":4}],3:[function(require,module,exports){
var Graph, Node, Outlet;

Graph = require('./graph');

Outlet = require('./outlet');


/*
 Node in graph.
 */

Node = (function() {
  Node.index = 0;

  Node.id = function(name) {
    return ++Node.index;
  };

  function Node(owner, outlets) {
    this.owner = owner;
    this.graph = null;
    this.inputs = [];
    this.outputs = [];
    this.all = [];
    this.outlets = null;
    this.id = Node.id();
    this.setOutlets(outlets);
  }

  Node.prototype.getIn = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.inputs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Node.prototype.getOut = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.outputs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Node.prototype.get = function(name) {
    return this.getIn(name) || this.getOut(name);
  };

  Node.prototype.setOutlets = function(outlets) {
    var existing, hash, key, match, outlet, _i, _j, _k, _len, _len1, _len2, _ref;
    if (outlets != null) {
      if (this.outlets == null) {
        this.outlets = {};
        for (_i = 0, _len = outlets.length; _i < _len; _i++) {
          outlet = outlets[_i];
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
        return;
      }
      hash = function(outlet) {
        return [outlet.name, outlet.inout, outlet.type].join('-');
      };
      match = {};
      for (_j = 0, _len1 = outlets.length; _j < _len1; _j++) {
        outlet = outlets[_j];
        match[hash(outlet)] = true;
      }
      _ref = this.outlets;
      for (key in _ref) {
        outlet = _ref[key];
        key = hash(outlet);
        if (match[key]) {
          match[key] = outlet;
        } else {
          this._remove(outlet);
        }
      }
      for (_k = 0, _len2 = outlets.length; _k < _len2; _k++) {
        outlet = outlets[_k];
        existing = match[hash(outlet)];
        if (existing instanceof Outlet) {
          this._morph(existing, outlet);
        } else {
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
      }
      this;
    }
    return this.outlets;
  };

  Node.prototype.connect = function(node, empty, force) {
    var dest, dests, hint, hints, list, outlets, source, sources, type, typeHint, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    outlets = {};
    hints = {};
    typeHint = function(outlet) {
      return type + '/' + outlet.hint;
    };
    _ref = node.inputs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dest = _ref[_i];
      if (!force && dest.input) {
        continue;
      }
      type = dest.type;
      hint = typeHint(dest);
      if (!hints[hint]) {
        hints[hint] = dest;
      }
      outlets[type] = list = outlets[type] || [];
      list.push(dest);
    }
    sources = this.outputs;
    sources = sources.filter(function(outlet) {
      return !(empty && outlet.output.length);
    });
    _ref1 = sources.slice();
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      source = _ref1[_j];
      type = source.type;
      hint = typeHint(source);
      dests = outlets[type];
      if (dest = hints[hint]) {
        source.connect(dest);
        delete hints[hint];
        dests.splice(dests.indexOf(dest), 1);
        sources.splice(sources.indexOf(source), 1);
      }
    }
    if (!sources.length) {
      return this;
    }
    _ref2 = sources.slice();
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      source = _ref2[_k];
      type = source.type;
      dests = outlets[type];
      if (dests && dests.length) {
        source.connect(dests.shift());
      }
    }
    return this;
  };

  Node.prototype.disconnect = function(node) {
    var outlet, _i, _j, _len, _len1, _ref, _ref1;
    _ref = this.inputs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      outlet.disconnect();
    }
    _ref1 = this.outputs;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      outlet = _ref1[_j];
      outlet.disconnect();
    }
    return this;
  };

  Node.prototype._key = function(outlet) {
    return [outlet.name, outlet.inout].join('-');
  };

  Node.prototype._add = function(outlet) {
    var key;
    key = this._key(outlet);
    if (outlet.node) {
      throw new Error("Adding outlet to two nodes at once.");
    }
    if (this.outlets[key]) {
      throw new Error("Adding two identical outlets to same node. (" + key + ")");
    }
    outlet.node = this;
    if (outlet.inout === Graph.IN) {
      this.inputs.push(outlet);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.push(outlet);
    }
    this.all.push(outlet);
    return this.outlets[key] = outlet;
  };

  Node.prototype._morph = function(existing, outlet) {
    var key;
    key = this._key(outlet);
    delete this.outlets[key];
    existing.morph(outlet);
    key = this._key(outlet);
    return this.outlets[key] = outlet;
  };

  Node.prototype._remove = function(outlet) {
    var inout, key;
    key = this._key(outlet);
    inout = outlet.inout;
    if (outlet.node !== this) {
      throw new Error("Removing outlet from wrong node.");
    }
    outlet.disconnect();
    outlet.node = null;
    delete this.outlets[key];
    if (outlet.inout === Graph.IN) {
      this.inputs.splice(this.inputs.indexOf(outlet), 1);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.splice(this.outputs.indexOf(outlet), 1);
    }
    this.all.splice(this.all.indexOf(outlet), 1);
    return this;
  };

  return Node;

})();

module.exports = Node;


},{"./graph":1,"./outlet":4}],4:[function(require,module,exports){
var Graph, Outlet;

Graph = require('./graph');


/*
  In/out outlet on node
 */

Outlet = (function() {
  Outlet.make = function(outlet, extra) {
    var key, meta, value, _ref;
    if (extra == null) {
      extra = {};
    }
    meta = extra;
    if (outlet.meta != null) {
      _ref = outlet.meta;
      for (key in _ref) {
        value = _ref[key];
        meta[key] = value;
      }
    }
    return new Outlet(outlet.inout, outlet.name, outlet.hint, outlet.type, meta);
  };

  Outlet.index = 0;

  Outlet.id = function(name) {
    return "_io_" + (++Outlet.index) + "_" + name;
  };

  Outlet.hint = function(name) {
    name = name.replace(/^_io_[0-9]+_/, '');
    name = name.replace(/_i_o$/, '');
    return name = name.replace(/(In|Out|Inout|InOut)$/, '');
  };

  function Outlet(inout, name, hint, type, meta, id) {
    this.inout = inout;
    this.name = name;
    this.hint = hint;
    this.type = type;
    this.meta = meta != null ? meta : {};
    this.id = id;
    if (this.hint == null) {
      this.hint = Outlet.hint(name);
    }
    this.node = null;
    this.input = null;
    this.output = [];
    if (this.id == null) {
      this.id = Outlet.id(this.hint);
    }
  }

  Outlet.prototype.morph = function(outlet) {
    this.inout = outlet.inout;
    this.name = outlet.name;
    this.hint = outlet.hint;
    this.type = outlet.type;
    return this.meta = outlet.meta;
  };

  Outlet.prototype.dupe = function(name) {
    var outlet;
    if (name == null) {
      name = this.id;
    }
    outlet = Outlet.make(this);
    outlet.name = name;
    return outlet;
  };

  Outlet.prototype.connect = function(outlet) {
    if (this.inout === Graph.IN && outlet.inout === Graph.OUT) {
      return outlet.connect(this);
    }
    if (this.inout !== Graph.OUT || outlet.inout !== Graph.IN) {
      throw new Error("Can only connect out to in.");
    }
    if (outlet.input === this) {
      return;
    }
    outlet.disconnect();
    outlet.input = this;
    return this.output.push(outlet);
  };

  Outlet.prototype.disconnect = function(outlet) {
    var index, _i, _len, _ref;
    if (this.input) {
      this.input.disconnect(this);
    }
    if (this.output.length) {
      if (outlet) {
        index = this.output.indexOf(outlet);
        if (index >= 0) {
          this.output.splice(index, 1);
          return outlet.input = null;
        }
      } else {
        _ref = this.output;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          outlet = _ref[_i];
          outlet.input = null;
        }
        return this.output = [];
      }
    }
  };

  return Outlet;

})();

module.exports = Outlet;


},{"./graph":1}],5:[function(require,module,exports){
var Block, Graph, Layout, OutletError, Program, debug;

Graph = require('../graph');

Program = require('../linker').Program;

Layout = require('../linker').Layout;

debug = false;

Block = (function() {
  Block.previous = function(outlet) {
    var _ref;
    return (_ref = outlet.input) != null ? _ref.node.owner : void 0;
  };

  function Block() {
    var _ref;
    if (this.namespace == null) {
      this.namespace = Program.entry();
    }
    this.node = new Graph.Node(this, (_ref = typeof this.makeOutlets === "function" ? this.makeOutlets() : void 0) != null ? _ref : {});
  }

  Block.prototype.refresh = function() {
    var _ref;
    return this.node.setOutlets((_ref = typeof this.makeOutlets === "function" ? this.makeOutlets() : void 0) != null ? _ref : {});
  };

  Block.prototype.clone = function() {
    return new Block;
  };

  Block.prototype.compile = function(language, namespace) {
    var program;
    program = new Program(language, namespace != null ? namespace : Program.entry(), this.node.graph);
    this.call(program, 0);
    return program.assemble();
  };

  Block.prototype.link = function(language, namespace) {
    var layout, module;
    module = this.compile(language, namespace);
    layout = new Layout(language, this.node.graph);
    this._include(module, layout, 0);
    this["export"](layout, 0);
    return layout.link(module);
  };

  Block.prototype.call = function(program, depth) {};

  Block.prototype.callback = function(layout, depth, name, external, outlet) {};

  Block.prototype["export"] = function(layout, depth) {};

  Block.prototype._info = function(suffix) {
    var string, _ref, _ref1;
    string = (_ref = (_ref1 = this.node.owner.snippet) != null ? _ref1._name : void 0) != null ? _ref : this.node.owner.namespace;
    if (suffix != null) {
      return string += '.' + suffix;
    }
  };

  Block.prototype._outlet = function(def, props) {
    var outlet;
    outlet = Graph.Outlet.make(def, props);
    outlet.meta.def = def;
    return outlet;
  };

  Block.prototype._call = function(module, program, depth) {
    return program.call(this.node, module, depth);
  };

  Block.prototype._require = function(module, program) {
    return program.require(this.node, module);
  };

  Block.prototype._inputs = function(module, program, depth) {
    var arg, outlet, _i, _len, _ref, _ref1, _results;
    _ref = module.main.signature;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      arg = _ref[_i];
      outlet = this.node.get(arg.name);
      _results.push((_ref1 = Block.previous(outlet)) != null ? _ref1.call(program, depth + 1) : void 0);
    }
    return _results;
  };

  Block.prototype._callback = function(module, layout, depth, name, external, outlet) {
    return layout.callback(this.node, module, depth, name, external, outlet);
  };

  Block.prototype._include = function(module, layout, depth) {
    return layout.include(this.node, module, depth);
  };

  Block.prototype._link = function(module, layout, depth) {
    var block, ext, key, orig, outlet, parent, _i, _len, _ref, _ref1, _ref2, _results;
    debug && console.log('block::_link', this.toString(), module.namespace);
    _ref = module.symbols;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      ext = module.externals[key];
      outlet = this.node.get(ext.name);
      if (!outlet) {
        throw new OutletError("External not found on " + (this._info(ext.name)));
      }
      if (outlet.meta.child != null) {
        continue;
      }
      _ref1 = [outlet, outlet, null], orig = _ref1[0], parent = _ref1[1], block = _ref1[2];
      while (!block && parent) {
        _ref2 = [outlet.meta.parent, parent], parent = _ref2[0], outlet = _ref2[1];
      }
      block = Block.previous(outlet);
      if (!block) {
        throw new OutletError("Missing connection on " + (this._info(ext.name)));
      }
      debug && console.log('callback -> ', this.toString(), ext.name, outlet);
      block.callback(layout, depth + 1, key, ext, outlet.input);
      _results.push(block != null ? block["export"](layout, depth + 1) : void 0);
    }
    return _results;
  };

  Block.prototype._trace = function(module, layout, depth) {
    var arg, outlet, _i, _len, _ref, _ref1, _results;
    debug && console.log('block::_trace', this.toString(), module.namespace);
    _ref = module.main.signature;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      arg = _ref[_i];
      outlet = this.node.get(arg.name);
      _results.push((_ref1 = Block.previous(outlet)) != null ? _ref1["export"](layout, depth + 1) : void 0);
    }
    return _results;
  };

  return Block;

})();

OutletError = function(message) {
  var e;
  e = new Error(message);
  e.name = 'OutletError';
  return e;
};

OutletError.prototype = new Error;

module.exports = Block;


},{"../graph":25,"../linker":30}],6:[function(require,module,exports){
var Block, Call,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Block = require('./block');

Call = (function(_super) {
  __extends(Call, _super);

  function Call(snippet) {
    this.snippet = snippet;
    this.namespace = this.snippet.namespace;
    Call.__super__.constructor.apply(this, arguments);
  }

  Call.prototype.clone = function() {
    return new Call(this.snippet);
  };

  Call.prototype.makeOutlets = function() {
    var callbacks, externals, key, main, outlet, params, symbols;
    main = this.snippet.main.signature;
    externals = this.snippet.externals;
    symbols = this.snippet.symbols;
    params = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = main.length; _i < _len; _i++) {
        outlet = main[_i];
        _results.push(this._outlet(outlet, {
          callback: false
        }));
      }
      return _results;
    }).call(this);
    callbacks = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = symbols.length; _i < _len; _i++) {
        key = symbols[_i];
        _results.push(this._outlet(externals[key], {
          callback: true
        }));
      }
      return _results;
    }).call(this);
    return params.concat(callbacks);
  };

  Call.prototype.call = function(program, depth) {
    this._call(this.snippet, program, depth);
    return this._inputs(this.snippet, program, depth);
  };

  Call.prototype["export"] = function(layout, depth) {
    if (!layout.visit(this.namespace, depth)) {
      return;
    }
    this._link(this.snippet, layout, depth);
    return this._trace(this.snippet, layout, depth);
  };

  return Call;

})(Block);

module.exports = Call;


},{"./block":5}],7:[function(require,module,exports){
var Block, Callback, Graph,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Graph = require('../graph');

Block = require('./block');


/*
  Re-use a subgraph as a callback
 */

Callback = (function(_super) {
  __extends(Callback, _super);

  function Callback(graph) {
    this.graph = graph;
    Callback.__super__.constructor.apply(this, arguments);
  }

  Callback.prototype.refresh = function() {
    Callback.__super__.refresh.apply(this, arguments);
    return delete this.subroutine;
  };

  Callback.prototype.clone = function() {
    return new Callback(this.graph);
  };

  Callback.prototype.makeOutlets = function() {
    var handle, ins, outlet, outlets, outs, type, _i, _j, _len, _len1, _ref, _ref1;
    this.make();
    outlets = [];
    ins = [];
    outs = [];
    handle = (function(_this) {
      return function(outlet, list) {
        var dupe, _base;
        if (outlet.meta.callback) {
          if (outlet.inout === Graph.IN) {
            dupe = outlet.dupe();
            if ((_base = dupe.meta).child == null) {
              _base.child = outlet;
            }
            outlet.meta.parent = dupe;
            return outlets.push(dupe);
          }
        } else {
          return list.push(outlet.type);
        }
      };
    })(this);
    _ref = this.graph.inputs();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      handle(outlet, ins);
    }
    _ref1 = this.graph.outputs();
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      outlet = _ref1[_j];
      handle(outlet, outs);
    }
    ins = ins.join(',');
    outs = outs.join(',');
    type = "(" + ins + ")(" + outs + ")";
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
  };

  Callback.prototype.make = function() {
    return this.subroutine = this.graph.compile(this.namespace);
  };

  Callback.prototype["export"] = function(layout, depth) {
    if (!layout.visit(this.namespace, depth)) {
      return;
    }
    this._link(this.subroutine, layout, depth);
    return this.graph["export"](layout, depth);
  };

  Callback.prototype.call = function(program, depth) {
    return this._require(this.subroutine, program, depth);
  };

  Callback.prototype.callback = function(layout, depth, name, external, outlet) {
    this._include(this.subroutine, layout, depth);
    return this._callback(this.subroutine, layout, depth, name, external, outlet);
  };

  return Callback;

})(Block);

module.exports = Callback;


},{"../graph":25,"./block":5}],8:[function(require,module,exports){
exports.Block = require('./block');

exports.Call = require('./call');

exports.Callback = require('./callback');

exports.Isolate = require('./isolate');

exports.Join = require('./join');


},{"./block":5,"./call":6,"./callback":7,"./isolate":9,"./join":10}],9:[function(require,module,exports){
var Block, Graph, Isolate,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Graph = require('../graph');

Block = require('./block');


/*
  Isolate a subgraph as a single node
 */

Isolate = (function(_super) {
  __extends(Isolate, _super);

  function Isolate(graph) {
    this.graph = graph;
    Isolate.__super__.constructor.apply(this, arguments);
  }

  Isolate.prototype.refresh = function() {
    Isolate.__super__.refresh.apply(this, arguments);
    return delete this.subroutine;
  };

  Isolate.prototype.clone = function() {
    return new Isolate(this.graph);
  };

  Isolate.prototype.makeOutlets = function() {
    var done, dupe, name, outlet, outlets, seen, set, _base, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    this.make();
    outlets = [];
    seen = {};
    done = {};
    _ref = ['inputs', 'outputs'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      set = _ref[_i];
      _ref1 = this.graph[set]();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        outlet = _ref1[_j];
        name = void 0;
        if (((_ref2 = outlet.hint) === 'return' || _ref2 === 'callback') && outlet.inout === Graph.OUT) {
          name = outlet.hint;
        }
        if (seen[name] != null) {
          name = void 0;
        }
        dupe = outlet.dupe(name);
        if ((_base = dupe.meta).child == null) {
          _base.child = outlet;
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
  };

  Isolate.prototype.make = function() {
    return this.subroutine = this.graph.compile(this.namespace);
  };

  Isolate.prototype.call = function(program, depth) {
    this._call(this.subroutine, program, depth);
    return this._inputs(this.subroutine, program, depth);
  };

  Isolate.prototype["export"] = function(layout, depth) {
    if (!layout.visit(this.namespace, depth)) {
      return;
    }
    this._link(this.subroutine, layout, depth);
    this._trace(this.subroutine, layout, depth);
    return this.graph["export"](layout, depth);
  };

  Isolate.prototype.callback = function(layout, depth, name, external, outlet) {
    outlet = outlet.meta.child;
    return outlet.node.owner.callback(layout, depth, name, external, outlet);
  };

  return Isolate;

})(Block);

module.exports = Isolate;


},{"../graph":25,"./block":5}],10:[function(require,module,exports){
var Block, Join,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Block = require('./block');


/*
  Join multiple disconnected nodes
 */

Join = (function(_super) {
  __extends(Join, _super);

  function Join(nodes) {
    this.nodes = nodes;
    Join.__super__.constructor.apply(this, arguments);
  }

  Join.prototype.clone = function() {
    return new Join(this.nodes);
  };

  Join.prototype.makeOutlets = function() {
    return [];
  };

  Join.prototype.call = function(program, depth) {
    var block, node, _i, _len, _ref, _results;
    _ref = this.nodes;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      block = node.owner;
      _results.push(block.call(program, depth));
    }
    return _results;
  };

  Join.prototype["export"] = function(layout, depth) {
    var block, node, _i, _len, _ref, _results;
    _ref = this.nodes;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      block = node.owner;
      _results.push(block["export"](layout, depth));
    }
    return _results;
  };

  return Join;

})(Block);

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
  return function(name) {
    var expire, key;
    key = name.length > 32 ? '##' + hash(name).toString(16) : name;
    expire = push(key);
    if (expire != null) {
      delete cached[expire];
    }
    if (cached[key] == null) {
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

Factory = (function() {
  function Factory(language, fetch, config) {
    this.language = language;
    this.fetch = fetch;
    this.config = config;
    this.graph();
  }

  Factory.prototype.pipe = function(name, uniforms, namespace, defines) {
    if (name instanceof Factory) {
      this._concat(name);
    } else if (name != null) {
      this._call(name, uniforms, namespace, defines);
    }
    return this;
  };

  Factory.prototype.call = function(name, uniforms, namespace, defines) {
    return this.pipe(name, uniforms, namespace, defines);
  };

  Factory.prototype.require = function(name, uniforms, namespace, defines) {
    if (name instanceof Factory) {
      this._import(name);
    } else if (name != null) {
      this.callback();
      this._call(name, uniforms, namespace, defines);
      this.end();
    }
    return this;
  };

  Factory.prototype["import"] = function(name, uniforms, namespace, defines) {
    return this.require(name, uniforms, namespace, defines);
  };

  Factory.prototype.split = function() {
    this._group('_combine', true);
    return this;
  };

  Factory.prototype.fan = function() {
    this._group('_combine', false);
    return this;
  };

  Factory.prototype.isolate = function() {
    this._group('_isolate');
    return this;
  };

  Factory.prototype.callback = function() {
    this._group('_callback');
    return this;
  };

  Factory.prototype.next = function() {
    this._next();
    return this;
  };

  Factory.prototype.pass = function() {
    var pass;
    pass = this._stack[2].end;
    this.end();
    this._state.end = this._state.end.concat(pass);
    return this;
  };

  Factory.prototype.end = function() {
    var main, op, sub, _ref;
    _ref = this._exit(), sub = _ref[0], main = _ref[1];
    op = sub.op;
    if (this[op]) {
      this[op](sub, main);
    }
    return this;
  };

  Factory.prototype.join = function() {
    return this.end();
  };

  Factory.prototype.graph = function() {
    var graph, _ref;
    while (((_ref = this._stack) != null ? _ref.length : void 0) > 1) {
      this.end();
    }
    if (this._graph) {
      this._tail(this._state, this._graph);
    }
    graph = this._graph;
    this._graph = new Graph;
    this._state = new State;
    this._stack = [this._state];
    return graph;
  };

  Factory.prototype.compile = function(namespace) {
    if (namespace == null) {
      namespace = 'main';
    }
    return this.graph().compile(namespace);
  };

  Factory.prototype.link = function(namespace) {
    if (namespace == null) {
      namespace = 'main';
    }
    return this.graph().link(namespace);
  };

  Factory.prototype.serialize = function() {
    return Visualize.serialize(this._graph);
  };

  Factory.prototype.empty = function() {
    return this._graph.nodes.length === 0;
  };

  Factory.prototype._concat = function(factory) {
    var block, error;
    if (factory._state.nodes.length === 0) {
      return this;
    }
    this._tail(factory._state, factory._graph);
    try {
      block = new Block.Isolate(factory._graph);
    } catch (_error) {
      error = _error;
      if (this.config.autoInspect) {
        Visualize.inspect(error, this._graph, factory);
      }
      throw error;
    }
    this._auto(block);
    return this;
  };

  Factory.prototype._import = function(factory) {
    var block, error;
    if (factory._state.nodes.length === 0) {
      throw "Can't import empty callback";
    }
    this._tail(factory._state, factory._graph);
    try {
      block = new Block.Callback(factory._graph);
    } catch (_error) {
      error = _error;
      if (this.config.autoInspect) {
        Visualize.inspect(error, this._graph, factory);
      }
      throw error;
    }
    this._auto(block);
    return this;
  };

  Factory.prototype._combine = function(sub, main) {
    var from, to, _i, _j, _len, _len1, _ref, _ref1;
    _ref = sub.start;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      to = _ref[_i];
      _ref1 = main.end;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        from = _ref1[_j];
        from.connect(to, sub.multi);
      }
    }
    main.end = sub.end;
    return main.nodes = main.nodes.concat(sub.nodes);
  };

  Factory.prototype._isolate = function(sub, main) {
    var block, error, subgraph;
    if (sub.nodes.length) {
      subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);
      try {
        block = new Block.Isolate(subgraph);
      } catch (_error) {
        error = _error;
        if (this.config.autoInspect) {
          Visualize.inspect(error, this._graph, subgraph);
        }
        throw error;
      }
      return this._auto(block);
    }
  };

  Factory.prototype._callback = function(sub, main) {
    var block, error, subgraph;
    if (sub.nodes.length) {
      subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);
      try {
        block = new Block.Callback(subgraph);
      } catch (_error) {
        error = _error;
        if (this.config.autoInspect) {
          Visualize.inspect(error, this._graph, subgraph);
        }
        throw error;
      }
      return this._auto(block);
    }
  };

  Factory.prototype._call = function(name, uniforms, namespace, defines) {
    var block, snippet;
    snippet = this.fetch(name);
    snippet.bind(this.config, uniforms, namespace, defines);
    block = new Block.Call(snippet);
    return this._auto(block);
  };

  Factory.prototype._subgraph = function(sub) {
    var subgraph;
    subgraph = new Graph(null, this._graph);
    subgraph.adopt(sub.nodes);
    return subgraph;
  };

  Factory.prototype._tail = function(state, graph) {
    var tail;
    tail = state.end.concat(state.tail);
    tail = tail.filter(function(node, i) {
      return tail.indexOf(node) === i;
    });
    if (tail.length > 1) {
      tail = new Block.Join(tail);
      tail = [tail.node];
      this._graph.add(tail);
    }
    graph.tail = tail[0];
    state.end = tail;
    state.tail = [];
    if (!graph.tail) {
      throw new Error("Cannot finalize empty graph");
    }
    graph.compile = (function(_this) {
      return function(namespace) {
        var error;
        if (namespace == null) {
          namespace = 'main';
        }
        try {
          return graph.tail.owner.compile(_this.language, namespace);
        } catch (_error) {
          error = _error;
          if (_this.config.autoInspect) {
            graph.inspect(error);
          }
          throw error;
        }
      };
    })(this);
    graph.link = (function(_this) {
      return function(namespace) {
        var error;
        if (namespace == null) {
          namespace = 'main';
        }
        try {
          return graph.tail.owner.link(_this.language, namespace);
        } catch (_error) {
          error = _error;
          if (_this.config.autoInspect) {
            graph.inspect(error);
          }
          throw error;
        }
      };
    })(this);
    graph["export"] = (function(_this) {
      return function(layout, depth) {
        return graph.tail.owner["export"](layout, depth);
      };
    })(this);
    return graph.inspect = function(message) {
      if (message == null) {
        message = null;
      }
      return Visualize.inspect(message, graph);
    };
  };

  Factory.prototype._group = function(op, multi) {
    this._push(op, multi);
    this._push();
    return this;
  };

  Factory.prototype._next = function() {
    var sub;
    sub = this._pop();
    this._state.start = this._state.start.concat(sub.start);
    this._state.end = this._state.end.concat(sub.end);
    this._state.nodes = this._state.nodes.concat(sub.nodes);
    this._state.tail = this._state.tail.concat(sub.tail);
    return this._push();
  };

  Factory.prototype._exit = function() {
    this._next();
    this._pop();
    return [this._pop(), this._state];
  };

  Factory.prototype._push = function(op, multi) {
    this._stack.unshift(new State(op, multi));
    return this._state = this._stack[0];
  };

  Factory.prototype._pop = function() {
    var _ref;
    this._state = this._stack[1];
    if (this._state == null) {
      this._state = new State;
    }
    return (_ref = this._stack.shift()) != null ? _ref : new State;
  };

  Factory.prototype._auto = function(block) {
    if (block.node.inputs.length) {
      return this._append(block);
    } else {
      return this._insert(block);
    }
  };

  Factory.prototype._append = function(block) {
    var end, node, _i, _len, _ref;
    node = block.node;
    this._graph.add(node);
    _ref = this._state.end;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      end = _ref[_i];
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
  };

  Factory.prototype._prepend = function(block) {
    var node, start, _i, _len, _ref;
    node = block.node;
    this._graph.add(node);
    _ref = this._state.start;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      start = _ref[_i];
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
  };

  Factory.prototype._insert = function(block) {
    var node;
    node = block.node;
    this._graph.add(node);
    this._state.start.push(node);
    this._state.end.push(node);
    this._state.nodes.push(node);
    if (!node.outputs.length) {
      return this._state.tail.push(node);
    }
  };

  return Factory;

})();

State = (function() {
  function State(op, multi, start, end, nodes, tail) {
    this.op = op != null ? op : null;
    this.multi = multi != null ? multi : false;
    this.start = start != null ? start : [];
    this.end = end != null ? end : [];
    this.nodes = nodes != null ? nodes : [];
    this.tail = tail != null ? tail : [];
  }

  return State;

})();

module.exports = Factory;


},{"../block":8,"../graph":25,"../visualize":36}],13:[function(require,module,exports){
var c1, c2, c3, c4, c5, hash, imul, test;

c1 = 0xcc9e2d51;

c2 = 0x1b873593;

c3 = 0xe6546b64;

c4 = 0x85ebca6b;

c5 = 0xc2b2ae35;

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
    k = a | (b << 16);
    k ^= k << 9;
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
          throw new Error("Unknown snippet `" + name + "`");
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
  fetch.used = function(_used) {
    if (_used == null) {
      _used = used;
    }
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
  now = +(new Date);
  return function(label) {
    var delta;
    delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

Material = (function() {
  function Material(vertex, fragment) {
    this.vertex = vertex;
    this.fragment = fragment;
    if (debug) {
      this.tock = tick();
    }
  }

  Material.prototype.build = function(options) {
    return this.link(options);
  };

  Material.prototype.link = function(options) {
    var attributes, fragment, key, shader, uniforms, value, varyings, vertex, _i, _len, _ref, _ref1, _ref2, _ref3;
    if (options == null) {
      options = {};
    }
    uniforms = {};
    varyings = {};
    attributes = {};
    vertex = this.vertex.link('main');
    fragment = this.fragment.link('main');
    _ref = [vertex, fragment];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      shader = _ref[_i];
      _ref1 = shader.uniforms;
      for (key in _ref1) {
        value = _ref1[key];
        uniforms[key] = value;
      }
      _ref2 = shader.varyings;
      for (key in _ref2) {
        value = _ref2[key];
        varyings[key] = value;
      }
      _ref3 = shader.attributes;
      for (key in _ref3) {
        value = _ref3[key];
        attributes[key] = value;
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
  };

  Material.prototype.inspect = function() {
    return Visualize.inspect('Vertex Shader', this.vertex, 'Fragment Shader', this.fragment.graph);
  };

  return Material;

})();

module.exports = Material;


},{"../visualize":36}],17:[function(require,module,exports){
var queue;

queue = function(limit) {
  var add, count, head, map, remove, tail;
  if (limit == null) {
    limit = 100;
  }
  map = {};
  head = null;
  tail = null;
  count = 0;
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
  return function(key) {
    var dead, item;
    if (item = map[key] && item !== head) {
      remove(item);
      add(item);
    } else {
      if (count === limit) {
        dead = tail.key;
        remove(tail);
        delete map[dead];
      } else {
        count++;
      }
      item = {
        next: head,
        prev: null,
        key: key
      };
      add(item);
      map[key] = item;
    }
    return dead;
  };
};

module.exports = queue;


},{}],18:[function(require,module,exports){

/*
  Compile snippet back into GLSL, but with certain symbols replaced by prefixes / placeholders
 */
var compile, replaced, string_compiler, tick;

compile = function(program) {
  var assembler, ast, code, placeholders, signatures;
  ast = program.ast, code = program.code, signatures = program.signatures;
  placeholders = replaced(signatures);
  assembler = string_compiler(code, placeholders);
  return [signatures, assembler];
};

tick = function() {
  var now;
  now = +(new Date);
  return function(label) {
    var delta;
    delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

replaced = function(signatures) {
  var key, out, s, sig, _i, _j, _len, _len1, _ref, _ref1;
  out = {};
  s = function(sig) {
    return out[sig.name] = true;
  };
  s(signatures.main);
  _ref = ['external', 'internal', 'varying', 'uniform', 'attribute'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    key = _ref[_i];
    _ref1 = signatures[key];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      sig = _ref1[_j];
      s(sig);
    }
  }
  return out;
};


/*
String-replacement based compiler
 */

string_compiler = function(code, placeholders) {
  var key, re;
  re = new RegExp('\\b(' + ((function() {
    var _results;
    _results = [];
    for (key in placeholders) {
      _results.push(key);
    }
    return _results;
  })()).join('|') + ')\\b', 'g');
  code = code.replace(/\/\/[^\n]*/g, '');
  code = code.replace(/\/\*([^*]|\*[^\/])*\*\//g, '');
  return function(prefix, exceptions, defines) {
    var compiled, defs, replace, value;
    if (prefix == null) {
      prefix = '';
    }
    if (exceptions == null) {
      exceptions = {};
    }
    if (defines == null) {
      defines = {};
    }
    replace = {};
    for (key in placeholders) {
      replace[key] = exceptions[key] != null ? key : prefix + key;
    }
    compiled = code.replace(re, function(key) {
      return replace[key];
    });
    defs = (function() {
      var _results;
      _results = [];
      for (key in defines) {
        value = defines[key];
        _results.push("#define " + key + " " + value);
      }
      return _results;
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
var Definition, decl, defaults, get, three, threejs, win;

module.exports = decl = {};

decl["in"] = 0;

decl.out = 1;

decl.inout = 2;

get = function(n) {
  return n.token.data;
};

decl.node = function(node) {
  var _ref, _ref1;
  if (((_ref = node.children[5]) != null ? _ref.type : void 0) === 'function') {
    return decl["function"](node);
  } else if (((_ref1 = node.token) != null ? _ref1.type : void 0) === 'keyword') {
    return decl.external(node);
  }
};

decl.external = function(node) {
  var c, i, ident, list, next, out, quant, storage, struct, type, _i, _len, _ref;
  c = node.children;
  storage = get(c[1]);
  struct = get(c[3]);
  type = get(c[4]);
  list = c[5];
  if (storage !== 'attribute' && storage !== 'uniform' && storage !== 'varying') {
    storage = 'global';
  }
  out = [];
  _ref = list.children;
  for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
    c = _ref[i];
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

decl["function"] = function(node) {
  var args, body, c, child, decls, func, ident, storage, struct, type;
  c = node.children;
  storage = get(c[1]);
  struct = get(c[3]);
  type = get(c[4]);
  func = c[5];
  ident = get(func.children[0]);
  args = func.children[1];
  body = func.children[2];
  decls = (function() {
    var _i, _len, _ref, _results;
    _ref = args.children;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      _results.push(decl.argument(child));
    }
    return _results;
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
    return (long ? dir : '') + ("" + prefix + name + suffix);
  };
  f.split = function(dir) {
    return decl.param(dir, storage, spec, quant, count);
  };
  return f;
};

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
  var dirs, inout, param, storages, type, value, _ref;
  dirs = {
    "in": decl["in"],
    out: decl.out,
    inout: decl.inout
  };
  storages = {
    "const": 'const'
  };
  type = three[spec];
  if (quant) {
    type += 'v';
  }
  value = defaults[spec];
  if (value != null ? value.call : void 0) {
    value = new value;
  }
  if (quant) {
    value = [value];
  }
  inout = (_ref = dirs[dir]) != null ? _ref : dirs["in"];
  storage = storages[storage];
  param = decl.param(dir, storage, spec, quant, count);
  return new Definition(name, type, spec, param, value, inout);
};

Definition = (function() {
  function Definition(name, type, spec, param, value, inout, meta) {
    this.name = name;
    this.type = type;
    this.spec = spec;
    this.param = param;
    this.value = value;
    this.inout = inout;
    this.meta = meta;
  }

  Definition.prototype.split = function() {
    var dir, inout, isIn, param;
    isIn = this.meta.shadowed != null;
    dir = isIn ? 'in' : 'out';
    inout = isIn ? decl["in"] : decl.out;
    param = this.param.split(dir);
    return new Definition(this.name, this.type, this.spec, param, this.value, inout);
  };

  Definition.prototype.copy = function(name, meta) {
    var def;
    return def = new Definition(name != null ? name : this.name, this.type, this.spec, this.param, this.value, this.inout, meta);
  };

  return Definition;

})();


},{}],21:[function(require,module,exports){
var $, Graph, _;

Graph = require('../graph');

$ = require('./constants');


/*
 GLSL code generator for compiler and linker stubs
 */

module.exports = _ = {
  unshadow: function(name) {
    var real;
    real = name.replace($.SHADOW_ARG, '');
    if (real !== name) {
      return real;
    } else {
      return null;
    }
  },
  lines: function(lines) {
    return lines.join('\n');
  },
  list: function(lines) {
    return lines.join(', ');
  },
  statements: function(lines) {
    return lines.join(';\n');
  },
  body: function(entry) {
    return {
      entry: entry,
      type: 'void',
      params: [],
      signature: [],
      "return": '',
      vars: {},
      calls: [],
      post: [],
      chain: {}
    };
  },
  define: function(a, b) {
    return "#define " + a + " " + b;
  },
  "function": function(type, entry, params, vars, calls) {
    return "" + type + " " + entry + "(" + params + ") {\n" + vars + calls + "}";
  },
  invoke: function(ret, entry, args) {
    ret = ret ? "" + ret + " = " : '';
    args = _.list(args);
    return "  " + ret + entry + "(" + args + ")";
  },
  same: function(a, b) {
    var A, B, i, _i, _len;
    for (i = _i = 0, _len = a.length; _i < _len; i = ++_i) {
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
  call: function(lookup, dangling, entry, signature, body) {
    var arg, args, copy, id, inout, isReturn, meta, name, omit, op, other, ret, rets, shadow, _i, _len, _ref, _ref1;
    args = [];
    ret = '';
    rets = 1;
    for (_i = 0, _len = signature.length; _i < _len; _i++) {
      arg = signature[_i];
      name = arg.name;
      copy = id = lookup(name);
      other = null;
      meta = null;
      omit = false;
      inout = arg.inout;
      isReturn = name === $.RETURN_ARG;
      if (shadow = (_ref = arg.meta) != null ? _ref.shadowed : void 0) {
        other = lookup(shadow);
        if (other) {
          body.vars[other] = "  " + arg.param(other);
          body.calls.push("  " + other + " = " + id);
          if (!dangling(shadow)) {
            arg = arg.split();
          } else {
            meta = {
              shadowed: other
            };
          }
        }
      }
      if (shadow = (_ref1 = arg.meta) != null ? _ref1.shadow : void 0) {
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
        ret = id;
      } else if (!omit) {
        args.push(other != null ? other : id);
      }
      if (dangling(name)) {
        op = 'push';
        if (isReturn) {
          if (body["return"] === '') {
            op = 'unshift';
            copy = name;
            body.type = arg.spec;
            body["return"] = "  return " + id;
            body.vars[id] = "  " + arg.param(id);
          } else {
            body.vars[id] = "  " + arg.param(id);
            body.params.push(arg.param(id, true));
          }
        } else {
          body.params.push(arg.param(id, true));
        }
        arg = arg.copy(copy, meta);
        body.signature[op](arg);
      } else {
        body.vars[id] = "  " + arg.param(id);
      }
    }
    return body.calls.push(_.invoke(ret, entry, args));
  },
  build: function(body, calls) {
    var a, b, code, decl, entry, params, post, ret, type, v, vars;
    entry = body.entry;
    code = null;
    if (calls && calls.length === 1 && entry !== 'main') {
      a = body;
      b = calls[0].module;
      if (_.same(body.signature, b.main.signature)) {
        code = _.define(entry, b.entry);
      }
    }
    if (code == null) {
      vars = (function() {
        var _ref, _results;
        _ref = body.vars;
        _results = [];
        for (v in _ref) {
          decl = _ref[v];
          _results.push(decl);
        }
        return _results;
      })();
      calls = body.calls;
      post = body.post;
      params = body.params;
      type = body.type;
      ret = body["return"];
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
      code = _["function"](type, entry, params, vars, calls);
    }
    return {
      signature: body.signature,
      code: code,
      name: entry
    };
  },
  links: function(links) {
    var l, out, _i, _len;
    out = {
      defs: [],
      bodies: []
    };
    for (_i = 0, _len = links.length; _i < _len; _i++) {
      l = links[_i];
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
  link: (function(_this) {
    return function(link, out) {
      var arg, entry, external, inner, ins, list, main, map, module, name, other, outer, outs, returnVar, wrapper, _dangling, _i, _j, _len, _len1, _lookup, _name, _ref, _ref1;
      module = link.module, name = link.name, external = link.external;
      main = module.main;
      entry = module.entry;
      if (_.same(main.signature, external.signature)) {
        return out.defs.push(_.define(name, entry));
      }
      ins = [];
      outs = [];
      map = {};
      returnVar = [module.namespace, $.RETURN_ARG].join('');
      _ref = external.signature;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        arg = _ref[_i];
        list = arg.inout === Graph.IN ? ins : outs;
        list.push(arg);
      }
      _ref1 = main.signature;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        arg = _ref1[_j];
        list = arg.inout === Graph.IN ? ins : outs;
        other = list.shift();
        _name = other.name;
        if (_name === $.RETURN_ARG) {
          _name = returnVar;
        }
        map[arg.name] = _name;
      }
      _lookup = function(name) {
        return map[name];
      };
      _dangling = function() {
        return true;
      };
      inner = _.body();
      _.call(_lookup, _dangling, entry, main.signature, inner);
      inner.entry = entry;
      map = {
        "return": returnVar
      };
      _lookup = function(name) {
        var _ref2;
        return (_ref2 = map[name]) != null ? _ref2 : name;
      };
      outer = _.body();
      wrapper = _.call(_lookup, _dangling, entry, external.signature, outer);
      outer.calls = inner.calls;
      outer.entry = name;
      out.bodies.push(_.build(inner).code.split(' {')[0]);
      return out.bodies.push(_.build(outer).code);
    };
  })(this),
  defuse: function(code) {
    var b, blocks, hash, head, i, j, level, line, re, rest, strip, _i, _j, _len, _len1;
    re = /([A-Za-z0-9_]+\s+)?[A-Za-z0-9_]+\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*;\s*/mg;
    strip = function(code) {
      return code.replace(re, function(m) {
        return '';
      });
    };
    blocks = code.split(/(?=[{}])/g);
    level = 0;
    for (i = _i = 0, _len = blocks.length; _i < _len; i = ++_i) {
      b = blocks[i];
      switch (b[0]) {
        case '{':
          level++;
          break;
        case '}':
          level--;
      }
      if (level === 0) {
        hash = b.split(/^[ \t]*#/m);
        for (j = _j = 0, _len1 = hash.length; _j < _len1; j = ++_j) {
          line = hash[j];
          if (j > 0) {
            line = line.split(/\n/);
            head = line.shift();
            rest = line.join("\n");
            hash[j] = [head, strip(rest)].join('\n');
          } else {
            hash[j] = strip(line);
          }
        }
        blocks[i] = hash.join('#');
      }
    }
    return code = blocks.join('');
  },
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
  hoist: function(code) {
    var defs, line, lines, list, out, re, _i, _len;
    re = /^#define ([^ ]+ _pg_[0-9]+_|_pg_[0-9]+_ [^ ]+)$/;
    lines = code.split(/\n/g);
    defs = [];
    out = [];
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      list = line.match(re) ? defs : out;
      list.push(line);
    }
    return defs.concat(out).join("\n");
  }
};


},{"../graph":25,"./constants":19}],22:[function(require,module,exports){
var k, v, _i, _len, _ref;

exports.compile = require('./compile');

exports.parse = require('./parse');

exports.generate = require('./generate');

_ref = require('./constants');
for (v = _i = 0, _len = _ref.length; _i < _len; v = ++_i) {
  k = _ref[v];
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

parse = function(name, code) {
  var ast, program;
  ast = parseGLSL(name, code);
  return program = processAST(ast, code);
};

parseGLSL = function(name, code) {
  var ast, e, error, errors, fmt, tock, _i, _len, _ref, _ref1;
  if (debug) {
    tock = tick();
  }
  try {
    _ref = tokenizer().process(parser(), code), (_ref1 = _ref[0], ast = _ref1[0]), errors = _ref[1];
  } catch (_error) {
    e = _error;
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
      return "" + (pad(i + 1)) + ": " + line;
    }).join("\n");
  };
  if (!ast || errors.length) {
    if (!name) {
      name = '(inline code)';
    }
    console.warn(fmt(code));
    for (_i = 0, _len = errors.length; _i < _len; _i++) {
      error = errors[_i];
      console.error("" + name + " -", error.message);
    }
    throw new Error("GLSL parse error");
  }
  return ast;
};

processAST = function(ast, code) {
  var externals, internals, main, signatures, symbols, tock, _ref;
  if (debug) {
    tock = tick();
  }
  symbols = [];
  walk(mapSymbols, collect(symbols), ast, '');
  _ref = sortSymbols(symbols), main = _ref[0], internals = _ref[1], externals = _ref[2];
  signatures = extractSignatures(main, internals, externals);
  if (debug) {
    tock('GLSL AST');
  }
  return {
    ast: ast,
    code: code,
    signatures: signatures
  };
};

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
    var obj, _i, _len, _results;
    if (value != null) {
      _results = [];
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        obj = value[_i];
        _results.push(out.push(obj));
      }
      return _results;
    }
  };
};

sortSymbols = function(symbols) {
  var e, externals, found, internals, main, maybe, s, _i, _len;
  main = null;
  internals = [];
  externals = [];
  maybe = {};
  found = false;
  for (_i = 0, _len = symbols.length; _i < _len; _i++) {
    s = symbols[_i];
    if (!s.body) {
      if (s.storage === 'global') {
        internals.push(s);
      } else {
        externals.push(s);
        maybe[s.ident] = true;
      }
    } else {
      if (maybe[s.ident]) {
        externals = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = externals.length; _j < _len1; _j++) {
            e = externals[_j];
            if (e.ident !== s.ident) {
              _results.push(e);
            }
          }
          return _results;
        })();
        delete maybe[s.ident];
      }
      internals.push(s);
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

extractSignatures = function(main, internals, externals) {
  var def, defn, func, sigs, symbol, _i, _j, _len, _len1;
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
    var a, arg, b, d, def, inTypes, outTypes, signature, type, _i, _len;
    signature = (function() {
      var _i, _len, _ref, _results;
      _ref = symbol.args;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        arg = _ref[_i];
        _results.push(defn(arg));
      }
      return _results;
    })();
    for (_i = 0, _len = signature.length; _i < _len; _i++) {
      d = signature[_i];
      if (!(d.inout === decl.inout)) {
        continue;
      }
      a = d;
      b = d.copy();
      a.inout = decl["in"];
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
    if (symbol.type !== 'void') {
      signature.unshift(decl.type($.RETURN_ARG, symbol.type, false, '', 'out'));
    }
    inTypes = ((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = signature.length; _j < _len1; _j++) {
        d = signature[_j];
        if (d.inout === decl["in"]) {
          _results.push(d.type);
        }
      }
      return _results;
    })()).join(',');
    outTypes = ((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = signature.length; _j < _len1; _j++) {
        d = signature[_j];
        if (d.inout === decl.out) {
          _results.push(d.type);
        }
      }
      return _results;
    })()).join(',');
    type = "(" + inTypes + ")(" + outTypes + ")";
    return def = {
      name: symbol.ident,
      type: type,
      signature: signature,
      inout: inout,
      spec: symbol.type
    };
  };
  sigs.main = func(main, decl.out);
  for (_i = 0, _len = internals.length; _i < _len; _i++) {
    symbol = internals[_i];
    sigs.internal.push({
      name: symbol.ident
    });
  }
  for (_j = 0, _len1 = externals.length; _j < _len1; _j++) {
    symbol = externals[_j];
    switch (symbol.decl) {
      case 'external':
        def = defn(symbol);
        sigs[symbol.storage].push(def);
        break;
      case 'function':
        def = func(symbol, decl["in"]);
        sigs.external.push(def);
    }
  }
  return sigs;
};

debug = false;

walk = function(map, collect, node, indent) {
  var child, i, recurse, _i, _len, _ref, _ref1, _ref2;
  debug && console.log(indent, node.type, (_ref = node.token) != null ? _ref.data : void 0, (_ref1 = node.token) != null ? _ref1.type : void 0);
  recurse = map(node, collect);
  if (recurse) {
    _ref2 = node.children;
    for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
      child = _ref2[i];
      walk(map, collect, child, indent + '  ', debug);
    }
  }
  return null;
};

tick = function() {
  var now;
  now = +(new Date);
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

/*
  Graph of nodes with outlets
 */
var Graph;

Graph = (function() {
  Graph.index = 0;

  Graph.id = function(name) {
    return ++Graph.index;
  };

  Graph.IN = 0;

  Graph.OUT = 1;

  function Graph(nodes, parent) {
    this.parent = parent != null ? parent : null;
    this.id = Graph.id();
    this.nodes = [];
    nodes && this.add(nodes);
  }

  Graph.prototype.inputs = function() {
    var inputs, node, outlet, _i, _j, _len, _len1, _ref, _ref1;
    inputs = [];
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _ref1 = node.inputs;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        outlet = _ref1[_j];
        if (outlet.input === null) {
          inputs.push(outlet);
        }
      }
    }
    return inputs;
  };

  Graph.prototype.outputs = function() {
    var node, outlet, outputs, _i, _j, _len, _len1, _ref, _ref1;
    outputs = [];
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _ref1 = node.outputs;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        outlet = _ref1[_j];
        if (outlet.output.length === 0) {
          outputs.push(outlet);
        }
      }
    }
    return outputs;
  };

  Graph.prototype.getIn = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.inputs();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Graph.prototype.getOut = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.outputs();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Graph.prototype.add = function(node, ignore) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
        this.add(_node);
      }
      return;
    }
    if (node.graph && !ignore) {
      throw new Error("Adding node to two graphs at once");
    }
    node.graph = this;
    return this.nodes.push(node);
  };

  Graph.prototype.remove = function(node, ignore) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
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
  };

  Graph.prototype.adopt = function(node) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
        this.adopt(_node);
      }
      return;
    }
    node.graph.remove(node, true);
    return this.add(node, true);
  };

  return Graph;

})();

module.exports = Graph;


},{}],25:[function(require,module,exports){
exports.Graph = require('./graph');

exports.Node = require('./node');

exports.Outlet = require('./outlet');

exports.IN = exports.Graph.IN;

exports.OUT = exports.Graph.OUT;


},{"./graph":24,"./node":26,"./outlet":27}],26:[function(require,module,exports){
var Graph, Node, Outlet;

Graph = require('./graph');

Outlet = require('./outlet');


/*
 Node in graph.
 */

Node = (function() {
  Node.index = 0;

  Node.id = function(name) {
    return ++Node.index;
  };

  function Node(owner, outlets) {
    this.owner = owner;
    this.graph = null;
    this.inputs = [];
    this.outputs = [];
    this.all = [];
    this.outlets = null;
    this.id = Node.id();
    this.setOutlets(outlets);
  }

  Node.prototype.getIn = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.inputs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Node.prototype.getOut = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.outputs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Node.prototype.get = function(name) {
    return this.getIn(name) || this.getOut(name);
  };

  Node.prototype.setOutlets = function(outlets) {
    var existing, hash, key, match, outlet, _i, _j, _k, _len, _len1, _len2, _ref;
    if (outlets != null) {
      if (this.outlets == null) {
        this.outlets = {};
        for (_i = 0, _len = outlets.length; _i < _len; _i++) {
          outlet = outlets[_i];
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
        return;
      }
      hash = function(outlet) {
        return [outlet.name, outlet.inout, outlet.type].join('-');
      };
      match = {};
      for (_j = 0, _len1 = outlets.length; _j < _len1; _j++) {
        outlet = outlets[_j];
        match[hash(outlet)] = true;
      }
      _ref = this.outlets;
      for (key in _ref) {
        outlet = _ref[key];
        key = hash(outlet);
        if (match[key]) {
          match[key] = outlet;
        } else {
          this._remove(outlet);
        }
      }
      for (_k = 0, _len2 = outlets.length; _k < _len2; _k++) {
        outlet = outlets[_k];
        existing = match[hash(outlet)];
        if (existing instanceof Outlet) {
          this._morph(existing, outlet);
        } else {
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
      }
      this;
    }
    return this.outlets;
  };

  Node.prototype.connect = function(node, empty, force) {
    var dest, dests, hint, hints, list, outlets, source, sources, type, typeHint, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    outlets = {};
    hints = {};
    typeHint = function(outlet) {
      return type + '/' + outlet.hint;
    };
    _ref = node.inputs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dest = _ref[_i];
      if (!force && dest.input) {
        continue;
      }
      type = dest.type;
      hint = typeHint(dest);
      if (!hints[hint]) {
        hints[hint] = dest;
      }
      outlets[type] = list = outlets[type] || [];
      list.push(dest);
    }
    sources = this.outputs;
    sources = sources.filter(function(outlet) {
      return !(empty && outlet.output.length);
    });
    _ref1 = sources.slice();
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      source = _ref1[_j];
      type = source.type;
      hint = typeHint(source);
      dests = outlets[type];
      if (dest = hints[hint]) {
        source.connect(dest);
        delete hints[hint];
        dests.splice(dests.indexOf(dest), 1);
        sources.splice(sources.indexOf(source), 1);
      }
    }
    if (!sources.length) {
      return this;
    }
    _ref2 = sources.slice();
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      source = _ref2[_k];
      type = source.type;
      dests = outlets[type];
      if (dests && dests.length) {
        source.connect(dests.shift());
      }
    }
    return this;
  };

  Node.prototype.disconnect = function(node) {
    var outlet, _i, _j, _len, _len1, _ref, _ref1;
    _ref = this.inputs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      outlet.disconnect();
    }
    _ref1 = this.outputs;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      outlet = _ref1[_j];
      outlet.disconnect();
    }
    return this;
  };

  Node.prototype._key = function(outlet) {
    return [outlet.name, outlet.inout].join('-');
  };

  Node.prototype._add = function(outlet) {
    var key;
    key = this._key(outlet);
    if (outlet.node) {
      throw new Error("Adding outlet to two nodes at once.");
    }
    if (this.outlets[key]) {
      throw new Error("Adding two identical outlets to same node. (" + key + ")");
    }
    outlet.node = this;
    if (outlet.inout === Graph.IN) {
      this.inputs.push(outlet);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.push(outlet);
    }
    this.all.push(outlet);
    return this.outlets[key] = outlet;
  };

  Node.prototype._morph = function(existing, outlet) {
    var key;
    key = this._key(outlet);
    delete this.outlets[key];
    existing.morph(outlet);
    key = this._key(outlet);
    return this.outlets[key] = outlet;
  };

  Node.prototype._remove = function(outlet) {
    var inout, key;
    key = this._key(outlet);
    inout = outlet.inout;
    if (outlet.node !== this) {
      throw new Error("Removing outlet from wrong node.");
    }
    outlet.disconnect();
    outlet.node = null;
    delete this.outlets[key];
    if (outlet.inout === Graph.IN) {
      this.inputs.splice(this.inputs.indexOf(outlet), 1);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.splice(this.outputs.indexOf(outlet), 1);
    }
    this.all.splice(this.all.indexOf(outlet), 1);
    return this;
  };

  return Node;

})();

module.exports = Node;


},{"./graph":24,"./outlet":27}],27:[function(require,module,exports){
var Graph, Outlet;

Graph = require('./graph');


/*
  In/out outlet on node
 */

Outlet = (function() {
  Outlet.make = function(outlet, extra) {
    var key, meta, value, _ref;
    if (extra == null) {
      extra = {};
    }
    meta = extra;
    if (outlet.meta != null) {
      _ref = outlet.meta;
      for (key in _ref) {
        value = _ref[key];
        meta[key] = value;
      }
    }
    return new Outlet(outlet.inout, outlet.name, outlet.hint, outlet.type, meta);
  };

  Outlet.index = 0;

  Outlet.id = function(name) {
    return "_io_" + (++Outlet.index) + "_" + name;
  };

  Outlet.hint = function(name) {
    name = name.replace(/^_io_[0-9]+_/, '');
    name = name.replace(/_i_o$/, '');
    return name = name.replace(/(In|Out|Inout|InOut)$/, '');
  };

  function Outlet(inout, name, hint, type, meta, id) {
    this.inout = inout;
    this.name = name;
    this.hint = hint;
    this.type = type;
    this.meta = meta != null ? meta : {};
    this.id = id;
    if (this.hint == null) {
      this.hint = Outlet.hint(name);
    }
    this.node = null;
    this.input = null;
    this.output = [];
    if (this.id == null) {
      this.id = Outlet.id(this.hint);
    }
  }

  Outlet.prototype.morph = function(outlet) {
    this.inout = outlet.inout;
    this.name = outlet.name;
    this.hint = outlet.hint;
    this.type = outlet.type;
    return this.meta = outlet.meta;
  };

  Outlet.prototype.dupe = function(name) {
    var outlet;
    if (name == null) {
      name = this.id;
    }
    outlet = Outlet.make(this);
    outlet.name = name;
    return outlet;
  };

  Outlet.prototype.connect = function(outlet) {
    if (this.inout === Graph.IN && outlet.inout === Graph.OUT) {
      return outlet.connect(this);
    }
    if (this.inout !== Graph.OUT || outlet.inout !== Graph.IN) {
      throw new Error("Can only connect out to in.");
    }
    if (outlet.input === this) {
      return;
    }
    outlet.disconnect();
    outlet.input = this;
    return this.output.push(outlet);
  };

  Outlet.prototype.disconnect = function(outlet) {
    var index, _i, _len, _ref;
    if (this.input) {
      this.input.disconnect(this);
    }
    if (this.output.length) {
      if (outlet) {
        index = this.output.indexOf(outlet);
        if (index >= 0) {
          this.output.splice(index, 1);
          return outlet.input = null;
        }
      } else {
        _ref = this.output;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          outlet = _ref[_i];
          outlet.input = null;
        }
        return this.output = [];
      }
    }
  };

  return Outlet;

})();

module.exports = Outlet;


},{"./graph":24}],28:[function(require,module,exports){
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

merge = function(a, b) {
  var key, out, value, _ref;
  if (b == null) {
    b = {};
  }
  out = {};
  for (key in a) {
    value = a[key];
    out[key] = (_ref = b[key]) != null ? _ref : a[key];
  }
  return out;
};

ShaderGraph = (function() {
  function ShaderGraph(snippets, config) {
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

  ShaderGraph.prototype.shader = function(config) {
    var _config;
    if (config == null) {
      config = {};
    }
    _config = merge(this.config, config);
    return new Factory.Factory(GLSL, this.fetch, _config);
  };

  ShaderGraph.prototype.material = function(config) {
    return new Factory.Material(this.shader(config), this.shader(config));
  };

  ShaderGraph.prototype.overlay = function(shader) {
    return ShaderGraph.overlay(shader);
  };

  ShaderGraph.prototype.visualize = function(shader) {
    return ShaderGraph.visualize(shader);
  };

  ShaderGraph.Block = Block;

  ShaderGraph.Factory = Factory;

  ShaderGraph.GLSL = GLSL;

  ShaderGraph.Graph = Graph;

  ShaderGraph.Linker = Linker;

  ShaderGraph.Visualize = Visualize;

  ShaderGraph.inspect = function(shader) {
    return inspect(shader);
  };

  ShaderGraph.visualize = function(shader) {
    return visualize(shader);
  };

  return ShaderGraph;

})();

module.exports = ShaderGraph;

if (typeof window !== 'undefined') {
  window.ShaderGraph = ShaderGraph;
}


},{"./block":8,"./factory":14,"./glsl":22,"./graph":25,"./linker":30,"./visualize":36}],29:[function(require,module,exports){
var Graph, Priority, assemble;

Graph = require('../graph');

Priority = require('./priority');


/*
  Program assembler

  Builds composite program that can act as new module/snippet
  Unconnected input/outputs and undefined callbacks are exposed in the new global/main scope
  If there is only one call with an identical call signature, a #define is output instead.
 */

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
    var body, code, includes, lib, main, ns, r, sorted, _ref;
    for (ns in requires) {
      r = requires[ns];
      required(r.node, r.module);
    }
    _ref = handle(calls), body = _ref[0], calls = _ref[1];
    if (namespace != null) {
      body.entry = namespace;
    }
    main = generate.build(body, calls);
    sorted = ((function() {
      var _results;
      _results = [];
      for (ns in library) {
        lib = library[ns];
        _results.push(lib);
      }
      return _results;
    })()).sort(function(a, b) {
      return Priority.compare(a.priority, b.priority);
    });
    includes = sorted.map(function(x) {
      return x.code;
    });
    includes.push(main.code);
    code = generate.lines(includes);
    return {
      namespace: main.name,
      library: library,
      body: main.code,
      code: code,
      main: main,
      entry: main.name,
      symbols: symbols,
      externals: externals,
      uniforms: uniforms,
      varyings: varyings,
      attributes: attributes
    };
  };
  handle = (function(_this) {
    return function(calls) {
      var body, c, call, ns, _i, _len;
      calls = (function() {
        var _results;
        _results = [];
        for (ns in calls) {
          c = calls[ns];
          _results.push(c);
        }
        return _results;
      })();
      calls.sort(function(a, b) {
        return b.priority - a.priority;
      });
      call = function(node, module, priority) {
        var entry, main, _dangling, _lookup;
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
      for (_i = 0, _len = calls.length; _i < _len; _i++) {
        c = calls[_i];
        call(c.node, c.module, c.priority);
      }
      return [body, calls];
    };
  })(this);
  adopt = function(namespace, code, priority) {
    var record;
    record = library[namespace];
    if (record != null) {
      return record.priority = Priority.max(record.priority, priority);
    } else {
      return library[namespace] = {
        code: code,
        priority: priority
      };
    }
  };
  include = function(node, module, priority) {
    var def, key, lib, ns, _ref, _ref1, _ref2, _ref3;
    priority = Priority.make(priority);
    _ref = module.library;
    for (ns in _ref) {
      lib = _ref[ns];
      adopt(ns, lib.code, Priority.nest(priority, lib.priority));
    }
    adopt(module.namespace, module.body, priority);
    _ref1 = module.uniforms;
    for (key in _ref1) {
      def = _ref1[key];
      uniforms[key] = def;
    }
    _ref2 = module.varyings;
    for (key in _ref2) {
      def = _ref2[key];
      varyings[key] = def;
    }
    _ref3 = module.attributes;
    for (key in _ref3) {
      def = _ref3[key];
      attributes[key] = def;
    }
    return required(node, module);
  };
  required = function(node, module) {
    var copy, ext, k, key, v, _i, _len, _ref, _results;
    _ref = module.symbols;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      ext = module.externals[key];
      if (isDangling(node, ext.name)) {
        copy = {};
        for (k in ext) {
          v = ext[k];
          copy[k] = v;
        }
        copy.name = lookup(node, ext.name);
        externals[key] = copy;
        _results.push(symbols.push(key));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };
  isDangling = function(node, name) {
    var outlet;
    outlet = node.get(name);
    if (outlet.inout === Graph.IN) {
      return outlet.input === null;
    } else if (outlet.inout === Graph.OUT) {
      return outlet.output.length === 0;
    }
  };
  lookup = function(node, name) {
    var outlet;
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

Layout = (function() {
  function Layout(language, graph) {
    this.language = language;
    this.graph = graph;
    this.links = [];
    this.includes = [];
    this.modules = {};
    this.visits = {};
  }

  Layout.prototype.callback = function(node, module, priority, name, external) {
    return this.links.push({
      node: node,
      module: module,
      priority: priority,
      name: name,
      external: external
    });
  };

  Layout.prototype.include = function(node, module, priority) {
    var m;
    if ((m = this.modules[module.namespace]) != null) {
      return m.priority = Math.max(priority, m.priority);
    } else {
      this.modules[module.namespace] = true;
      return this.includes.push({
        node: node,
        module: module,
        priority: priority
      });
    }
  };

  Layout.prototype.visit = function(namespace) {
    debug && console.log('Visit', namespace, !this.visits[namespace]);
    if (this.visits[namespace]) {
      return false;
    }
    return this.visits[namespace] = true;
  };

  Layout.prototype.link = function(module) {
    var data, key, snippet;
    data = link(this.language, this.links, this.includes, module);
    snippet = new Snippet;
    for (key in data) {
      snippet[key] = data[key];
    }
    snippet.graph = this.graph;
    return snippet;
  };

  return Layout;

})();

module.exports = Layout;


},{"./link":32,"./snippet":35}],32:[function(require,module,exports){
var Graph, Priority, link;

Graph = require('../graph');

Priority = require('./priority');


/*
 Callback linker
 
 Imports given modules and generates linkages for registered callbacks.

 Builds composite program with single module as exported entry point
 */

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
    var code, e, exports, header, lib, m, ns, sorted, _i, _len;
    exports = generate.links(links);
    header = [];
    if (exports.defs != null) {
      header.push(exports.defs);
    }
    if (exports.bodies != null) {
      header.push(exports.bodies);
    }
    for (_i = 0, _len = modules.length; _i < _len; _i++) {
      m = modules[_i];
      include(m.node, m.module, m.priority);
    }
    sorted = ((function() {
      var _results;
      _results = [];
      for (ns in library) {
        lib = library[ns];
        _results.push(lib);
      }
      return _results;
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
    e = exported;
    return {
      namespace: e.main.name,
      code: code,
      main: e.main,
      entry: e.main.name,
      externals: externals,
      uniforms: uniforms,
      attributes: attributes,
      varyings: varyings
    };
  };
  adopt = function(namespace, code, priority) {
    var record;
    record = library[namespace];
    if (record != null) {
      return record.priority = Priority.max(record.priority, priority);
    } else {
      return library[namespace] = {
        code: code,
        priority: priority
      };
    }
  };
  include = function(node, module, priority) {
    var def, ext, key, lib, ns, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4, _results;
    priority = Priority.make(priority);
    _ref = module.library;
    for (ns in _ref) {
      lib = _ref[ns];
      adopt(ns, lib.code, Priority.nest(priority, lib.priority));
    }
    adopt(module.namespace, module.body, priority);
    _ref1 = module.uniforms;
    for (key in _ref1) {
      def = _ref1[key];
      uniforms[key] = def;
    }
    _ref2 = module.varyings;
    for (key in _ref2) {
      def = _ref2[key];
      varyings[key] = def;
    }
    _ref3 = module.attributes;
    for (key in _ref3) {
      def = _ref3[key];
      attributes[key] = def;
    }
    _ref4 = module.symbols;
    _results = [];
    for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
      key = _ref4[_i];
      ext = module.externals[key];
      if (isDangling(node, ext.name)) {
        externals[key] = ext;
        _results.push(symbols.push(key));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };
  isDangling = function(node, name) {
    var module, outlet, _ref, _ref1;
    outlet = node.get(name);
    if (!outlet) {
      module = (_ref = (_ref1 = node.owner.snippet) != null ? _ref1._name : void 0) != null ? _ref : node.owner.namespace;
      throw new Error("Unable to link program. Unlinked callback `" + name + "` on `" + module + "`");
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
  if (x == null) {
    x = [];
  }
  if (!(x instanceof Array)) {
    x = [+x != null ? +x : 0];
  }
  return x;
};

exports.nest = function(a, b) {
  return a.concat(b);
};

exports.compare = function(a, b) {
  var i, n, p, q, _i;
  n = Math.min(a.length, b.length);
  for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
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
var Program, Snippet, assemble;

Snippet = require('./snippet');

assemble = require('./assemble');


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

Program = (function() {
  Program.index = 0;

  Program.entry = function() {
    return "_pg_" + (++Program.index) + "_";
  };

  function Program(language, namespace, graph) {
    this.language = language;
    this.namespace = namespace;
    this.graph = graph;
    this.calls = {};
    this.requires = {};
  }

  Program.prototype.call = function(node, module, priority) {
    var exists, ns;
    ns = module.namespace;
    if (exists = this.calls[ns]) {
      exists.priority = Math.max(exists.priority, priority);
    } else {
      this.calls[ns] = {
        node: node,
        module: module,
        priority: priority
      };
    }
    return this;
  };

  Program.prototype.require = function(node, module) {
    var ns;
    ns = module.namespace;
    return this.requires[ns] = {
      node: node,
      module: module
    };
  };

  Program.prototype.assemble = function() {
    var data, key, snippet, _ref;
    data = assemble(this.language, (_ref = this.namespace) != null ? _ref : Program.entry, this.calls, this.requires);
    snippet = new Snippet;
    for (key in data) {
      snippet[key] = data[key];
    }
    snippet.graph = this.graph;
    return snippet;
  };

  return Program;

})();

module.exports = Program;


},{"./assemble":29,"./snippet":35}],35:[function(require,module,exports){
var Snippet;

Snippet = (function() {
  Snippet.index = 0;

  Snippet.namespace = function() {
    return "_sn_" + (++Snippet.index) + "_";
  };

  Snippet.load = function(language, name, code) {
    var compiler, program, sigs, _ref;
    program = language.parse(name, code);
    _ref = language.compile(program), sigs = _ref[0], compiler = _ref[1];
    return new Snippet(language, sigs, compiler, name, code);
  };

  function Snippet(language, _signatures, _compiler, _name, _original) {
    var _ref;
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
    if (!this._name) {
      this._name = (_ref = this._signatures) != null ? _ref.main.name : void 0;
    }
  }

  Snippet.prototype.clone = function() {
    return new Snippet(this.language, this._signatures, this._compiler, this._name, this._original);
  };

  Snippet.prototype.bind = function(config, uniforms, namespace, defines) {
    var a, def, defs, e, exceptions, exist, global, k, key, local, name, redef, u, v, x, _a, _e, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _u, _v;
    if (uniforms === '' + uniforms) {
      _ref = [uniforms, namespace != null ? namespace : {}, defines != null ? defines : {}], namespace = _ref[0], uniforms = _ref[1], defines = _ref[2];
    } else if (namespace !== '' + namespace) {
      _ref1 = [namespace != null ? namespace : {}, void 0], defines = _ref1[0], namespace = _ref1[1];
    }
    this.main = this._signatures.main;
    this.namespace = (_ref2 = namespace != null ? namespace : this.namespace) != null ? _ref2 : Snippet.namespace();
    this.entry = this.namespace + this.main.name;
    this.uniforms = {};
    this.varyings = {};
    this.attributes = {};
    this.externals = {};
    this.symbols = [];
    exist = {};
    exceptions = {};
    global = function(name) {
      exceptions[name] = true;
      return name;
    };
    local = (function(_this) {
      return function(name) {
        return _this.namespace + name;
      };
    })(this);
    if (config.globals) {
      _ref3 = config.globals;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        key = _ref3[_i];
        global(key);
      }
    }
    _u = config.globalUniforms ? global : local;
    _v = config.globalVaryings ? global : local;
    _a = config.globalAttributes ? global : local;
    _e = local;
    x = (function(_this) {
      return function(def) {
        return exist[def.name] = true;
      };
    })(this);
    u = (function(_this) {
      return function(def, name) {
        return _this.uniforms[_u(name != null ? name : def.name)] = def;
      };
    })(this);
    v = (function(_this) {
      return function(def) {
        return _this.varyings[_v(def.name)] = def;
      };
    })(this);
    a = (function(_this) {
      return function(def) {
        return _this.attributes[_a(def.name)] = def;
      };
    })(this);
    e = (function(_this) {
      return function(def) {
        var name;
        name = _e(def.name);
        _this.externals[name] = def;
        return _this.symbols.push(name);
      };
    })(this);
    redef = function(def) {
      return {
        type: def.type,
        name: def.name,
        value: def.value
      };
    };
    _ref4 = this._signatures.uniform;
    for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
      def = _ref4[_j];
      x(def);
    }
    _ref5 = this._signatures.uniform;
    for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
      def = _ref5[_k];
      u(redef(def));
    }
    _ref6 = this._signatures.varying;
    for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
      def = _ref6[_l];
      v(redef(def));
    }
    _ref7 = this._signatures.external;
    for (_m = 0, _len4 = _ref7.length; _m < _len4; _m++) {
      def = _ref7[_m];
      e(def);
    }
    _ref8 = this._signatures.attribute;
    for (_n = 0, _len5 = _ref8.length; _n < _len5; _n++) {
      def = _ref8[_n];
      a(redef(def));
    }
    for (name in uniforms) {
      def = uniforms[name];
      if (exist[name]) {
        u(def, name);
      }
    }
    this.body = this.code = this._compiler(this.namespace, exceptions, defines);
    if (defines) {
      defs = ((function() {
        var _results;
        _results = [];
        for (k in defines) {
          v = defines[k];
          _results.push("#define " + k + " " + v);
        }
        return _results;
      })()).join('\n');
      if (defs.length) {
        this._original = [defs, "//----------------------------------------", this._original].join("\n");
      }
    }
    return null;
  };

  return Snippet;

})();

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
  var arg, out, _i, _len;
  out = [];
  for (_i = 0, _len = args.length; _i < _len; _i++) {
    arg = args[_i];
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
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      graph = list[_i];
      if (graph) {
        _results.push(visualize(graph));
      }
    }
    return _results;
  })());
};

exports.inspect = function() {
  var contents, el, element, _i, _len, _ref;
  contents = exports.visualize.apply(null, arguments);
  element = markup.overlay(contents);
  _ref = document.querySelectorAll('.shadergraph-overlay');
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    el = _ref[_i];
    el.remove();
  }
  document.body.appendChild(element);
  contents.update();
  return element;
};


},{"../Graph":2,"./markup":37,"./serialize":38}],37:[function(require,module,exports){
var connect, cssColor, escapeText, hash, hashColor, makeSVG, merge, overlay, path, process, sqr, trim, wrap, _activate, _markup, _order;

hash = require('../factory/hash');

trim = function(string) {
  return ("" + string).replace(/^\s+|\s+$/g, '');
};

cssColor = function(r, g, b, alpha) {
  return 'rgba(' + [r, g, b, alpha].join(', ') + ')';
};

hashColor = function(string, alpha) {
  var b, color, g, max, min, norm, r;
  if (alpha == null) {
    alpha = 1;
  }
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
  var code, codes, _i, _len, _results;
  codes = el.querySelectorAll('.shadergraph-code');
  _results = [];
  for (_i = 0, _len = codes.length; _i < _len; _i++) {
    code = codes[_i];
    _results.push((function() {
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
  return _results;
};

_order = function(data) {
  var link, linkMap, node, nodeMap, recurse, _i, _j, _k, _len, _len1, _len2, _name, _ref, _ref1, _ref2;
  nodeMap = {};
  linkMap = {};
  _ref = data.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    nodeMap[node.id] = node;
  }
  _ref1 = data.links;
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    link = _ref1[_j];
    if (linkMap[_name = link.from] == null) {
      linkMap[_name] = [];
    }
    linkMap[link.from].push(link);
  }
  recurse = function(node, depth) {
    var next, _k, _len2, _ref2;
    if (depth == null) {
      depth = 0;
    }
    node.depth = Math.max((_ref2 = node.depth) != null ? _ref2 : 0, depth);
    if (next = linkMap[node.id]) {
      for (_k = 0, _len2 = next.length; _k < _len2; _k++) {
        link = next[_k];
        recurse(nodeMap[link.to], depth + 1);
      }
    }
    return null;
  };
  _ref2 = data.nodes;
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    node = _ref2[_k];
    if (node.depth == null) {
      recurse(node);
    }
  }
  return null;
};

_markup = function(data, links) {
  var addOutlet, block, clear, color, column, columns, div, link, node, outlet, outlets, wrapper, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3;
  _order(data);
  wrapper = document.createElement('div');
  wrapper.classList.add('shadergraph-graph');
  columns = [];
  outlets = {};
  _ref = data.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    block = document.createElement('div');
    block.classList.add("shadergraph-node");
    block.classList.add("shadergraph-node-" + node.type);
    block.innerHTML = "<div class=\"shadergraph-header\">" + (escapeText(node.name)) + "</div>";
    addOutlet = function(outlet, inout) {
      var color, div;
      color = hashColor(outlet.type);
      div = document.createElement('div');
      div.classList.add('shadergraph-outlet');
      div.classList.add("shadergraph-outlet-" + inout);
      div.innerHTML = "<div class=\"shadergraph-point\" style=\"background: " + color + "\"></div>\n<div class=\"shadergraph-type\" style=\"color: " + color + "\">" + (escapeText(outlet.type)) + "</div>\n<div class=\"shadergraph-name\">" + (escapeText(outlet.name)) + "</div>";
      block.appendChild(div);
      return outlets[outlet.id] = div.querySelector('.shadergraph-point');
    };
    _ref1 = node.inputs;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      outlet = _ref1[_j];
      addOutlet(outlet, 'in');
    }
    _ref2 = node.outputs;
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      outlet = _ref2[_k];
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
  for (_l = 0, _len3 = columns.length; _l < _len3; _l++) {
    column = columns[_l];
    if (column != null) {
      wrapper.appendChild(column);
    }
  }
  _ref3 = data.links;
  for (_m = 0, _len4 = _ref3.length; _m < _len4; _m++) {
    link = _ref3[_m];
    color = hashColor(link.type);
    links.push({
      color: color,
      out: outlets[link.out],
      "in": outlets[link["in"]]
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

makeSVG = function(tag) {
  if (tag == null) {
    tag = 'svg';
  }
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
};

connect = function(element, links) {
  var a, b, box, c, line, link, ref, svg, _i, _j, _len, _len1;
  if (element.parentNode == null) {
    return;
  }
  ref = element.getBoundingClientRect();
  for (_i = 0, _len = links.length; _i < _len; _i++) {
    link = links[_i];
    a = link.out.getBoundingClientRect();
    b = link["in"].getBoundingClientRect();
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
  for (_j = 0, _len1 = links.length; _j < _len1; _j++) {
    link = links[_j];
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
  var div, el, _i, _len;
  if (markup.length !== 1) {
    div = document.createElement('div');
    for (_i = 0, _len = markup.length; _i < _len; _i++) {
      el = markup[_i];
      div.appendChild(wrap(el));
    }
    div.update = function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = markup.length; _j < _len1; _j++) {
        el = markup[_j];
        _results.push(typeof el.update === "function" ? el.update() : void 0);
      }
      return _results;
    };
    return div;
  } else {
    return wrap(markup[0]);
  }
};

module.exports = {
  process: process,
  merge: merge,
  overlay: overlay
};


},{"../factory/hash":13}],38:[function(require,module,exports){
var Block, isCallback, serialize;

Block = require('../block');

isCallback = function(outlet) {
  return outlet.type[0] === '(';
};

serialize = function(graph) {
  var block, format, inputs, links, node, nodes, other, outlet, outputs, record, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
  nodes = [];
  links = [];
  _ref = graph.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    record = {
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
    }
    format = function(type) {
      type = type.replace(")(", ")→(");
      return type = type.replace("()", "");
    };
    _ref1 = node.inputs;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      outlet = _ref1[_j];
      inputs.push({
        id: outlet.id,
        name: outlet.name,
        type: format(outlet.type),
        open: outlet.input == null
      });
    }
    _ref2 = node.outputs;
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      outlet = _ref2[_k];
      outputs.push({
        id: outlet.id,
        name: outlet.name,
        type: format(outlet.type),
        open: !outlet.output.length
      });
      _ref3 = outlet.output;
      for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
        other = _ref3[_l];
        links.push({
          from: node.id,
          out: outlet.id,
          to: other.node.id,
          "in": other.id,
          type: format(outlet.type)
        });
      }
    }
  }
  return {
    nodes: nodes,
    links: links
  };
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
    queue: function(obj) {
      var _ref;
      if (obj != null) {
        return (_ref = this.parser) != null ? _ref.write(obj) : void 0;
      }
    },
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


},{}]},{},[28])