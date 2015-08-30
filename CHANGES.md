_2.0.6_
 * Remove unnecessary _i_o suffix from inout registers.
 * Append programmatic defines to bound snippet._original
 * Make return argument first instead of last output
 * Improved auto-connection logic, always match hints first

_2.0.5_
 * Fix graph not being returned with material in case of automatic tail block.
 
_2.0.4_
 * Ensure correct ordering of snippet callbacks in all cases
 * Refactor outlet creation / handling
 * Allow multiple open 'return' and 'callback' outlets in one graph
 * Simplify .isolate() / .callback() interactions
 * Improve autoInspect with error message
 * Keep graphs around as `program.graph`, `material.vertexGraph`, `material.fragmentGraph`. Call `graph.inspect()` to inspect.

_2.0.3_

 * `material.build()` is now `.link()` to be consistent. The old name will continue to work.
 * `.pipe()` and `.require()` now accept a `defines` argument, a hash of symbols to `#define` ad-hoc in GLSL.
 * `.visualize(graph)` now shows the original code snippets in popups
 * Added `.inspect(graph)` which shows a floating inspector panel
