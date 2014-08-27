shadergraph
==========

*Functional GLSL linker*

![Shader Graph](https://raw.github.com/unconed/shadergraph/master/docs/images/require.png)

ShaderGraph is a library for linking together GLSL snippets into stand-alone shaders. It is mainly designed to build complicated shaders programmatically, but can also act as the back-end to a live graph-based shader editor.

ShaderGraph is designed to play well with Three.js, but it does not depend on it. It merely follows the same code/object conventions.

* * *

Live Examples
---

Basic Use
---

To use ShaderGraph, you initialize it once with a given snippet library. A snippet library is either a dictionary of named snippets, or a fetch function.

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

var shadergraph = ShaderGraph(fetch);
```

You can use the chainable Factory API to build graphs. It's a smart wrapper around a partially built graph. It allows you to make splits and joins, hook up callbacks via requires, import other factories, etc.

Snippets are instanced by default, letting you bind unique uniforms to specific snippets in the chain:

![Uniform example](https://raw.github.com/unconed/shadergraph/master/docs/images/uniform.png)

```javascript
// Prepare new shader
var shader = shadergraph.shader()

// Prepare uniform (three.js style)
var uniforms = {
  diffuseColor: { type: 'v3', value: { x: 0.5, y: 0.75, z: 1.0 }}
};

// Build shader graph
var shader
  // Require a callback
  .require('getRampColor')

  // Build two-step chain that uses the callback and the uniform
  .pipe('getColor', uniforms)
  .pipe('setColor')

var program = shader.link('main');
```

Instead of referencing snippets by name, you can also pass in GLSL code directly to `.pipe()` and `.require()`, regardless of whether you defined a fetch function.

Materials
---

ShaderGraph also includes a material helper, to build a vertex/fragment shader simultaneously:

![Material example](https://raw.github.com/unconed/shadergraph/master/docs/images/material.png)

```javascript
// Prepare new material (vertex + fragment shader)
var material = shadergraph.material()

// Build vertex shader graph
var material.vertex
  .pipe('vertex')

// Build fragment shader graph
var material.fragment
  .pipe('getColor')
  .pipe('setColor')

// Link both shaders and combine into a three.js style material
var program = material.build()
```

The returned `program` object is compatible with Three.js' `ShaderMaterial` objects.

* * *

Reference
---

*Constructor*

```javascript
var fetch = function (name) { };
var fetch = { name: "...", name: "..." };
var config = {
  globalUniforms:   false, // Make uniforms   global
  globalVaryings:   true,  // Make varyings   global
  globalAttributes: true,  // Make attributes global
  globals:          [],    // Make specific symbols global
}
shadergraph = ShaderGraph(fetch, config);
```

*ShaderGraph*

 * `.shader()`
   Returns an empty `shader` graph wrapped in a factory
 * `.material()`
   Returns an empty `material` wrapping two factories: `material.vertex` and `material.fragment`
 * `.visualize(graph/factory/material)`
   Draw the given graph(s), returns an HTML `element`. Call `element.update()` after inserting.
 
*Factory*

 * `.pipe(name/code/factory)`
   Call the given code/snippet/factory at this stage and connect it to what came before.
   ![Pipe example](https://raw.github.com/unconed/shadergraph/master/docs/images/pipe.png)

 * `.require(name/code/factory)`
   Include the given code/snippet/factory as a callback for what comes next.
   ![Require example](https://raw.github.com/unconed/shadergraph/master/docs/images/require.png)

 * `.isolate().….end()` - Create an isolated subgraph and call it
   ![Isolate example](https://raw.github.com/unconed/shadergraph/master/docs/images/isolate.png)

 * `.callback().….end()` - Create an isolated subgraph and use as a callback
   ![Callback example](https://raw.github.com/unconed/shadergraph/master/docs/images/callback.png)

 * `.split().….next().….end()` - Create two or more branches and split connections across them 1-to-1
   ![Split example](https://raw.github.com/unconed/shadergraph/master/docs/images/split.png)
 
 * `.fan().….next().….end()` - Create two or more branches and fan connections across them 1-to-N
   ![Fan example](https://raw.github.com/unconed/shadergraph/master/docs/images/fan.png)

 * `.pass()` - Use this instead of .end() to add an additional passthrough connection that skips the entire block.
   ![Pass example](https://raw.github.com/unconed/shadergraph/master/docs/images/pass.png)


If you want to build graphs by hand instead of with factories, the underlying namespaces are exposed as `ShaderGraph.Graph`, `ShaderGraph.Block`, etc.

* * *

Steven Wittens - http://acko.net/
