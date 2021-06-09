/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Graph } from './graph';

/*
  In/out outlet on node
*/
export class Outlet {
  static initClass() {

    this.index = 0;
  }
  static make(outlet, extra) {
    if (extra == null) { extra = {}; }
    const meta = extra;
    if (outlet.meta != null) { for (let key in outlet.meta) { const value = outlet.meta[key]; meta[key] = value; } }
    return new Outlet(outlet.inout,
               outlet.name,
               outlet.hint,
               outlet.type,
               meta);
  }
  static id(name) {
    return `_io_${++Outlet.index}_${name}`;
  }

  static hint(name) {
    name = name.replace(/^_io_[0-9]+_/, '');
    name = name.replace(/_i_o$/, '');
    return name = name.replace(/(In|Out|Inout|InOut)$/, '');
  }

  constructor(inout, name, hint, type, meta, id) {
    this.inout = inout;
    this.name = name;
    this.hint = hint;
    this.type = type;
    if (meta == null) { meta = {}; }
    this.meta = meta;
    this.id = id;
    if (this.hint == null) {  this.hint = Outlet.hint(this.name); }

    this.node   = null;
    this.input  = null;
    this.output = [];
    if (this.id == null) {    this.id = Outlet.id(this.hint); }
  }

  // Change into given outlet without touching connections
  morph(outlet) {
    this.inout = outlet.inout;
    this.name  = outlet.name;
    this.hint  = outlet.hint;
    this.type  = outlet.type;
    return this.meta  = outlet.meta;
  }

  // Copy with unique name and cloned metadata
  dupe(name) {
    if (name == null) { name = this.id; }
    const outlet = Outlet.make(this);
    outlet.name = name;
    return outlet;
  }

  // Connect to given outlet
  connect(outlet) {

    // Auto-reverse in/out to out/in
    if ((this.inout === Graph.IN)  && (outlet.inout === Graph.OUT)) {
      return outlet.connect(this);
    }

    // Disallow bad combinations
    if ((this.inout !== Graph.OUT) || (outlet.inout !== Graph.IN)) {
      throw new Error("Can only connect out to in.");
    }

    // Check for existing connection
    if (outlet.input === this) { return; }

    // Disconnect existing connections
    outlet.disconnect();

    // Add new connection.
    outlet.input = this;
    return this.output.push(outlet);
  }

  // Disconnect given outlet (or all)
  disconnect(outlet) {
    // Disconnect input from the other side.
    if (this.input) {
      this.input.disconnect(this);
    }

    if (this.output.length) {

      if (outlet) {
        // Remove one outgoing connection.
        const index = this.output.indexOf(outlet);
        if (index >= 0) {
          this.output.splice(index, 1);
          return outlet.input = null;
        }

      } else {
        // Remove all outgoing connections.
        for (outlet of Array.from(this.output)) { outlet.input = null; }
        return this.output = [];
      }
    }
  }
}
Outlet.initClass();
