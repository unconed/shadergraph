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
export class Graph {
  static initClass() {
    this.index = 0;

    this.IN = 0;
    this.OUT = 1;
  }
  // eslint-disable-next-line no-unused-vars
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
    this.nodes.push(node);
  }

  remove(node, ignore) {
    if (node.length) {
      for (let _node of Array.from(node)) { this.remove(_node); }
      return;
    }

    if (node.graph !== this) { throw new Error("Removing node from wrong graph."); }

    ignore || node.disconnect();

    this.nodes.splice(this.nodes.indexOf(node), 1);
    node.graph = null;
  }

  adopt(node) {
    if (node.length) {
      for (let _node of Array.from(node)) { this.adopt(_node); }
      return;
    }

    node.graph.remove(node, true);
    this.add(node, true);
  }
}
Graph.initClass();
