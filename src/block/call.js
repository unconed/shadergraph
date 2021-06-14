/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Block } from './block';

export class Call extends Block {
  constructor(snippet) {
    super(true);

    this.snippet = snippet;
    this.namespace = snippet.namespace;
    this.construct();
  }

  clone() {
    return new Call(this.snippet);
  }

  makeOutlets() {
    const main      = this.snippet.main.signature;
    const {
      externals
    } = this.snippet;
    const {
      symbols
    } = this.snippet;

    const params    = (Array.from(main).map((outlet) => this._outlet(outlet,         {callback: false})));
    const callbacks = (Array.from(symbols).map((key) => this._outlet(externals[key], {callback: true})));

    return params.concat(callbacks);
  }

  call(program, depth) {
    this._call(this.snippet, program, depth);
    return this._inputs(this.snippet, program, depth);
  }

  export(layout, depth) {
    if (!layout.visit(this.namespace, depth)) { return; }

    this._link(this.snippet, layout, depth);
    return this._trace(this.snippet, layout, depth);
  }
}
