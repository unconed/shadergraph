shadergraph
==========

*Functional GLSL linker*

![Shader Graph](https://raw.github.com/unconed/shadergraph/master/docs/images/require.png)

ShaderGraph is a library for linking together GLSL snippets into stand-alone
shaders. It is mainly meant to build complicated shaders 100% programmatically.
But it can also act as the back-end to a live graph-based shader editor, as its
graph model is persistent.

Snippets can be simple one-liners, or multi-function source files. Snippets can
also declare *callbacks*, as functions without bodies, linked in from elsewhere.
This allows complicated execution flows to be built very easily.

```c
vec3 getColor();
void main() {
  gl_FragColor = vec4(getColor(), 1.0);
}
```

ShaderGraph is designed to play well with Three.js, but does not depend on it.
It merely follows the same code/object conventions.

There is no editing UI included, only a way to display a graph as an
HTML/CSS/SVG diagram.

* * *

Live Examples
---
ShaderGraph
 * [Require](http://acko.net/files/shadergraph2/examples/require.html)
 * [Combined Vertex/Fragment Material](http://acko.net/files/shadergraph2/examples/material.html)
 * [Instanced Uniform](http://acko.net/files/shadergraph2/examples/uniform.html)
 * [De-duped Attributes](http://acko.net/files/shadergraph2/examples/dedupe.html)
 * [Split Outputs](http://acko.net/files/shadergraph2/examples/split.html)
 * [Fanned Outputs](http://acko.net/files/shadergraph2/examples/fan.html)
 * [Passed Outputs](http://acko.net/files/shadergraph2/examples/pass.html)
 * [Isolate Subgraphs](http://acko.net/files/shadergraph2/examples/isolate.html)
 * [Deep Nesting](http://acko.net/files/shadergraph2/examples/deep.html)
 * [Deep Callback](http://acko.net/files/shadergraph2/examples/deepcallback.html)
 * [Isolated require](http://acko.net/files/shadergraph2/examples/wrap.html)

ShaderGraph 2 drives all shaders in MathBox² (in development). For more info,
see the articles on acko.net:

 * [ShaderGraph 2](http://acko.net/blog/shadergraph-2)
 * [MathBox²](http://acko.net/blog/mathbox2)

Here's a real-world vertex shader for a line primitive, sampling color and
position from two textures:

<a href="http://acko.net/files/shadergraph2/vertex-color-shader-tidy.png"><img src="http://acko.net/files/shadergraph2/vertex-color-shader-tidy.png"></a>

<a href="http://acko.net/files/mathbox2/iframe-readyornot.html"><img src="http://acko.net/files/mathbox2/cover2.jpg" alt="MathBox 2 - Audio Visualizer example"></a>

You can also use ShaderGraph's graph visualizer directly for other purposes:

 * [Raw Graph](http://acko.net/files/shadergraph2/examples/graph.html)

Basic Use
---

Install via bower:

```
bower install shadergraph
```

Include `build/shadergraph.js`.

To use ShaderGraph, you initialize it once with a given snippet library. A
snippet library is either a dictionary of named snippets, or a fetch function.

```javascript
// Dynamic fetch
var fetch = function (name) {
  return "..."
};

// Static fetch
var fetch = {
  getColor:     "...",
  setColor:     "...",
  getRampColor: "...",
};

var shadergraph = new ShaderGraph(fetch);
```

You can use the chainable Factory API to build graphs. It's a smart wrapper
around a partially built graph. It allows you to make splits and joins, hook up
callbacks via requires, import other factories, etc.

Instead of including snippets by name, you can also pass in GLSL code directly
to `.pipe(…)` and `.require(…)` regardless of whether you are using a fetch
function/library or not.

Snippets are instanced by default, letting you bind unique uniforms to specific
snippets in the chain:

![Uniform example](https://raw.github.com/unconed/shadergraph/master/docs/images/uniform.png)

```javascript
// Prepare new shader
var shader = shadergraph.shader()

// Prepare uniform (three.js style)
var uniforms = {
  diffuseColor: { type: 'v3', value: { x: 0.5, y: 0.75, z: 1.0 }}
};

// Build shader graph
shader
  // Require a callback
  .require('getRampColor')

  // Build two-step chain that uses the callback and the uniform
  .pipe('getColor', uniforms)
  .pipe('setColor')

var program = shader.link();
```

Instancing behavior can be configured globally or per shader (see below).

Materials
---

ShaderGraph also includes a material helper, to build a vertex/fragment shader
simultaneously:

![Material example](https://raw.github.com/unconed/shadergraph/master/docs/images/material.png)

```javascript
// Prepare new material (vertex + fragment shader)
var material = shadergraph.material()

// Build vertex shader graph
material.vertex
  .pipe('vertex')

// Build fragment shader graph
material.fragment
  .pipe('getColor')
  .pipe('setColor')

// Link both shaders and combine into a three.js style material
var program = material.link()
```

The returned `program` object is compatible with Three.js' `ShaderMaterial`
objects.

Caveats
---

 * Call `shadergraph.inspect(…)` anywhere to insert an inspector for a graph,
   and find missing/wrong connections.
 * Preprocessing directives like `#ifdef` and `#define` are ignored, but do pass
   through. Be careful when using them. Consider using snippets and/or callbacks
   instead.
 * Structs are not supported, `glsl-parser` seems to choke on them. Array types
   are probably a bit buggy still.

* * *

Reference
---

*Constructor*

```javascript
var fetch = function (name) { return … };
var fetch = { name: "...", name: "..." };
var config = {
  globalUniforms:   false, // Make uniforms   global
  globalVaryings:   true,  // Make varyings   global
  globalAttributes: true,  // Make attributes global
  globals:          [],    // Make specific symbols global
  autoInspect:      false, // Pop-up a graph inspector if compilation fails
}
shadergraph = new ShaderGraph(fetch, config);
```

*ShaderGraph*

 * `.shader(config = {})`
   Returns an empty `shader` graph wrapped in a factory. Override global `config` options.
 * `.material(config = {})`
   Returns an empty `material` wrapping two factories: `material.vertex` and `material.fragment`. Override global `config` options.
 * `.visualize(graph/factory/material)`
   Draw the given graph(s), returns an HTML `element`. Call `element.update()` after inserting.
 * `.inspect(graph/factory/material)`
   Draw the graph and insert it into the body as a floating inspector.

*Factory*

 * `.pipe(name/code, uniforms = {}, namespace = null, defines = {})`
   `.pipe(name/code, namespace = null, uniforms = {}, defines = {})`
   `.pipe(name/code, uniforms = {}, defines = {})`
   `.pipe(factory)`
   Include the given code/snippet/factory and connect it to what came before. Binds dictionary of `uniforms`. Set the `namespace`.
   ![Pipe example](https://raw.github.com/unconed/shadergraph/master/docs/images/pipe.png)

 * `.require(name/code, uniforms = {}, namespace = null, defines = {})`
   `.require(name/code, namespace = null, uniforms = {}, defines = {})`
   `.require(name/code, uniforms = {}, defines = {})`
   `.require(factory)`
   Include the given code/snippet/factory as a callback for what comes next. Binds dictionary of `uniforms`. Set the `namespace`.
   ![Require example](https://raw.github.com/unconed/shadergraph/master/docs/images/require.png)

 * `.isolate().….end()`
   Create an isolated subgraph and call it.
   ![Isolate example](https://raw.github.com/unconed/shadergraph/master/docs/images/isolate.png)

 * `.callback().….end()`
   Create an isolated subgraph and use as a callback.
   ![Callback example](https://raw.github.com/unconed/shadergraph/master/docs/images/callback.png)

 * `.split().….next().….end()`
   Create two or more branches and split connections across them 1-to-1.
   ![Split example](https://raw.github.com/unconed/shadergraph/master/docs/images/split.png)

 * `.fan().….next().….end()`
   Create two or more branches and fan connections across them 1-to-N.
   ![Fan example](https://raw.github.com/unconed/shadergraph/master/docs/images/fan.png)

 * `.pass()`
   Use this instead of .end() to make additional passthrough connections that skip the entire block.
   ![Pass example](https://raw.github.com/unconed/shadergraph/master/docs/images/pass.png)

 * `.graph()`
   Finalize the graph and return it. The factory is reset to an empty state.

 * `.compile(name)`
   Finalize the graph and compile it immediately (no callbacks). The graph is discarded.

 * `.link(name)`
   Finalize the graph and link it with its subgraphs immediately (with callbacks). The graph is discarded.

*Graph*

 * `.compile(name)`
    Compile the graph (no callbacks). The graph is retained.

 * `.link(name)`
    Compile and link the graph and its subgraphs (with callbacks). The graph is retained.

*Material*

 * `.link(options = {})`
    Link the material's vertex and fragment shader. Returns Three.js style ShaderMaterial options, merged with any existing options passed in.

Manual Use
---

If you want to build graphs by hand instead of with factories, this is possible,
but not as nice. You will need to construct objects and inject a few
dependencies. Use the Factory API as a guide.

The underlying namespaces are exposed as `ShaderGraph.Graph`,
`ShaderGraph.Block`, … `Block` and its subclasses are the logical pieces of the
shader. Each block has a `Node` associated with it that lives in the `Graph` and
contains a set of `Outlets`. Connections can be made node-to-node with
`node.connect(node)` (auto-matching by name and type), or outlet-to-outlet with
`outlet.connect(outlet)`.

To compile Graphs created without a factory, you will need to call `.compile()`
or `.link()` on the graph's tail block directly.

* * *

Steven Wittens - http://acko.net/
