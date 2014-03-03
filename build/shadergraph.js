(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/*
  Graph of shader nodes.
 */
var Graph;

Graph = (function() {
  Graph.IN = 0;

  Graph.OUT = 1;

  function Graph(nodes, parent) {
    this.parent = parent != null ? parent : null;
    this.nodes = [];
    nodes && this.add(nodes);
  }

  Graph.prototype.inputs = function() {
    debugger;
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

  Graph.prototype.tail = function() {
    return this.nodes[this.nodes.length - 1];
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
      throw "Adding node to two graphs at once";
    }
    node.link(this);
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
      throw "Removing node from wrong graph.";
    }
    ignore || node.disconnect();
    return this.nodes.splice(this.nodes.indexOf(node), 1);
  };

  return Graph;

})();

module.exports = Graph;


},{}],2:[function(require,module,exports){
exports.Graph = require('./graph');

exports.Node = require('./node');

exports.Outlet = require('./outlet');


},{"./graph":1,"./node":3,"./outlet":4}],3:[function(require,module,exports){
var Graph, Node, Outlet;

Graph = require('./graph');

Outlet = require('./outlet');


/*
 Node in shader graph.
 */

Node = (function() {
  function Node(owner, outlets) {
    this.owner = owner;
    this.graph = null;
    this.inputs = [];
    this.outputs = [];
    this.outlets = null;
    this.setOutlets(outlets);
  }

  Node.prototype.getOwner = function() {
    return this.owner;
  };

  Node.prototype.link = function(graph) {
    this.graph = graph;
  };

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
    var existing, hash, key, make, match, outlet, _i, _j, _k, _len, _len1, _len2, _ref;
    make = function(outlet) {
      return new Outlet(outlet.inout, outlet.name, outlet.hint, outlet.type, outlet.meta);
    };
    if (outlets != null) {
      if (this.outlets == null) {
        this.outlets = {};
        for (_i = 0, _len = outlets.length; _i < _len; _i++) {
          outlet = outlets[_i];
          this._add(make(outlet));
        }
        return this.first = false;
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
          this._add(make(outlet));
        }
      }
      this;
    }
    return this.outlets;
  };

  Node.prototype.connect = function(node, empty, force) {
    var hint, hints, others, outlet, outlets, type, _i, _j, _len, _len1, _ref, _ref1;
    outlets = {};
    hints = {};
    _ref = node.inputs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (!force && outlet.input) {
        continue;
      }
      type = outlet.type;
      hint = [type, outlet.hint].join('-');
      if (!hints[hint]) {
        hints[hint] = outlet;
      }
      outlets[type] = outlets[type] || [];
      outlets[type].push(outlet);
    }
    _ref1 = this.outputs;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      outlet = _ref1[_j];
      if (empty && outlet.output.length) {
        continue;
      }
      type = outlet.type;
      hint = [type, outlet.hint].join('-');
      others = outlets[type];
      if (hints[hint]) {
        hints[hint].connect(outlet);
        delete hints[hint];
        others.splice(others.indexOf(outlet), 1);
        continue;
      }
      if (others && others.length) {
        others.shift().connect(outlet);
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
      throw "Adding outlet to two nodes at once.";
    }
    if (this.outlets[key]) {
      throw "Adding two identical outlets to same node. (" + key + ")";
    }
    outlet.link(this);
    if (outlet.inout === Graph.IN) {
      this.inputs.push(outlet);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.push(outlet);
    }
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
      throw "Removing outlet from wrong node.";
    }
    outlet.disconnect();
    outlet.link(null);
    delete this.outlets[key];
    if (outlet.inout === Graph.IN) {
      this.inputs.splice(this.inputs.indexOf(outlet), 1);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.splice(this.outputs.indexOf(outlet), 1);
    }
    return this;
  };

  return Node;

})();

module.exports = Node;


},{"./graph":1,"./outlet":4}],4:[function(require,module,exports){
var Graph, Outlet;

Graph = require('./graph');

Outlet = (function() {
  Outlet.ID = 0;

  function Outlet(inout, name, hint, type, meta) {
    this.node = null;
    this.inout = inout;
    this.name = name;
    this.hint = hint || name;
    this.type = type;
    this.meta = meta || {};
    this.index = ++Outlet.ID;
    this.key = null;
    this.input = null;
    this.output = [];
  }

  Outlet.prototype.id = function() {
    return ['', 'sg', this.name, this.index].join('_');
  };

  Outlet.prototype.morph = function(outlet) {
    this.inout = outlet.inout;
    this.name = outlet.name;
    this.type = outlet.type;
    return this.meta = outlet.meta || {};
  };

  Outlet.prototype.connect = function(outlet) {
    if (this.inout === Graph.IN && outlet.inout === Graph.OUT) {
      return outlet.connect(this);
    }
    if (this.inout !== Graph.OUT || outlet.inout !== Graph.IN) {
      throw "Can only connect out to in.";
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

  Outlet.prototype.link = function(node) {
    this.node = node;
  };

  return Outlet;

})();

module.exports = Outlet;


},{"./graph":1}],5:[function(require,module,exports){
var ShaderGraph;

ShaderGraph = {
  Graph: require('./graph')
};

module.exports = ShaderGraph;

window.ShaderGraph = ShaderGraph;


},{"./graph":2}]},{},[5])