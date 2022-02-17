/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Graph } from "../graph";
import * as Block from "../block";
import * as Visualize from "../visualize";

/*
  Chainable factory

  Exposes methods to build a graph incrementally
*/
export class Factory {
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
    this._group("_combine", true);
    return this;
  }

  // Create parallel branches that fan out from the end
  // (multiple outgoing connections per outlet)
  fan() {
    this._group("_combine", false);
    return this;
  }

  // Create isolated subgraph
  isolate() {
    this._group("_isolate");
    return this;
  }

  // Create callback subgraph
  callback() {
    this._group("_callback");
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
    const { op } = sub;
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
    while ((this._stack != null ? this._stack.length : undefined) > 1) {
      this.end();
    }

    // Remember terminating node(s) of graph
    if (this._graph) {
      this._tail(this._state, this._graph);
    }

    const graph = this._graph;

    this._graph = new Graph();
    this._state = new State();
    this._stack = [this._state];

    return graph;
  }

  // Compile shortcut (graph is thrown away)
  compile(namespace) {
    if (namespace == null) {
      namespace = "main";
    }
    return this.graph().compile(namespace);
  }

  // Link shortcut (graph is thrown away)
  link(namespace) {
    if (namespace == null) {
      namespace = "main";
    }
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
    // Ignore empty concat
    let block;
    if (factory._state.nodes.length === 0) {
      return this;
    }

    this._tail(factory._state, factory._graph);

    try {
      block = new Block.Isolate(factory._graph);
    } catch (error) {
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
    // Check for empty require
    let block;
    if (factory._state.nodes.length === 0) {
      throw "Can't import empty callback";
    }

    this._tail(factory._state, factory._graph);

    try {
      block = new Block.Callback(factory._graph);
    } catch (error) {
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
    for (const to of Array.from(sub.start)) {
      for (const from of Array.from(main.end)) {
        from.connect(to, sub.multi);
      }
    }

    main.end = sub.end;
    return (main.nodes = main.nodes.concat(sub.nodes));
  }

  // Make subgraph and connect to tail
  _isolate(sub, _main) {
    if (sub.nodes.length) {
      let block;
      const subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);

      try {
        block = new Block.Isolate(subgraph);
      } catch (error) {
        if (this.config.autoInspect) {
          Visualize.inspect(error, this._graph, subgraph);
        }
        throw error;
      }

      return this._auto(block);
    }
  }

  // Convert to callback and connect to tail
  _callback(sub, _main) {
    if (sub.nodes.length) {
      let block;
      const subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);

      try {
        block = new Block.Callback(subgraph);
      } catch (error) {
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
    state.end = tail;
    state.tail = [];

    if (!graph.tail) {
      throw new Error("Cannot finalize empty graph");
    }

    // Add compile/link/export/inspect shortcut methods
    graph.compile = (namespace) => {
      if (namespace == null) {
        namespace = "main";
      }
      try {
        return graph.tail.owner.compile(this.language, namespace);
      } catch (error) {
        if (this.config.autoInspect) {
          graph.inspect(error);
        }
        throw error;
      }
    };

    graph.link = (namespace) => {
      if (namespace == null) {
        namespace = "main";
      }
      try {
        return graph.tail.owner.link(this.language, namespace);
      } catch (error) {
        if (this.config.autoInspect) {
          graph.inspect(error);
        }
        throw error;
      }
    };

    graph.export = (layout, depth) => {
      return graph.tail.owner.export(layout, depth);
    };

    return (graph.inspect = (message = null) =>
      Visualize.inspect(message, graph));
  }

  // Create group for branches or callbacks
  _group(op, multi) {
    this._push(op, multi); // Accumulator
    this._push(); // Current
    return this;
  }

  // Merge branch into accumulator and reset state
  _next() {
    const sub = this._pop();

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
    return (this._state = this._stack[0]);
  }

  _pop() {
    let left;
    this._state = this._stack[1];
    if (this._state == null) {
      this._state = new State();
    }
    return (left = this._stack.shift()) != null ? left : new State();
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
    const { node } = block;
    this._graph.add(node);

    for (end of Array.from(this._state.end)) {
      end.connect(node);
    }

    if (!this._state.start.length) {
      this._state.start = [node];
    }
    this._state.end = [node];

    this._state.nodes.push(node);
    if (!node.outputs.length) {
      this._state.tail.push(node);
    }
  }

  // Add block and connect to start
  _prepend(block) {
    let start;
    const { node } = block;
    this._graph.add(node);

    for (start of Array.from(this._state.start)) {
      node.connect(start);
    }

    if (!this._state.end.length) {
      this._state.end = [node];
    }
    this._state.start = [node];

    this._state.nodes.push(node);
    if (!node.outputs.length) {
      this._state.tail.push(node);
    }
  }

  // Insert loose block
  _insert(block) {
    const { node } = block;
    this._graph.add(node);

    this._state.start.push(node);
    this._state.end.push(node);

    this._state.nodes.push(node);
    if (!node.outputs.length) {
      return this._state.tail.push(node);
    }
  }
}

class State {
  constructor(op = null, multi, start, end, nodes, tail) {
    this.op = op;
    if (multi == null) {
      multi = false;
    }
    this.multi = multi;
    if (start == null) {
      start = [];
    }
    this.start = start;
    if (end == null) {
      end = [];
    }
    this.end = end;
    if (nodes == null) {
      nodes = [];
    }
    this.nodes = nodes;
    if (tail == null) {
      tail = [];
    }
    this.tail = tail;
  }
}
