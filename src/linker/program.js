/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Snippet } from "./snippet";
import { assemble } from "./assemble";

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
export class Program {
  static initClass() {
    this.index = 0;
  }
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
    let exists;
    const ns = module.namespace;

    // Merge all calls down into one with the right priority
    if ((exists = this.calls[ns])) {
      exists.priority = Math.max(exists.priority, priority);
    } else {
      this.calls[ns] = { node, module, priority };
    }

    return this;
  }

  // Require a given (callback) module's externals
  require(node, module) {
    const ns = module.namespace;
    return (this.requires[ns] = { node, module });
  }

  // Compile queued ops into result
  assemble() {
    const data = assemble(
      this.language,
      this.namespace != null ? this.namespace : Program.entry,
      this.calls,
      this.requires
    );
    const snippet = new Snippet();
    for (const key in data) {
      snippet[key] = data[key];
    }
    snippet.graph = this.graph;
    return snippet;
  }
}
Program.initClass();
