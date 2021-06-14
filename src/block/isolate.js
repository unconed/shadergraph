/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Graph } from "../graph";
import { Block } from "./block";

/*
  Isolate a subgraph as a single node
*/
export class Isolate extends Block {
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
    for (let set of ["inputs", "outputs"]) {
      for (let outlet of Array.from(this.graph[set]())) {
        // Preserve name of 'return' and 'callback' outlets
        let name = undefined;
        if (
          ["return", "callback"].includes(outlet.hint) &&
          outlet.inout === Graph.OUT
        ) {
          name = outlet.hint;
        }

        // Unless it already exists
        if (seen[name] != null) {
          name = undefined;
        }

        // Dupe outlet and remember link to original
        const dupe = outlet.dupe(name);
        if (dupe.meta.child == null) {
          dupe.meta.child = outlet;
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
    return (this.subroutine = this.graph.compile(this.namespace));
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
}
