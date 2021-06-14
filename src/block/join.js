/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Block } from "./block";

/*
  Join multiple disconnected nodes
*/
export class Join extends Block {
  constructor(nodes) {
    super(true);
    this.nodes = nodes;
    this.construct();
  }

  clone() {
    return new Join(this.nodes);
  }

  makeOutlets() {
    return [];
  }

  call(program, depth) {
    return (() => {
      const result = [];
      for (let node of Array.from(this.nodes)) {
        const block = node.owner;
        result.push(block.call(program, depth));
      }
      return result;
    })();
  }

  export(layout, depth) {
    return (() => {
      const result = [];
      for (let node of Array.from(this.nodes)) {
        const block = node.owner;
        result.push(block.export(layout, depth));
      }
      return result;
    })();
  }
}
