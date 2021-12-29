/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Graph } from "./graph";
import { Outlet } from "./outlet";

/*
 Node in graph.
*/
export class Node {
  static initClass() {
    this.index = 0;
  }
  static id(name) {
    return ++Node.index;
  }

  constructor(owner, outlets) {
    this.owner = owner;
    this.graph = null;
    this.inputs = [];
    this.outputs = [];
    this.all = [];
    this.outlets = null;
    this.id = Node.id();

    this.setOutlets(outlets);
  }

  // Retrieve input
  getIn(name) {
    return Array.from(this.inputs).filter((outlet) => outlet.name === name)[0];
  }

  // Retrieve output
  getOut(name) {
    return Array.from(this.outputs).filter((outlet) => outlet.name === name)[0];
  }

  // Retrieve by name
  get(name) {
    return this.getIn(name) || this.getOut(name);
  }

  // Set new outlet definition
  setOutlets(outlets) {
    if (outlets != null) {
      // First init
      let outlet;
      if (this.outlets == null) {
        this.outlets = {};
        for (outlet of Array.from(outlets)) {
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
        return;
      }

      // Return new/old outlet matching hash key
      const hash = (
        outlet // Match by name, direction and type.
      ) => [outlet.name, outlet.inout, outlet.type].join("-");

      // Build hash of new outlets
      const match = {};
      for (outlet of Array.from(outlets)) {
        match[hash(outlet)] = true;
      }

      // Remove missing outlets, record matches
      for (let key in this.outlets) {
        outlet = this.outlets[key];
        key = hash(outlet);
        if (match[key]) {
          match[key] = outlet;
        } else {
          this._remove(outlet);
        }
      }

      // Insert new outlets
      for (outlet of Array.from(outlets)) {
        // Find match by hash
        const existing = match[hash(outlet)];
        if (existing instanceof Outlet) {
          // Update existing outlets in place to retain connections.
          this._morph(existing, outlet);
        } else {
          // Spawn new outlet
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
      }

      this;
    }
    return this.outlets;
  }

  // Connect to the target node by matching up inputs and outputs.
  connect(node, empty, force) {
    let dest, dests, hint, source, type;
    const outlets = {};
    const hints = {};

    const typeHint = (outlet) => type + "/" + outlet.hint;

    // Hash the types/hints of available target outlets.
    for (dest of Array.from(node.inputs)) {
      // Only autoconnect if not already connected
      var list;
      if (!force && dest.input) {
        continue;
      }

      // Match outlets by type/name hint, then type/position key
      ({ type } = dest);
      hint = typeHint(dest);

      if (!hints[hint]) {
        hints[hint] = dest;
      }
      outlets[type] = list = outlets[type] || [];
      list.push(dest);
    }

    // Available source outlets
    let sources = this.outputs;

    // Ignore connected source if only matching empties.
    sources = sources.filter((outlet) => !(empty && outlet.output.length));

    // Match hints first
    for (source of Array.from(sources.slice())) {
      // Match outlets by type and name
      ({ type } = source);
      hint = typeHint(source);
      dests = outlets[type];

      // Connect if found
      if ((dest = hints[hint])) {
        source.connect(dest);

        // Remove from potential set
        delete hints[hint];
        dests.splice(dests.indexOf(dest), 1);
        sources.splice(sources.indexOf(source), 1);
      }
    }

    // Match what's left
    if (!sources.length) {
      return this;
    }
    for (source of Array.from(sources.slice())) {
      ({ type } = source);
      dests = outlets[type];

      // Match outlets by type and order
      if (dests && dests.length) {
        // Link up and remove from potential set
        source.connect(dests.shift());
      }
    }

    return this;
  }

  // Disconnect entire node
  disconnect(node) {
    let outlet;
    for (outlet of Array.from(this.inputs)) {
      outlet.disconnect();
    }
    for (outlet of Array.from(this.outputs)) {
      outlet.disconnect();
    }

    return this;
  }

  // Return hash key for outlet
  _key(outlet) {
    return [outlet.name, outlet.inout].join("-");
  }

  // Add outlet object to node
  _add(outlet) {
    const key = this._key(outlet);

    // Sanity checks
    if (outlet.node) {
      throw new Error("Adding outlet to two nodes at once.");
    }
    if (this.outlets[key]) {
      throw new Error(`Adding two identical outlets to same node. (${key})`);
    }

    // Link back outlet
    outlet.node = this;

    // Add to name hash and inout list
    if (outlet.inout === Graph.IN) {
      this.inputs.push(outlet);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.push(outlet);
    }
    this.all.push(outlet);
    return (this.outlets[key] = outlet);
  }

  // Morph outlet to other
  _morph(existing, outlet) {
    let key = this._key(outlet);
    delete this.outlets[key];

    existing.morph(outlet);

    key = this._key(outlet);
    return (this.outlets[key] = outlet);
  }

  // Remove outlet object from node.
  _remove(outlet) {
    const key = this._key(outlet);
    const { inout } = outlet;

    // Sanity checks
    if (outlet.node !== this) {
      throw new Error("Removing outlet from wrong node.");
    }

    // Disconnect outlet.
    outlet.disconnect();

    // Unlink outlet.
    outlet.node = null;

    // Remove from name list and inout list.
    delete this.outlets[key];
    if (outlet.inout === Graph.IN) {
      this.inputs.splice(this.inputs.indexOf(outlet), 1);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.splice(this.outputs.indexOf(outlet), 1);
    }
    this.all.splice(this.all.indexOf(outlet), 1);
    return this;
  }
}
Node.initClass();
