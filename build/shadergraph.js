(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Factory, Graph, State;

Graph = require('./graph');

State = (function() {
  function State(start, end) {
    this.start = start != null ? start : [];
    this.end = end != null ? end : [];
  }

  return State;

})();

Factory = (function() {
  function Factory(library) {
    this.library = library;
    this.end();
  }

  Factory.prototype._push = function() {
    this._stack.unshift(new State);
    return this._state = this._stack[0];
  };

  Factory.prototype._pop = function() {
    this._state = this._stack[1];
    return this._stack.shift;
  };

  Factory.prototype.snippet = function(name, uniforms) {
    var block, snippet;
    snippet = this.library.fetch(name);
    block = Snippet.Apply(snippet, uniforms);
    return this;
  };

  Factory.prototype.append = function(node) {
    var end, _i, _len, _ref;
    this.graph.add(node);
    _ref = this._state.end;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      end = _ref[_i];
      end.connect(node);
    }
    if (!this._state.start.length) {
      this._state.start = [node];
    }
    return this._state.end = [node];
  };

  Factory.prototype.prepend = function(node) {
    var start, _i, _len, _ref;
    this.graph.add(node);
    _ref = this._state.start;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      start = _ref[_i];
      node.connect(start);
    }
    if (!this._state.end.length) {
      this._state.end = [node];
    }
    this._state.start = [node];
    return this;
  };

  Factory.prototype.group = function() {
    this._push();
    this._push();
    return this;
  };

  Factory.prototype.pass = function() {
    this.next();
    this._state.start.push(null);
    return this.combine();
  };

  Factory.prototype.next = function() {
    var sub;
    sub = this._pop();
    this._state.start = this._state.start.concat(sub.start);
    this._state.end = this._state.end.concat(sub.end);
    return this._push();
  };

  Factory.prototype.combine = function() {
    var from, main, sub, to, _i, _j, _len, _len1, _ref, _ref1;
    if (this._stack.length <= 2) {
      throw "Popping factory stack too far";
    }
    this.next();
    this._pop();
    sub = this._pop();
    main = this._state;
    if (sub.start.length) {
      _ref = sub.start;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        to = _ref[_i];
        if (!to) {
          sub.end = sub.end.concat(main.end);
        } else {
          _ref1 = main.end;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            from = _ref1[_j];
            from.connect(to, true);
          }
        }
      }
    }
    main.end = sub.end;
    return this;
  };

  Factory.prototype.end = function() {
    var graph;
    graph = this.graph;
    this.graph = new Graph.Graph();
    this._state = new State;
    this._stack = [this._state];
    this.group();
    if (graph) {
      graph.compile = function() {
        return graph.tail().owner().compile();
      };
    }
    return graph;
  };

  return Factory;

})();

module.exports = Factory;


},{"./graph":3}],2:[function(require,module,exports){

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
    node.setGraph(this);
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
    this.nodes.splice(this.nodes.indexOf(node), 1);
    return node.setGraph(null);
  };

  return Graph;

})();

module.exports = Graph;


},{}],3:[function(require,module,exports){
exports.Graph = require('./graph');

exports.Node = require('./node');

exports.Outlet = require('./outlet');


},{"./graph":2,"./node":4,"./outlet":5}],4:[function(require,module,exports){
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

  Node.prototype.setGraph = function(graph) {
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
    outlet.setNode(this);
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
    outlet.setNode(null);
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


},{"./graph":2,"./outlet":5}],5:[function(require,module,exports){
var Graph, Outlet;

Graph = require('./graph');

Outlet = (function() {
  Outlet.ID = 0;

  function Outlet(inout, name, hint, type, meta) {
    this.inout = inout;
    this.name = name;
    this.hint = hint;
    this.type = type;
    this.meta = meta != null ? meta : {};
    this.node = null;
    if (this.hint == null) {
      this.hint = name;
    }
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

  Outlet.prototype.setNode = function(node) {
    this.node = node;
  };

  return Outlet;

})();

module.exports = Outlet;


},{"./graph":2}],6:[function(require,module,exports){
var Factory, Library, ShaderGraph, code, coode, shader, shadergraph, snippets;

Factory = require('./factory');

Library = require('./library');

ShaderGraph = (function() {
  function ShaderGraph(library) {
    if (library == null) {
      library = {};
    }
    this.library = new Library(library);
  }

  ShaderGraph.prototype.shader = function() {
    return new Factory(this.library);
  };

  ShaderGraph.prototype.Graph = require('./graph');

  return ShaderGraph;

})();

module.exports = ShaderGraph;

window.ShaderGraph = ShaderGraph;

code = "// Comment\nuniform float uf;\nuniform float ufv1[3];\nuniform vec2 uv2;\n// Comment\nuniform vec2 uv2v[3];\nuniform vec3 uv3;\nuniform vec3 uv3v[3];\nuniform vec4 uv4;\nuniform vec4 uv4v[3];\nuniform sampler2D ut;\nuniform sampler2D utv[3];\nvarying float vf;\nvarying float vfv1[3];\nvarying mat3 vm3;\nvarying mat3 vm3v[3];\nvarying mat4 vm4;\nvarying mat4 vm4v[3];\nattribute float af;\nattribute float afv1[3];\nattribute vec3 av3;\nattribute vec3 av3v[3];\nattribute mat4 am4;\nattribute mat4 am4v[3];\n\nvoid callback1(in vec4 v4in);\n\nvoid callback2(in vec3 v3in, out vec4 v4out);\n\nvoid callback3(in vec3 v3in, in vec4 v4in, out vec4 v4out);\n\nvoid snippetTest(\n  in vec3 v3in, in vec4 v4in, mat3 m3vin[3],\n  out vec4 v4out, out vec4 v4vout[3], out mat4 m4out, out mat4 m4vout[3],\n  inout vec3 v3inout) {\n    callback1(v4in);\n    callback2(v3in, v4out);\n    callback3(v3in, v4in, v4out);\n    gl_FragColor = vec4(v4in.xyz, 1.0);\n}";

coode = "uniform vec3 color;\n\n#pragma external\nconst void callback(const in vec4 rgba);\n\n#pragma export\nvoid main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); };";

coode = "uniform vec2 sampleStep;\n\nuniform float fadeOut;\nuniform float field;\nuniform float time;\n\nuniform sampler2D texture;\nvarying vec2 vUV;\n\nfloat randf(vec2 xy) {\n  return fract(sin(dot(xy, vec2(3.1380, 7.41)) * 13.414) * 1414.32);\n}\n\nconst float c = .9999875;\nconst float s = .005;\nconst mat2 roto1 = mat2(c, s, -s, c);\nconst mat2 roto2 = mat2(c, -s, s, c);\n\nconst float c2 = .9998;\nconst float s2 = .02;\nconst mat2 roto3 = mat2(c2, -s2, s2, c2);\n\nvec2 rotozoom(vec2 xy) {\n  float r = sqrt(dot(xy, xy));\n  xy *= (7.0 * r + sin(r)) * .125 / r;\n  xy *= roto1;\n\n  return xy;\n}\n\nvec2 planeproject(vec2 xy) {\n  float f = .0625 * (15.0 + 1.0 / (-xy.y + 1.5));\n  xy *= f;\n  xy *= roto2;\n\n  return xy;\n}\n\nvec2 ball(vec2 xy) {\n  float r = sqrt(dot(xy, xy));\n  xy *= (3.0 + 1.75 * tan(r * .5) / r) * .25;\n  xy *= roto3;\n\n  return xy;\n}\n\nvec2 swirl(vec2 xy) {\n  vec2 a = xy * 2.25 * 6.28;\n  xy += vec2(sin(a.y), sin(a.x)) * .01;\n\n  vec2 b = xy * 4.5 * 6.28;\n  xy += vec2(-sin(b.y), sin(b.x)) * .01;\n\n  vec2 c = xy * 9.0 * 6.28;\n  xy += vec2(-sin(c.y), -sin(c.x)) * .01;\n  return xy;\n}\n\nvec2 warp(vec2 xy, float q) {\n\n  float r = sqrt(dot(xy, xy));\n  float th = atan(xy.y, xy.x) * 6.0;\n  float f = .99 * (r + sin(r * r * q * .5 + time + sin(th) * 2.0) * .02) / r;\n\n  return xy * f;\n}\n\nvec2 tiles(vec2 xy) {\n\n  vec2 grid = floor(xy * 9.0);\n  float index = mod(grid.x + grid.y + (1.0 + grid.x) * grid.x * grid.y * 3.0, 4.0);\n\n  float d = .01;\n  if (index < .5) {\n    xy.x += d;\n  }\n  else if (index < 1.5) {\n    xy.x -= d;\n  }\n  else if (index < 2.5) {\n    xy.y += d;\n  }\n  else {\n    xy.y -= d;\n  }\n\n  return xy;\n}\n\nvec2 flower(vec2 xy) {\n  vec2 orig = xy;\n  float r = sqrt(dot(xy, xy));\n  float th = atan(xy.y, xy.x);\n\n  float th2 = th + sin(r * 64.0);\n  float r2 = r + sin(th * 64.0);\n\n  return mix(orig, vec2(cos(th2) * r2, sin(th2) * r2), .01);\n}\n\nvec2 rotate(vec2 xy, vec2 ref, float a) {\n  vec2 diff = xy - ref;\n  float c = cos(a);\n  float s = sin(a);\n  return ref + diff * mat2(c, -s, s, c);\n}\n\nvoid callback();\n\nvoid main() {\n  vec2 xy = (vUV * 2.0 - 1.0) * vec2(16.0/9.0, 1.0);\n  vec2 pos = xy;\n\n  if (field > 0.0) {\n\n    if (field < 1.0) {\n      xy = mix(xy, rotozoom(pos), clamp(field, 0.0, 1.0));\n    }\n    else if (field < 2.0) {\n      xy = rotozoom(pos);\n      xy = mix(xy, planeproject(pos), clamp(field - 1.0, 0.0, 1.0));\n    }\n    else if (field < 3.0) {\n      xy = planeproject(pos);\n      xy = mix(xy, ball(pos), clamp(field - 2.0, 0.0, 1.0));\n    }\n    else if (field < 4.0) {\n      xy = ball(pos);\n      xy = mix(xy, rotate(xy, pos, time), clamp(field - 3.0, 0.0, 1.0));\n    }\n    else if (field < 5.0) {\n      xy = ball(pos);\n      xy = rotate(xy, pos, time);\n      xy = mix(xy, rotate(swirl(pos), pos, time), clamp(field - 4.0, 0.0, 1.0) * .5);\n    }\n    else if (field < 6.0) {\n      xy = ball(pos);\n      xy = rotate(xy, pos, time);\n      xy = mix(xy, rotate(swirl(pos), pos, time), .5);\n      xy = mix(xy, mix(rotate(warp(pos * 1.131, 32.0) / 1.131, pos, -time * 1.711), rotate(warp(pos, 27.0), pos, time), .5), clamp(field - 5.0, 0.0, 1.0));\n    }\n    else if (field < 7.0) {\n      xy = mix(rotate(warp(pos * 1.131, 32.0) / 1.131, pos, -time * 1.711), rotate(warp(pos, 27.0), pos, time), .5);\n      xy = mix(xy, rotate(tiles(pos), pos, -time), clamp(field - 6.0, 0.0, 1.0));\n    }\n    else { //if (field < 8.0) {\n      xy = rotate(tiles(pos), pos, -time) * .995;\n      xy = mix(xy, flower(pos), clamp(field - 7.0, 0.0, 1.0));\n    }\n\n    xy += sampleStep * .2;\n  }\n\n  xy *= vec2(9.0/16.0, 1.0);\n\n  vec2 uv = fract(xy * .5 + .5);\n  vec4 sample = texture2D(texture, uv);\n\n  gl_FragColor = vec4(sample.xyz - vec3(fadeOut), 1.0);\n\n}\n";

window.code = code;

snippets = {
  'test': code
};

shadergraph = new ShaderGraph(snippets);

shader = shadergraph.shader().snippet('test');


},{"./factory":1,"./graph":3,"./library":7}],7:[function(require,module,exports){
var Library, Snippet;

Snippet = require('./snippet');

Library = (function() {
  function Library(snippets) {
    this.snippets = snippets != null ? snippets : {};
    this.objects = {};
  }

  Library.prototype.fetch = function(name) {
    if (this.snippets[name] == null) {
      throw "Unknown snippet `" + name + "`";
    }
    if (this.objects[name] != null) {
      return this.objects[name].clone();
    } else {
      return this.objects[name] = Snippet.parse(name, this.snippets[name]);
    }
  };

  return Library;

})();

module.exports = Library;


},{"./snippet":9}],8:[function(require,module,exports){
var decl, get;

module.exports = decl = {};

get = function(n) {
  return n.token.data;
};

decl.decl = function(node) {
  var _ref, _ref1, _ref2, _ref3;
  if (((_ref = node.token) != null ? _ref.type : void 0) === 'keyword' && ((_ref1 = (_ref2 = node.token) != null ? _ref2.data : void 0) === 'attribute' || _ref1 === 'uniform' || _ref1 === 'varying')) {
    return decl.external(node);
  }
  if (((_ref3 = node.children[5]) != null ? _ref3.type : void 0) === 'function') {
    return decl["function"](node);
  }
};

decl.external = function(node) {
  var c, ident, list, quant, storage, struct, type;
  c = node.children;
  storage = c[1];
  struct = c[3];
  type = c[4];
  list = c[5];
  ident = list.children[0];
  quant = list.children[1];
  return {
    node: node,
    storage: get(storage),
    type: get(type),
    ident: get(ident),
    quant: !!quant
  };
};

decl["function"] = function(node) {
  var args, body, c, child, func, ident, storage, struct, type;
  c = node.children;
  storage = c[1];
  struct = c[3];
  type = c[4];
  func = c[5];
  ident = func.children[0];
  args = func.children[1];
  body = func.children[2];
  return {
    node: node,
    storage: get(storage),
    type: get(type),
    ident: get(ident),
    args: (function() {
      var _i, _len, _ref, _results;
      _ref = args.children;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        _results.push(decl.argument(child));
      }
      return _results;
    })(),
    body: !!body
  };
};

decl.argument = function(node) {
  var c, ident, inout, list, quant, storage, type;
  c = node.children;
  storage = c[1];
  inout = c[2];
  type = c[4];
  list = c[5];
  ident = list.children[0];
  quant = list.children[1];
  return {
    node: node,
    storage: get(storage),
    inout: get(inout),
    type: get(type),
    ident: get(ident),
    quant: !!quant
  };
};


},{}],9:[function(require,module,exports){
exports.Snippet = require('./snippet');

exports.parse = require('./parse');


},{"./parse":10,"./snippet":11}],10:[function(require,module,exports){
var decl, extractSymbols, mapSymbols, parse, parseGLSL, parser, processAST, tick, tokenizer, walk;

tokenizer = require('../../vendor/glsl-tokenizer');

parser = require('../../vendor/glsl-parser');

decl = require('./decl');

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

parse = function(name, code) {
  var ast;
  ast = parseGLSL(name, code);
  processAST(ast);
  throw "lol error";
};

parseGLSL = function(name, code) {
  var ast, error, errors, tock, _i, _len, _ref, _ref1;
  tock = tick();
  _ref = tokenizer().process(parser(), code), (_ref1 = _ref[0], ast = _ref1[0]), errors = _ref[1];
  tock('GLSL Tokenize & Parse');
  if (!ast || errors.length) {
    for (_i = 0, _len = errors.length; _i < _len; _i++) {
      error = errors[_i];
      console.error("[ShaderGraph] " + name + " -", error.message);
    }
    throw "GLSL parse error";
  }
  window.ast = ast;
  return ast;
};

processAST = function(ast) {
  var externals, functions, main, tock, _ref;
  tock = tick();
  functions = walk(mapSymbols, ast);
  _ref = extractSymbols(functions), main = _ref[0], externals = _ref[1];
  tock('GLSL AST');
  window.main = main;
  return window.externals = externals;
};

mapSymbols = function(node) {
  switch (node.type) {
    case 'decl':
      return [decl.decl(node), false];
  }
  return [null, true];
};

extractSymbols = function(functions) {
  var e, externals, f, main, _i, _len;
  externals = [];
  main = null;
  for (_i = 0, _len = functions.length; _i < _len; _i++) {
    f = functions[_i];
    if (!f.body) {
      externals.push(f);
    } else {
      externals = (function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = externals.length; _j < _len1; _j++) {
          e = externals[_j];
          if (e.ident !== f.ident) {
            _results.push(e);
          }
        }
        return _results;
      })();
      main = f;
    }
  }
  return [main, externals];
};

walk = function(map, node, i, d, out) {
  var child, recurse, value, _i, _len, _ref, _ref1;
  if (i == null) {
    i = 0;
  }
  if (d == null) {
    d = 0;
  }
  if (out == null) {
    out = [];
  }
  _ref = map(node), value = _ref[0], recurse = _ref[1];
  if (value != null) {
    out.push(value);
  }
  if (recurse) {
    _ref1 = node.children;
    for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
      child = _ref1[i];
      walk(map, child, i, d + 1, out);
    }
  }
  return out;
};


/*
compile = (ast) ->

   * Walk AST

  map = (node) ->
    switch node.type
      when 'preprocessor' then preprocessor(node)
      when 'stmt'         then stmt(node)
    [null, true]

  stmt = (node) ->

  preprocessor = (node) ->
    pragma = node.token.data.split(' ')[1]
 */

module.exports = parse;


},{"../../vendor/glsl-parser":12,"../../vendor/glsl-tokenizer":16,"./decl":8}],11:[function(require,module,exports){
var Snippet;

Snippet = (function() {
  function Snippet() {}

  return Snippet;

})();

module.exports = Snippet;


},{}],12:[function(require,module,exports){
module.exports = require('./lib/index')

},{"./lib/index":14}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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
  , 'if'
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
    , id: (Math.random() * 0xFFFFFFFF).toString(16)
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

},{"../../through":20,"./expr":13,"./scope":15}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{"../through":20,"./lib/builtins":17,"./lib/literals":18,"./lib/operators":19}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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
  , 'for'
  , 'while'
  , 'if'
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

},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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


},{}]},{},[6])