(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Block, Graph, Layout, Program, debug;

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

  Block.prototype.clone = function() {
    return new Block;
  };

  Block.prototype.compile = function(language, namespace) {
    var program;
    program = new Program(language, namespace != null ? namespace : Program.entry());
    this.call(program, 0);
    return program.assemble();
  };

  Block.prototype.link = function(language, namespace) {
    var layout, module;
    module = this.compile(language, namespace);
    layout = new Layout(language);
    this._include(module, layout);
    this._export(layout);
    return layout.link(module);
  };

  Block.prototype.call = function(program, depth) {
    if (depth == null) {
      depth = 0;
    }
  };

  Block.prototype.callback = function(layout, name, external) {};

  Block.prototype["export"] = function(layout) {};

  Block.prototype._export = function(layout) {
    debug && console.log('Block::_export');
    if (!layout.visit(this.namespace)) {
      return;
    }
    debug && console.log('Visiting', this.namespace);
    return this["export"](layout);
  };

  Block.prototype._call = function(module, program, depth) {
    return program.call(this.node, module, depth);
  };

  Block.prototype._callback = function(module, layout, name, external) {
    return layout.callback(this.node, module, name, external);
  };

  Block.prototype._include = function(module, layout) {
    return layout.include(this.node, module);
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

  Block.prototype._link = function(module, layout) {
    var ext, key, outlet, _ref, _ref1, _ref2, _results;
    debug && console.log('block::_link', this.toString(), module.namespace);
    _ref = module.externals;
    _results = [];
    for (key in _ref) {
      ext = _ref[key];
      outlet = this.node.get(ext.name);
      debug && console.log('callback -> ', this.toString(), ext.name, outlet);
      if ((_ref1 = Block.previous(outlet)) != null) {
        _ref1.callback(layout, key, ext, outlet.input);
      }
      _results.push((_ref2 = Block.previous(outlet)) != null ? _ref2._export(layout) : void 0);
    }
    return _results;
  };

  Block.prototype._trace = function(module, layout) {
    var arg, outlet, _i, _len, _ref, _ref1, _results;
    debug && console.log('block::_trace', this.toString(), module.namespace);
    _ref = module.main.signature;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      arg = _ref[_i];
      outlet = this.node.get(arg.name);
      _results.push((_ref1 = Block.previous(outlet)) != null ? _ref1._export(layout) : void 0);
    }
    return _results;
  };

  return Block;

})();

module.exports = Block;


},{"../graph":19,"../linker":24}],2:[function(require,module,exports){
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
    var external, key, outlets, _ref;
    outlets = [];
    outlets = outlets.concat(this.snippet.main.signature);
    _ref = this.snippet.externals;
    for (key in _ref) {
      external = _ref[key];
      outlets.push(external);
    }
    return outlets;
  };

  Call.prototype.call = function(program, depth) {
    this._call(this.snippet, program, depth);
    return this._inputs(this.snippet, program, depth);
  };

  Call.prototype["export"] = function(layout) {
    this._link(this.snippet, layout);
    return this._trace(this.snippet, layout);
  };

  return Call;

})(Block);

module.exports = Call;


},{"./block":1}],3:[function(require,module,exports){
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

  Callback.prototype.clone = function() {
    return new Callback(this.graph);
  };

  Callback.prototype.makeOutlets = function() {
    var handle, ins, isCallback, outlet, outlets, outs, type, _i, _j, _len, _len1, _ref, _ref1;
    outlets = [];
    ins = [];
    outs = [];
    isCallback = function(type) {
      return type[0] === '(';
    };
    handle = (function(_this) {
      return function(outlet, list) {
        if (isCallback(outlet)) {
          return outlets.push(outlet.dupe());
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
      inout: Graph.OUT
    });
    return outlets;
  };

  Callback.prototype.make = function() {
    return this.subroutine = this.graph.compile(this.namespace);
  };

  Callback.prototype.fetch = function(outlet) {
    this.make();
    return this.subroutine;
  };

  Callback.prototype.callback = function(layout, name, external, outlet) {
    if (this.subroutine == null) {
      this.make();
    }
    this._include(this.subroutine, layout);
    return this._callback(this.subroutine, layout, name, external, outlet);
  };

  Callback.prototype["export"] = function(layout) {
    this._link(this.subroutine, layout);
    return this.graph["export"](layout);
  };

  return Callback;

})(Block);

module.exports = Callback;


},{"../graph":19,"./block":1}],4:[function(require,module,exports){
exports.Block = require('./block');

exports.Call = require('./call');

exports.Callback = require('./callback');

exports.Isolate = require('./isolate');

exports.Join = require('./join');


},{"./block":1,"./call":2,"./callback":3,"./isolate":5,"./join":6}],5:[function(require,module,exports){
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

  Isolate.prototype.clone = function() {
    return new Isolate(this.graph);
  };

  Isolate.prototype.makeOutlets = function() {
    var hint, names, outlet, outlets, set, _i, _j, _len, _len1, _ref, _ref1;
    outlets = [];
    names = null;
    _ref = ['inputs', 'outputs'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      set = _ref[_i];
      _ref1 = this.graph[set]();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        outlet = _ref1[_j];
        hint = void 0;
        if (outlet.hint === 'return') {
          hint = 'return';
        }
        outlets.push(outlet.dupe(hint));
      }
    }
    return outlets;
  };

  Isolate.prototype.make = function() {
    return this.subroutine = this.graph.compile(this.namespace);
  };

  Isolate.prototype.call = function(program, depth) {
    if (this.subroutine == null) {
      this.make();
    }
    this._call(this.subroutine, program, depth);
    return this._inputs(this.subroutine, program, depth);
  };

  Isolate.prototype["export"] = function(layout) {
    if (this.subroutine == null) {
      this.make();
    }
    this._link(this.subroutine, layout);
    this._trace(this.subroutine, layout);
    return this.graph["export"](layout);
  };

  Isolate.prototype.fetch = function(outlet) {
    outlet = this.graph.getOut(outlet.name);
    return outlet != null ? outlet.node.owner.fetch(outlet) : void 0;
  };

  Isolate.prototype.callback = function(layout, name, external, outlet) {
    var subroutine;
    subroutine = this.fetch(outlet);
    this._include(subroutine, layout);
    return this._callback(subroutine, layout, name, external, outlet);
  };

  return Isolate;

})(Block);

module.exports = Isolate;


},{"../graph":19,"./block":1}],6:[function(require,module,exports){
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

  Join.prototype["export"] = function(layout) {
    var block, node, _i, _len, _ref, _results;
    _ref = this.nodes;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      block = node.owner;
      _results.push(block._export(layout));
    }
    return _results;
  };

  return Join;

})(Block);

module.exports = Join;


},{"./block":1}],7:[function(require,module,exports){

/*
  Cache decorator  
  Fetches snippets once, clones for reuse
 */
var cache;

cache = function(fetch) {
  var cached;
  cached = {};
  return function(name) {
    if (!cached[name]) {
      cached[name] = fetch(name);
    }
    return cached[name].clone();
  };
};

module.exports = cache;


},{}],8:[function(require,module,exports){
var Block, Factory, Graph, State;

Graph = require('../graph').Graph;

Block = require('../block');


/*
  Chainable factory
  
  Exposes methods to build a graph incrementally
 */

Factory = (function() {
  function Factory(language, fetch) {
    this.language = language;
    this.fetch = fetch;
    this.end();
  }

  Factory.prototype.call = function(name, uniforms, namespace) {
    this._call(name, uniforms, namespace);
    return this;
  };

  Factory.prototype.loose = function(name, uniforms, namespace) {
    this._loose(name, uniforms, namespace);
    return this;
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
    this.join();
    this._state.end = this._state.end.concat(pass);
    return this;
  };

  Factory.prototype.join = function() {
    var main, op, sub, _ref;
    _ref = this._exit(), sub = _ref[0], main = _ref[1];
    op = sub.op;
    if (this[op]) {
      this[op](sub, main);
    }
    return this;
  };

  Factory.prototype.concat = function(factory) {
    var block;
    block = new Block.Isolate(factory.graph);
    this._tail(factory._state, factory.graph);
    return this._append(block);
  };

  Factory.prototype["import"] = function(factory) {
    var block;
    block = new Block.Callback(factory.graph);
    this._tail(factory._state, factory.graph);
    return this._append(block);
  };

  Factory.prototype.end = function() {
    var graph, _ref;
    while (((_ref = this._stack) != null ? _ref.length : void 0) > 1) {
      this.join();
    }
    if (this.graph) {
      this._tail(this._state, this.graph);
    }
    graph = this.graph;
    this.graph = new Graph;
    this._state = new State;
    this._stack = [this._state];
    return graph;
  };

  Factory.prototype.compile = function(namespace) {
    return this.end().compile(namespace);
  };

  Factory.prototype.link = function(namespace) {
    return this.end().link(namespace);
  };

  Factory.prototype._combine = function(sub, main) {
    var from, to, _i, _j, _len, _len1, _ref, _ref1;
    _ref = sub.start;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      to = _ref[_i];
      _ref1 = main.end;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        from = _ref1[_j];
        from.connect(to, sub.empty);
      }
    }
    return main.end = sub.end;
  };

  Factory.prototype._isolate = function(sub, main) {
    var block, subgraph;
    if (sub.nodes.length) {
      subgraph = this._subgraph(sub);
      block = new Block.Isolate(subgraph);
      this._tail(sub, subgraph);
      return this._append(block);
    }
  };

  Factory.prototype._callback = function(sub, main) {
    var block, subgraph;
    if (sub.nodes.length) {
      subgraph = this._subgraph(sub);
      block = new Block.Callback(subgraph);
      this._tail(sub, subgraph);
      return this._append(block);
    }
  };

  Factory.prototype._call = function(name, uniforms, namespace) {
    var block, snippet;
    snippet = this.fetch(name);
    snippet.bind(uniforms, namespace);
    block = new Block.Call(snippet);
    if (block.node.inputs.length) {
      return this._append(block);
    } else {
      return this._insert(block);
    }
  };

  Factory.prototype._loose = function(name, uniforms, namespace) {
    var snippet;
    snippet = this.fetch(name);
    snippet.bind(uniforms, namespace);
    return this._insert(new Block.Call(snippet));
  };

  Factory.prototype._subgraph = function(sub) {
    var subgraph;
    subgraph = new Graph;
    subgraph.adopt(sub.nodes);
    return subgraph;
  };

  Factory.prototype._tail = function(state, graph) {
    var tail;
    if (state.end.length > 1) {
      tail = new Block.Join(state.end);
      state.end = [tail.node];
    }
    graph.tail = state.end[0];
    if (!graph.tail) {
      throw "Cannot finalize empty graph";
    }
    graph.compile = (function(_this) {
      return function(namespace) {
        return graph.tail.owner.compile(_this.language, namespace);
      };
    })(this);
    graph.link = (function(_this) {
      return function(namespace) {
        return graph.tail.owner.link(_this.language, namespace);
      };
    })(this);
    return graph["export"] = (function(_this) {
      return function(layout) {
        return graph.tail.owner["export"](layout);
      };
    })(this);
  };

  Factory.prototype._group = function(op, empty) {
    this._push(op, empty);
    this._push();
    return this;
  };

  Factory.prototype._next = function() {
    var sub;
    sub = this._pop();
    this._state.start = this._state.start.concat(sub.start);
    this._state.end = this._state.end.concat(sub.end);
    this._state.nodes = this._state.nodes.concat(sub.nodes);
    return this._push();
  };

  Factory.prototype._exit = function() {
    this._next();
    this._pop();
    return [this._pop(), this._state];
  };

  Factory.prototype._push = function(op, empty) {
    this._stack.unshift(new State(op, empty));
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

  Factory.prototype._append = function(block) {
    var end, node, _i, _len, _ref;
    node = block.node;
    this.graph.add(node);
    _ref = this._state.end;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      end = _ref[_i];
      end.connect(node);
    }
    if (!this._state.start.length) {
      this._state.start = [node];
    }
    this._state.end = [node];
    return this._state.nodes.push(node);
  };

  Factory.prototype._prepend = function(block) {
    var node, start, _i, _len, _ref;
    node = block.node;
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
    return this._state.nodes.push(node);
  };

  Factory.prototype._insert = function(block) {
    var node;
    node = block.node;
    this.graph.add(node);
    this._state.start.push(node);
    this._state.nodes.push(node);
    return this._state.end.push(node);
  };

  return Factory;

})();

State = (function() {
  function State(op, empty, start, end, nodes) {
    this.op = op != null ? op : null;
    this.empty = empty != null ? empty : false;
    this.start = start != null ? start : [];
    this.end = end != null ? end : [];
    this.nodes = nodes != null ? nodes : [];
  }

  return State;

})();

module.exports = Factory;


},{"../block":4,"../graph":19}],9:[function(require,module,exports){
exports.Factory = require('./factory');

exports.Material = require('./material');

exports.library = require('./library');

exports.cache = require('./cache');


},{"./cache":7,"./factory":8,"./library":10,"./material":11}],10:[function(require,module,exports){

/*
  Snippet library
  
  Takes:
    - Hash of snippets: named library
    - (name) -> getter: dynamic lookup
    - nothing:          no library, pass source code instead of snippet names
 */
var library;

library = function(language, snippets, load) {
  if (snippets != null) {
    if (typeof snippets === 'function') {
      return function(name) {
        return load(language, name, snippets(name));
      };
    } else if (typeof snippets === 'object') {
      return function(name) {
        if (snippets[name] == null) {
          throw "Unknown snippet `" + name + "`";
        }
        return load(language, name, snippets[name]);
      };
    }
  }
  return function(name) {
    return load(language, '', name);
  };
};

module.exports = library;


},{}],11:[function(require,module,exports){
var Material, tick;

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
    this.tock = tick();
  }

  Material.prototype.build = function(options) {
    var attributes, fragment, key, shader, uniforms, value, vertex, _i, _len, _ref, _ref1, _ref2;
    if (options == null) {
      options = {};
    }
    uniforms = {};
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
      _ref2 = shader.attributes;
      for (key in _ref2) {
        value = _ref2[key];
        attributes[key] = value;
      }
    }
    options.vertexShader = vertex.code;
    options.fragmentShader = fragment.code;
    options.attributes = attributes;
    options.uniforms = uniforms;
    this.tock('Material build');
    return options;
  };

  return Material;

})();

module.exports = Material;


},{}],12:[function(require,module,exports){

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
  _ref = ['external', 'internal', 'varying', 'uniform'];
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
  code = code.replace(/^#[^\n]*/mg, '');
  return function(prefix, replaced) {
    var names, _ref;
    if (prefix == null) {
      prefix = '';
    }
    if (replaced == null) {
      replaced = {};
    }
    names = {};
    for (key in placeholders) {
      names[key] = prefix + ((_ref = replaced[key]) != null ? _ref : key);
    }
    return code.replace(re, function(key) {
      return names[key];
    });
  };
};


/*
AST-based compiler
(not used)

glsl-parser's AST is a bit awkward to serialize back into source code

todo: do, while, for, struct, precision
ast_compiler = (ast, placeholders) ->

   * stream out tokens, either strings or string callbacks

  tokens = []
  buffer = ""
  last   = ""
  regex  = /[0-9A-Za-z_{}]/
  indent = ''
  block  = ''

  string = (value) ->

    first = value[0]

    return if value == ';\n' and last == '\n'

    buffer += ' ' if buffer.length and regex.test(last) and regex.test(first)
    buffer += value

    last = buffer[buffer.length - 1]

  maybePlaceholder = (name) ->
    if placeholders[name]
      placeholder name
    else
      string name

  placeholder = (name) ->
    last = buffer[buffer.length - 1]
    buffer += ' ' if buffer.length and regex.test(last)

    combine()
    tokens.push (names) -> names[name]

    last = 'x'

  combine = () ->
    if buffer.length
      tokens.push buffer
      buffer = ""
    tokens

   * process AST nodes
  recurse = (node) ->
    indent += '..'
    walk map, null, child, indent for child, i in node.children
    indent = indent.substring 2

  remap = (node, i) ->
    indent += '..'
    walk map, null, node, indent
    indent = indent.substring 2

  stmtlist = (node) ->
    if node.parent
      block += '  '
      string '{\n'

    recurse node

    if node.parent
      block = block.substring(2)
      string block + '}'

    false

  stmt = (node, data) ->
    if data in ['else']
      string data
    else
      string block

    recurse node
    string ';\n'
    false

  decllist = (node, data) ->
    if data == '='
      for child, i in node.children
        remap child
        if i == 0
          string ' = '
      false
    else
      for child, i in node.children
        if i > 0 && child.type != 'quantifier'
          string ', '
        remap child
      false
   *  else true

  args = (node, data) ->
    c = node.children
    for child, i in c
      if i > 0
        string ', '
      remap child
    false

  ifstmt = (node, data) ->
    c = node.children

    string data
    string '('
    remap c[0]
    string ') '

    remap c[1]
    remap c[2] if c[2]

 *    string block + '\n'
    false

  call = (node, data) ->
    c = node.children

    body = false
    for child, i in c
      if child.type == 'stmtlist'
        body = true
        string ') '
        remap child
      else
        if i > 1
          string ', '
        remap child
        if i == 0
          string '('
    string ')' if !body
    false

  operator = (node, data) ->
    c = node.children

    l = c.length
    if l == 1
       * unary
      string data
      remap c[0]
    else
      data = ' ' + data + ' ' if data != '.'

       * binary
      for child, i in c
        remap child
        string data if i == 0
    false

  ident = (node, data) ->
    maybePlaceholder data
    true

  literal = (node, data) ->
    string data
    true

  group = (node, data) ->
    string '('
    recurse node
    string ')'
    false

  quantifier = (node, data) ->
    string '['
    recurse node
    string ']'
    false

   * map node in tree
  map = (node) ->
    n = node
    d = node.token.data

    switch node.type
      when 'placeholder'  then false
      when 'expr'         then true
      when 'decl'         then true
      when 'stmt'         then stmt         n, d
      when 'literal'      then literal      n, d
      when 'keyword'      then literal      n, d
      when 'ident'        then ident        n, d
      when 'decllist'     then decllist     n, d
      when 'builtin'      then literal      n, d
      when 'binary'       then operator     n, d
      when 'return'       then literal      n, d
      when 'call'         then call         n, d
      when 'function'     then call         n, d
      when 'functionargs' then args         n, d
      when 'if'           then ifstmt       n, d
      when 'else'         then elsestmt     n, d
      when 'group'        then group        n, d
      when 'stmtlist'     then stmtlist     n, d
      when 'quantifier'   then quantifier   n, d
      when 'preprocessor' then false

      else switch node.token.type
        when 'operator'   then operator     n, d
        else false


   * walk tree
  tock = tick()

  walk map, null, ast, ''
  tokens = combine()

  tock "GLSL Compile"

   * assembler function that takes map of symbol names
   * and returns GLSL source code
  (prefix = '', replaced = {}) ->
    names = {}
    for key of placeholders
      names[key] = prefix + (replaced[key] ? key)

    out = ""
    for token in tokens
      if token.call
        out += token(names)
      else
        out += token

    out

 * Walk AST, apply map and collect values
debug = false

walk = (map, collect, node, indent) ->
  debug && console.log indent, node.type, node.token?.data, node.token?.type

  recurse = map node, collect

  if recurse
    walk map, collect, child, indent + '  ', debug for child, i in node.children

  null

module.exports = walk
 */

module.exports = compile;


},{}],13:[function(require,module,exports){
module.exports = {
  SHADOW_ARG: '_i_n_o_u_t',
  RETURN_ARG: 'return'
};


},{}],14:[function(require,module,exports){
var decl, get;

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
        quant: !!quant
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
  var c, ident, inout, list, quant, storage, type;
  c = node.children;
  storage = get(c[1]);
  inout = get(c[2]);
  type = get(c[4]);
  list = c[5];
  ident = get(list.children[0]);
  quant = list.children[1];
  return {
    decl: 'argument',
    storage: storage,
    inout: inout,
    type: type,
    ident: ident,
    quant: !!quant
  };
};

decl.param = function(dir, storage, spec, quant) {
  var prefix, suffix;
  prefix = [];
  if (storage != null) {
    prefix.push(storage);
  }
  if (spec != null) {
    prefix.push(spec);
  }
  prefix.push('');
  prefix = prefix.join(' ');
  suffix = quant ? '[' + quant + ']' : '';
  if (dir !== '') {
    dir += ' ';
  }
  return function(name, long) {
    return (long ? dir : '') + ("" + prefix + name + suffix);
  };
};

decl.type = function(name, spec, quant, dir, storage) {
  var defaults, dirs, inout, param, storages, three, type, value, _ref;
  three = {
    float: 'f',
    vec2: 'v2',
    vec3: 'v3',
    vec4: 'v4',
    mat3: 'm3',
    mat4: 'm4',
    sampler2D: 't',
    samplerCube: 't'
  };
  defaults = {
    float: 0,
    vec2: window.THREE ? new THREE.Vector3() : null,
    vec3: window.THREE ? new THREE.Vector3() : null,
    vec4: window.THREE ? new THREE.Vector4() : null,
    mat4: window.THREE ? new THREE.Matrix4() : null,
    sampler2D: 0,
    samplerCube: 0
  };
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
  value = defaults[type];
  inout = (_ref = dirs[dir]) != null ? _ref : dirs["in"];
  storage = storages[storage];
  param = decl.param(dir, storage, spec, quant);
  return {
    name: name,
    type: type,
    spec: spec,
    param: param,
    value: value,
    inout: inout,
    copy: function(name) {
      return decl.copy(this, name);
    }
  };
};

decl.copy = function(type, _name) {
  var copy, inout, name, param, spec, value, _ref;
  _ref = type, name = _ref.name, type = _ref.type, spec = _ref.spec, param = _ref.param, value = _ref.value, inout = _ref.inout, copy = _ref.copy;
  if (_name != null) {
    name = _name;
  }
  return {
    name: name,
    type: type,
    spec: spec,
    param: param,
    value: value,
    inout: inout,
    copy: copy
  };
};


},{}],15:[function(require,module,exports){
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
      calls: []
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
    var arg, args, id, name, param, ret, _i, _len;
    args = [];
    ret = '';
    for (_i = 0, _len = signature.length; _i < _len; _i++) {
      arg = signature[_i];
      param = arg.param;
      name = arg.name;
      if (_.unshadow(name)) {
        continue;
      }
      id = lookup(name);
      if (name === $.RETURN_ARG) {
        ret = id;
      } else {
        args.push(id);
      }
      if (body) {
        if (dangling(name)) {
          if (name === $.RETURN_ARG) {
            if (body["return"] !== '') {
              throw "Error: two unconnected return values within same graph";
            }
            body.type = arg.spec;
            body["return"] = "  return " + id;
            body.vars[id] = "  " + param(id);
            body.signature.push(arg);
          } else {
            body.params.push(param(id, true));
            body.signature.push(arg.copy(id));
          }
        } else {
          body.vars[id] = "  " + param(id);
        }
      }
    }
    return body.calls.push(_.invoke(ret, entry, args));
  },
  build: function(body, calls) {
    var a, b, code, decl, entry, params, ret, type, v, vars;
    entry = body.entry;
    code = null;
    if (calls && body.calls.length === 1 && entry !== 'main') {
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
      calls = body.calls.slice();
      params = body.params;
      type = body.type;
      ret = body["return"];
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
    var b, blocks, i, level, _i, _len;
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
        blocks[i] = b.replace(/([A-Za-z0-9_]+\s+)?[A-Za-z0-9_]+\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*;\s*/mg, '');
      }
    }
    return code = blocks.join('');
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


},{"../graph":19,"./constants":13}],16:[function(require,module,exports){
var k, v, _i, _len, _ref;

exports.compile = require('./compile');

exports.parse = require('./parse');

exports.generate = require('./generate');

_ref = require('./constants');
for (v = _i = 0, _len = _ref.length; _i < _len; v = ++_i) {
  k = _ref[v];
  exports[k] = v;
}


},{"./compile":12,"./constants":13,"./generate":15,"./parse":17}],17:[function(require,module,exports){
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
  var ast, error, errors, tock, _i, _len, _ref, _ref1;
  if (debug) {
    tock = tick();
  }
  _ref = tokenizer().process(parser(), code), (_ref1 = _ref[0], ast = _ref1[0]), errors = _ref[1];
  if (debug) {
    tock('GLSL Tokenize & Parse');
  }
  if (!ast || errors.length) {
    for (_i = 0, _len = errors.length; _i < _len; _i++) {
      error = errors[_i];
      console.error("[ShaderGraph] " + name + " -", error.message);
    }
    throw "GLSL parse error";
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
    return decl.type(symbol.ident, symbol.type, symbol.quant, symbol.inout, symbol.storage);
  };
  func = function(symbol, inout) {
    var a, arg, b, d, def, ins, outs, signature, type, _i, _len;
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
      b.name += $.SHADOW_ARG;
      signature.push(b);
    }
    if (symbol.type !== 'void') {
      signature.push(decl.type($.RETURN_ARG, symbol.type, false, 'out'));
    }
    ins = ((function() {
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
    outs = ((function() {
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
    type = "(" + ins + ")(" + outs + ")";
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


},{"../../vendor/glsl-parser":29,"../../vendor/glsl-tokenizer":33,"./constants":13,"./decl":14}],18:[function(require,module,exports){

/*
  Graph of nodes with outlets
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
      throw "Adding node to two graphs at once";
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
      throw "Removing node from wrong graph.";
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


},{}],19:[function(require,module,exports){
exports.Graph = require('./graph');

exports.Node = require('./node');

exports.Outlet = require('./outlet');

exports.IN = exports.Graph.IN;

exports.OUT = exports.Graph.OUT;


},{"./graph":18,"./node":20,"./outlet":21}],20:[function(require,module,exports){
var Graph, Node, Outlet;

Graph = require('./graph');

Outlet = require('./outlet');


/*
 Node in graph.
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
    outlet.node = this;
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
    outlet.node = null;
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


},{"./graph":18,"./outlet":21}],21:[function(require,module,exports){
var Graph, Outlet;

Graph = require('./graph');


/*
  In/out outlet on node
 */

Outlet = (function() {
  Outlet.index = 0;

  Outlet.id = function(name) {
    return "_io_" + (++Outlet.index) + "_" + name;
  };

  Outlet.hint = function(name) {
    name = name.replace(/^(_io_[0-9]+_)/, '');
    return name = name.replace(/(In|Out|Inout)$/, '');
  };

  function Outlet(inout, name, hint, type, meta) {
    this.inout = inout;
    this.name = name;
    this.hint = hint;
    this.type = type;
    this.meta = meta;
    if (this.hint == null) {
      this.hint = Outlet.hint(name);
    }
    this.node = null;
    this.input = null;
    this.output = [];
    this.id = Outlet.id(this.hint);
  }

  Outlet.prototype.morph = function(outlet) {
    this.inout = outlet.inout;
    this.name = outlet.name;
    this.hint = outlet.hint;
    this.type = outlet.type;
    return this.meta = outlet.meta;
  };

  Outlet.prototype.dupe = function(name) {
    var hint, inout, meta, type;
    if (name == null) {
      name = this.id;
    }
    inout = this.inout, hint = this.hint, type = this.type, meta = this.meta;
    return {
      inout: inout,
      hint: hint,
      type: type,
      meta: meta,
      name: name
    };
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

  return Outlet;

})();

module.exports = Outlet;


},{"./graph":18}],22:[function(require,module,exports){
var Factory, Material, ShaderGraph, Snippet, cache, f, glsl, l, library;

glsl = require('./glsl');

f = require('./factory');

l = require('./linker');

Factory = f.Factory;

Material = f.Material;

library = f.library;

cache = f.cache;

Snippet = l.Snippet;

ShaderGraph = (function() {
  function ShaderGraph(snippets) {
    if (!(this instanceof ShaderGraph)) {
      return new ShaderGraph(snippets);
    }
    this.fetch = cache(library(glsl, snippets, Snippet.load));
  }

  ShaderGraph.prototype.shader = function() {
    return new Factory(glsl, this.fetch);
  };

  ShaderGraph.prototype.material = function() {
    return new Material(this.shader(), this.shader());
  };

  ShaderGraph.Block = require('./block');

  ShaderGraph.Factory = require('./factory');

  ShaderGraph.GLSL = require('./glsl');

  ShaderGraph.Graph = require('./graph');

  ShaderGraph.Linker = require('./linker');

  return ShaderGraph;

})();

module.exports = ShaderGraph;

window.ShaderGraph = ShaderGraph;


/*


code1 = """
float getMultiplier();
float foobar(vec3 color) {
  return color.x * getMultiplier();
}
"""

code2 = """
void foobar(out float valueOut, in float valueIn) {
  valueOut = valueIn * 2.0;
}
"""

code3 = """
void main(in float a, in float b) {
}
"""

code4 = """
float getMultiplier() {
  return 1.5;
}
"""

snippets = {
  'code1': code1
  'code2': code2
  'code3': code3
  'code4': code4
}

shadergraph = ShaderGraph snippets

shader  = shadergraph.shader()
graph   = shader
          .callback()
            .call('code4')
          .join()
          .call('code1')
          .split()
            .call('code2')
          .next()
            .call('code2')
          .join()
          .call('code3')
          .end()

snippet = graph.link()

normalize = (code) ->
   * renumber generated outputs
  map = {}
  o = s = p = 0
  code = code.replace /\b_io_[0-9]+([A-Za-z0-9_]+)\b/g, (match, name) ->
    map[match] ? map[match] = "_io_#{++o}#{name}"
  code = code.replace /\b_sn_[0-9]+([A-Za-z0-9_]+)\b/g, (match, name) ->
    map[match] ? map[match] = "_sn_#{++s}#{name}"
  code = code.replace /\b_pg_[0-9]+_\b/g, (match) ->
    map[match] ? map[match] = "_pg_#{++p}_"

window.graph   = graph
window.snippet = snippet
window.code    = normalize(snippet.code)
 */


/*

code = """
// Comment
uniform float uf;
uniform float ufv1[3];
uniform vec2 uv2;
// Comment
uniform vec2 uv2v[3];
uniform vec3 uv3;
uniform vec3 uv3v[3];
uniform vec4 uv4;
uniform vec4 uv4v[3];
uniform sampler2D ut;
uniform sampler2D utv[3];
varying float vf;
varying float vfv1[3];
varying mat3 vm3;
varying mat3 vm3v[3];
varying mat4 vm4;
varying mat4 vm4v[3];
attribute float af;
attribute float afv1[3];
attribute vec3 av3;
attribute vec3 av3v[3];
attribute mat4 am4;
attribute mat4 am4v[3];

void callback1(in vec4 v4in);

void callback2(in vec3 v3in, out vec4 v4out);

void callback3(in vec3 v3in, in vec4 v4in, out vec4 v4out);

void snippetTest(
  in vec3 v3in, in vec4 v4in, mat3 m3vin[3],
  out vec4 v4out, out vec4 v4vout[3], out mat4 m4out, out mat4 m4vout[3],
  inout vec3 v3inout) {
    callback1(v4in);
    callback2(v3in, v4out);
    callback3(v3in, v4in, v4out);
    gl_FragColor = vec4(v4in.xyz, 1.0);
}
"""











code = """
uniform vec3 color;

 *pragma external
const void callback(const in vec4 rgba);

 *pragma export
void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); };

"""







code = """
uniform vec2 sampleStep;

uniform float fadeOut;
uniform float field;
uniform float time;

uniform sampler2D texture;
varying vec2 vUV;

float randf(vec2 xy) {
  return fract(sin(dot(xy, vec2(3.1380, 7.41)) * 13.414) * 1414.32);
}

const float c = .9999875;
const float s = .005;
const mat2 roto1 = mat2(c, s, -s, c);
const mat2 roto2 = mat2(c, -s, s, c);

const float c2 = .9998;
const float s2 = .02;
const mat2 roto3 = mat2(c2, -s2, s2, c2);

vec2 rotozoom(vec2 xy) {
  float r = sqrt(dot(xy, xy));
  xy *= (7.0 * r + sin(r)) * .125 / r;
  xy *= roto1;

  return xy;
}

vec2 planeproject(vec2 xy) {
  float f = .0625 * (15.0 + 1.0 / (-xy.y + 1.5));
  xy *= f;
  xy *= roto2;

  return xy;
}

vec2 ball(vec2 xy) {
  float r = sqrt(dot(xy, xy));
  xy *= (3.0 + 1.75 * tan(r * .5) / r) * .25;
  xy *= roto3;

  return xy;
}

vec2 swirl(vec2 xy) {
  vec2 a = xy * 2.25 * 6.28;
  xy += vec2(sin(a.y), sin(a.x)) * .01;

  vec2 b = xy * 4.5 * 6.28;
  xy += vec2(-sin(b.y), sin(b.x)) * .01;

  vec2 c = xy * 9.0 * 6.28;
  xy += vec2(-sin(c.y), -sin(c.x)) * .01;
  return xy;
}

vec2 warp(vec2 xy, float q) {

  float r = sqrt(dot(xy, xy));
  float th = atan(xy.y, xy.x) * 6.0;
  float f = .99 * (r + sin(r * r * q * .5 + time + sin(th) * 2.0) * .02) / r;

  return xy * f;
}

vec2 tiles(vec2 xy) {

  vec2 grid = floor(xy * 9.0);
  float index = mod(grid.x + grid.y + (1.0 + grid.x) * grid.x * grid.y * 3.0, 4.0);

  float d = .01;
  if (index < .5) {
    xy.x += d;
  }
  else if (index < 1.5) {
    xy.x -= d;
  }
  else if (index < 2.5) {
    xy.y += d;
  }
  else {
    xy.y -= d;
  }

  return xy;
}

vec2 flower(vec2 xy) {
  vec2 orig = xy;
  float r = sqrt(dot(xy, xy));
  float th = atan(xy.y, xy.x);

  float th2 = th + sin(r * 64.0);
  float r2 = r + sin(th * 64.0);

  return mix(orig, vec2(cos(th2) * r2, sin(th2) * r2), .01);
}

vec2 rotate(vec2 xy, vec2 ref, float a) {
  vec2 diff = xy - ref;
  float c = cos(a);
  float s = sin(a);
  return ref + diff * mat2(c, -s, s, c);
}

void callback();

void main() {
  vec2 xy = (vUV * 2.0 - 1.0) * vec2(16.0/9.0, 1.0);
  vec2 pos = xy;

  callback();

  if (field > 0.0) {

    if (field < 1.0) {
      xy = mix(xy, rotozoom(pos), clamp(field, 0.0, 1.0));
    }
    else if (field < 2.0) {
      xy = rotozoom(pos);
      xy = mix(xy, planeproject(pos), clamp(field - 1.0, 0.0, 1.0));
    }
    else if (field < 3.0) {
      xy = planeproject(pos);
      xy = mix(xy, ball(pos), clamp(field - 2.0, 0.0, 1.0));
    }
    else if (field < 4.0) {
      xy = ball(pos);
      xy = mix(xy, rotate(xy, pos, time), clamp(field - 3.0, 0.0, 1.0));
    }
    else if (field < 5.0) {
      xy = ball(pos);
      xy = rotate(xy, pos, time);
      xy = mix(xy, rotate(swirl(pos), pos, time), clamp(field - 4.0, 0.0, 1.0) * .5);
    }
    else if (field < 6.0) {
      xy = ball(pos);
      xy = rotate(xy, pos, time);
      xy = mix(xy, rotate(swirl(pos), pos, time), .5);
      xy = mix(xy, mix(rotate(warp(pos * 1.131, 32.0) / 1.131, pos, -time * 1.711), rotate(warp(pos, 27.0), pos, time), .5), clamp(field - 5.0, 0.0, 1.0));
    }
    else if (field < 7.0) {
      xy = mix(rotate(warp(pos * 1.131, 32.0) / 1.131, pos, -time * 1.711), rotate(warp(pos, 27.0), pos, time), .5);
      xy = mix(xy, rotate(tiles(pos), pos, -time), clamp(field - 6.0, 0.0, 1.0));
    }
    else { //if (field < 8.0) {
      xy = rotate(tiles(pos), pos, -time) * .995;
      xy = mix(xy, flower(pos), clamp(field - 7.0, 0.0, 1.0));
    }

    xy += sampleStep * .2;
  }

  xy *= vec2(9.0/16.0, 1.0);

  vec2 uv = fract(xy * .5 + .5);
  vec4 sample = texture2D(texture, uv);

  gl_FragColor = vec4(sample.xyz - vec3(fadeOut), 1.0);

}

"""







code = """
uniform vec2 sampleStep;

uniform float uf1[2], uf2[3];
uniform float fadeOut;
uniform float field[3];
uniform float time, space;
uniform float aa[2], bb[3], cc, dd, ee[4];

uniform sampler2D texture;
varying vec2 vUV;
// woo
const float cf1, cf2;
vec4 gv4;

 *pragma woo
 *if

float randf(vec2 xy) {
  vec2 a[2], b, c;
  float x = cf1 + cf2;
  float d, e, f;
  return fract(sin(dot(xy, vec2(3.1380, 7.41)) * 1.0 * 2.0 / 3.0 / 4.0 * 5.0) * 1414.32);
}

"""
 */


},{"./block":4,"./factory":9,"./glsl":16,"./graph":19,"./linker":24}],23:[function(require,module,exports){
var Graph, assemble;

Graph = require('../graph');


/*
  Program assembler

  Builds composite program that can act as new module/snippet
  Unconnected input/outputs and undefined callbacks are exposed in the new global/main scope
  If there is only one call with an identical call signature, a #define is output instead.
 */

assemble = function(language, namespace, calls) {
  var attributes, externals, generate, handle, include, includes, isDangling, lookup, process, uniforms;
  generate = language.generate;
  externals = {};
  uniforms = {};
  attributes = {};
  includes = [];
  process = function() {
    var body, code, main, _ref;
    _ref = handle(calls), body = _ref[0], calls = _ref[1];
    if (namespace != null) {
      body.entry = namespace;
    }
    main = generate.build(body, calls);
    includes.push(main.code);
    code = generate.lines(includes);
    return {
      namespace: main.name,
      code: code,
      main: main,
      entry: main.name,
      externals: externals,
      uniforms: uniforms,
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
      call = function(node, module) {
        var entry, main, _dangling, _lookup;
        include(node, module);
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
        call(c.node, c.module);
      }
      return [body, calls];
    };
  })(this);
  include = function(node, module) {
    var def, key, _ref, _ref1, _ref2, _results;
    includes.push(module.code);
    _ref = module.uniforms;
    for (key in _ref) {
      def = _ref[key];
      uniforms[key] = def;
    }
    _ref1 = module.attributes;
    for (key in _ref1) {
      def = _ref1[key];
      attributes[key] = def;
    }
    _ref2 = module.externals;
    _results = [];
    for (key in _ref2) {
      def = _ref2[key];
      if (isDangling(node, def.name)) {
        _results.push(externals[key] = def);
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
    var input, outlet;
    outlet = node.get(name);
    if (outlet.input) {
      outlet = outlet.input;
    }
    name = outlet.name;
    input = generate.unshadow(name);
    if (input) {
      return lookup(outlet.node, input);
    } else {
      return outlet.id;
    }
  };
  return process();
};

module.exports = assemble;


},{"../graph":19}],24:[function(require,module,exports){
exports.Snippet = require('./snippet');

exports.Program = require('./program');

exports.Layout = require('./layout');

exports.assemble = require('./assemble');

exports.link = require('./link');

exports.load = exports.Snippet.load;


},{"./assemble":23,"./layout":25,"./link":26,"./program":27,"./snippet":28}],25:[function(require,module,exports){
var Layout, Snippet, link;

Snippet = require('./snippet');

link = require('./link');


/*
  Program linkage layout
  
  Entry points are added to its dependency graph
  Callbacks are linked either with a go-between function
  or a #define if the signatures are identical.
 */

Layout = (function() {
  function Layout(language) {
    this.language = language;
    this.links = [];
    this.includes = [];
    this.modules = {};
    this.visits = {};
  }

  Layout.prototype.callback = function(node, module, name, external) {
    return this.links.push({
      node: node,
      module: module,
      name: name,
      external: external
    });
  };

  Layout.prototype.include = function(node, module) {
    if (this.modules[module.namespace]) {
      return;
    }
    this.modules[module.namespace] = true;
    return this.includes.push({
      node: node,
      module: module
    });
  };

  Layout.prototype.visit = function(namespace) {
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
    return snippet;
  };

  return Layout;

})();

module.exports = Layout;


},{"./link":26,"./snippet":28}],26:[function(require,module,exports){

/*
 Callback linker
 
 Imports given modules and generates linkages for registered callbacks.

 Builds composite program that can act as new module/snippet
 with single module as exported entry point
 */
var link;

link = function(language, links, modules, exported) {
  var attributes, externals, generate, include, includes, isDangling, process, uniforms;
  generate = language.generate;
  includes = [];
  externals = {};
  uniforms = {};
  attributes = {};
  includes = [];
  process = function() {
    var code, e, exports, m, _i, _len;
    exports = generate.links(links);
    if (exports.defs !== '') {
      includes.push(exports.defs);
    }
    if (exports.bodies !== '') {
      includes.push(exports.bodies);
    }
    modules.reverse();
    for (_i = 0, _len = modules.length; _i < _len; _i++) {
      m = modules[_i];
      include(m.node, m.module);
    }
    code = generate.lines(includes);
    code = generate.hoist(code);
    e = exported;
    return {
      namespace: e.main.name,
      main: e.main,
      entry: e.main.name,
      externals: externals,
      uniforms: uniforms,
      attributes: attributes,
      code: code
    };
  };
  isDangling = function(node, name) {
    var module, outlet, _ref, _ref1;
    outlet = node.get(name);
    if (!outlet) {
      module = (_ref = (_ref1 = node.owner.snippet) != null ? _ref1._name : void 0) != null ? _ref : node.owner.namespace;
      throw "Unable to link program. Unlinked callback `" + name + "` on `" + module + "`";
    }
    if (outlet.inout === Graph.IN) {
      return outlet.input === null;
    } else if (outlet.inout === Graph.OUT) {
      return outlet.output.length === 0;
    }
  };
  include = function(node, module) {
    var def, key, _ref, _ref1, _ref2, _results;
    includes.push(generate.defuse(module.code));
    _ref = module.uniforms;
    for (key in _ref) {
      def = _ref[key];
      uniforms[key] = def;
    }
    _ref1 = module.attributes;
    for (key in _ref1) {
      def = _ref1[key];
      attributes[key] = def;
    }
    _ref2 = module.externals;
    _results = [];
    for (key in _ref2) {
      def = _ref2[key];
      if (isDangling(node, def.name)) {
        _results.push(externals[key] = def);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };
  return process();
};

module.exports = link;


},{}],27:[function(require,module,exports){
var Program, Snippet, assemble;

Snippet = require('./snippet');

assemble = require('./assemble');


/*
  Program assembly model
  
  Snippets are added to its queue, registering calls and code includes.
  
  When assemble() is called, it builds a main() function to
  execute all calls in order.
  
  The result is a new instance of Snippet that acts as if it
  was parsed from the combined source of the component
  nodes.
 */

Program = (function() {
  Program.index = 0;

  Program.entry = function() {
    return "_pg_" + (++Program.index) + "_";
  };

  function Program(language, namespace) {
    this.language = language;
    this.namespace = namespace;
    this.calls = {};
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

  Program.prototype.assemble = function() {
    var data, key, snippet, _ref;
    data = assemble(this.language, (_ref = this.namespace) != null ? _ref : Program.entry, this.calls);
    snippet = new Snippet;
    for (key in data) {
      snippet[key] = data[key];
    }
    return snippet;
  };

  return Program;

})();

module.exports = Program;


},{"./assemble":23,"./snippet":28}],28:[function(require,module,exports){
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
    return new Snippet(language, sigs, compiler, name);
  };

  function Snippet(language, _signatures, _compiler, _name) {
    this.language = language;
    this._signatures = _signatures;
    this._compiler = _compiler;
    this._name = _name;
    this.namespace = null;
    this.code = null;
    this.main = null;
    this.entry = null;
    this.uniforms = null;
    this.externals = null;
    this.attributes = null;
  }

  Snippet.prototype.clone = function() {
    return new Snippet(this.language, this._signatures, this._compiler, this._name);
  };

  Snippet.prototype.bind = function(uniforms, namespace) {
    var a, def, e, name, redef, u, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    this.namespace = namespace;
    if (this.namespace == null) {
      this.namespace = Snippet.namespace();
    }
    this.code = this._compiler(this.namespace);
    this.main = this._signatures.main;
    this.entry = this.namespace + this.main.name;
    this.uniforms = {};
    this.externals = {};
    this.attributes = {};
    u = (function(_this) {
      return function(def, name) {
        return _this.uniforms[_this.namespace + (name != null ? name : def.name)] = def;
      };
    })(this);
    e = (function(_this) {
      return function(def) {
        return _this.externals[_this.namespace + def.name] = def;
      };
    })(this);
    a = (function(_this) {
      return function(def) {
        return _this.attributes[def.name] = def;
      };
    })(this);
    redef = function(def) {
      return {
        type: def.type,
        name: def.name,
        value: def.value
      };
    };
    _ref = this._signatures.uniform;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      def = _ref[_i];
      u(redef(def));
    }
    _ref1 = this._signatures.external;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      def = _ref1[_j];
      e(def);
    }
    _ref2 = this._signatures.attribute;
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      def = _ref2[_k];
      a(redef(def));
    }
    for (name in uniforms) {
      def = uniforms[name];
      u(def, name);
    }
    return null;
  };

  return Snippet;

})();

module.exports = Snippet;


},{}],29:[function(require,module,exports){
module.exports = require('./lib/index')

},{"./lib/index":31}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
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

},{"../../through":37,"./expr":30,"./scope":32}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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

},{"../through":37,"./lib/builtins":34,"./lib/literals":35,"./lib/operators":36}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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

},{}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
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


},{}]},{},[22])