/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import * as Snippet from './snippet';
import * as link from './link';

const debug = false;

/*
  Program linkage layout

  Entry points are added to its dependency graph
  Callbacks are linked either with a go-between function
  or a #define if the signatures are identical.
*/
export class Layout {

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
