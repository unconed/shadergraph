/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = false;
const Visualize = require('../visualize');

const tick = function() {
  const now = +new Date;
  return function(label) {
    const delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

class Material {
  constructor(vertex, fragment) {
    this.vertex = vertex;
    this.fragment = fragment;
    if (debug) { this.tock = tick(); }
  }

  build(options) { return this.link(options); }
  link(options) {
    if (options == null) { options = {}; }
    const uniforms   = {};
    const varyings   = {};
    const attributes = {};

    const vertex   = this.vertex  .link('main');
    const fragment = this.fragment.link('main');

    for (let shader of [vertex, fragment]) {
      var key, value;
      for (key in shader.uniforms) { value = shader.uniforms[key]; uniforms[key]   = value; }
      for (key in shader.varyings) { value = shader.varyings[key]; varyings[key]   = value; }
      for (key in shader.attributes) { value = shader.attributes[key]; attributes[key] = value; }
    }

    options.vertexShader   = vertex  .code;
    options.vertexGraph    = vertex  .graph;
    options.fragmentShader = fragment.code;
    options.fragmentGraph  = fragment.graph;
    options.attributes     = attributes;
    options.uniforms       = uniforms;
    options.varyings       = varyings;
    options.inspect        = () => Visualize.inspect('Vertex Shader', vertex, 'Fragment Shader', fragment.graph);

    if (debug) { this.tock('Material build'); }

    return options;
  }

  inspect() {
    return Visualize.inspect('Vertex Shader', this.vertex, 'Fragment Shader', this.fragment.graph);
  }
}

module.exports = Material;
