/* global ShaderGraph */
describe("layout", function() {
  const normalize = function(code, _ignore) {
    // renumber generated outputs
    let p = 0;
    let s = 0;
    let o = 0;
    const map = {};
    return code
      .replace(/\b_io_[0-9]+([A-Za-z0-9_]+)\b/g, (match, name) => map[match] ||= `_io_${++o}${name}`)
      .replace(/\b_sn_[0-9]+([A-Za-z0-9_]+)\b/g, (match, name) => map[match] ||= `_sn_${++s}${name}`)
      .replace(/\b_pg_[0-9]+_([A-Za-z0-9_]+)?\b/g, (match, name) => map[match] ||= `_pg_${++p}_${name || ''}`);
  };

  it('links a callback (callback/end)', function() {
    const code1 = `\
float foobar(vec3 color) {
}\
`;

    const code2 = `\
float callback(vec3 color);
void main(in vec3 color) {
  float f = callback(color);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2
    };

    const result = `\
#define _sn_1_callback _pg_1_
#define _pg_1_ _sn_2_foobar
float _sn_2_foobar(vec3 color) {
}
void _sn_3_main(in vec3 color) {
  float f = _sn_1_callback(color);
}
void main(in vec3 _io_1_color) {
  _sn_3_main(_io_1_color);
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .callback()
                .pipe('code1')
              .end()
              .pipe('code2')
              .graph();

    const snippet = graph.link();
    const code = normalize(snippet.code);

    expect(code).toBe(result);
    expect(snippet.entry.match(/^_pg_[0-9]+_$/)).toBeTruthy;
  });


  it('links a callback (require)', function() {

    const code1 = `\
float foobar(vec3 color) {
}\
`;

    const code2 = `\
float callback(vec3 color);
void main(in vec3 color) {
  float f = callback(color);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2
    };

    const result = `\
#define _sn_1_callback _pg_1_
#define _pg_1_ _sn_2_foobar
float _sn_2_foobar(vec3 color) {
}
void _sn_3_main(in vec3 color) {
  float f = _sn_1_callback(color);
}
void main(in vec3 _io_1_color) {
  _sn_3_main(_io_1_color);
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .require('code1')
              .pipe('code2')
              .graph();

    const snippet = graph.link();
    const code = normalize(snippet.code);

    expect(code).toBe(result);
    expect(snippet.entry.match(/^_pg_[0-9]+_$/)).toBeTruthy;
  });


  it('links a callback recursively (callback/end)', function() {

    const code1 = `\
float foobar(vec3 color) {
}\
`;

    const code2 = `\
float callback(vec3 color);
float foobar(vec3 color) {
}\
`;

    const code3 = `\
float callback(vec3 color);
void main(in vec3 color) {
  float f = callback(color);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2,
      'code3': code3
    };

    //wtf coffeescript?
    const result =
    `#define _sn_1_callback _pg_1_
#define _sn_2_callback _pg_2_
#define _pg_2_ _sn_3_foobar
#define _pg_1_ _sn_4_foobar
float _sn_3_foobar(vec3 color) {
}
float _sn_4_foobar(vec3 color) {
}
void _sn_5_main(in vec3 color) {
  float f = _sn_1_callback(color);
}
void main(in vec3 _io_1_color) {
  _sn_5_main(_io_1_color);
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .callback()
                .callback()
                  .pipe('code1')
                .end()
                .pipe('code2')
              .end()
              .pipe('code3')
              .graph();

    const snippet = graph.link();
    const code = normalize(snippet.code);

    expect(code).toBe(result);
  });



  it('creates linkages for subgraphs and signature mismatches (callback/end)', function() {

    const code1 = `\
float foobar(vec3 color) {
  return color.x;
}\
`;

    const code2 = `\
void foobar(out float valueOut, in float valueIn) {
  valueOut = valueIn * 2.0;
}\
`;

    const code3 = `\
float callback(vec3 color);
void main(in vec3 color) {
  float f = callback(color);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2,
      'code3': code3
    };

    const result = `\
void _pg_1_(vec3 color, out float _pg_2_return);
float _sn_1_callback(vec3 color) {
  float _pg_2_return;

  _pg_1_(color, _pg_2_return);
  return _pg_2_return;
}
float _sn_2_foobar(vec3 color) {
  return color.x;
}
void _sn_3_foobar(out float valueOut, in float valueIn) {
  valueOut = valueIn * 2.0;
}
void _pg_1_(vec3 _io_1_color, out float _io_2_value) {
  float _io_3_return;

  _io_3_return = _sn_2_foobar(_io_1_color);
  _sn_3_foobar(_io_2_value, _io_3_return);
}
void _sn_4_main(in vec3 color) {
  float f = _sn_1_callback(color);
}
void main(in vec3 _io_4_color) {
  _sn_4_main(_io_4_color);
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .callback()
                .pipe('code1')
                .pipe('code2')
              .end()
              .pipe('code3')
              .graph();

    const snippet = graph.link();
    const code = normalize(snippet.code);

    return expect(code).toBe(result);
  });


  it('links nested graphs (isolate/end)', function() {

    const code1 = `\
float foobar(vec3 color) {
  return color.x;
}\
`;

    const code2 = `\
void main(float f) {
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2
    };

    const result = `\
#define _pg_1_ _sn_1_foobar
float _sn_1_foobar(vec3 color) {
  return color.x;
}
void _sn_2_main(float f) {
}
void main(vec3 _io_1_color) {
  float _io_2_return;

  _io_2_return = _pg_1_(_io_1_color);
  _sn_2_main(_io_2_return);
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .isolate()
                .pipe('code1')
              .end()
              .pipe('code2')
              .graph();

    const snippet = graph.link();
    const code = normalize(snippet.code);

    return expect(code).toBe(result);
  });

  it('handles piped requires (require/require/pipe)', function() {

    const code1 = `\
vec3 getColor() {
  return vec3(0.2, 0.3, 0.4);
}\
`;

    const code2 = `\
vec3 getColor1();
vec3 getColor2();
vec3 getColorSum() {
  return getColor1() + getColor2();
}\
`;

    const code3 = `\
vec3 getColor();
void main() {
  gl_FragColor = vec4(getColor(), 1.0);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2,
      'code3': code3
    };

    const result = `\
#define _sn_1_getColor _pg_1_
#define _sn_2_getColor1 _pg_2_
#define _sn_3_getColor2 _pg_3_
#define _pg_2_ _sn_4_getColor
#define _pg_3_ _sn_5_getColor
#define _pg_1_ _sn_6_getColorSum
vec3 _sn_4_getColor() {
  return vec3(0.2, 0.3, 0.4);
}
vec3 _sn_5_getColor() {
  return vec3(0.2, 0.3, 0.4);
}
vec3 _sn_6_getColorSum() {
  return _sn_2_getColor1() + _sn_3_getColor2();
}
void _sn_7_main() {
  gl_FragColor = vec4(_sn_1_getColor(), 1.0);
}
void main() {
  _sn_7_main();
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .require('code1')
              .require('code1')
              .require('code2')
              .pipe('code3')
              .graph();

    const snippet = graph.link();
    const code = normalize(snippet.code);

    return expect(code).toBe(result);
  });

  it('handles piped requires with deep nesting (require/isolate/require/end/pipe)', function() {

    const code1 = `\
vec3 getColor() {
  return vec3(0.2, 0.3, 0.4);
}\
`;

    const code2 = `\
vec3 getColor1();
vec3 getColor2();
vec3 getColorSum() {
  return getColor1() + getColor2();
}\
`;

    const code3 = `\
vec3 getColor();
void main() {
  gl_FragColor = vec4(getColor(), 1.0);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2,
      'code3': code3
    };

    const result = `\
#define _sn_1_getColor _pg_1_
#define _sn_2_getColor1 _pg_2_
#define _sn_3_getColor2 _pg_3_
#define _pg_2_ _sn_4_getColor
#define _pg_3_ _sn_5_getColor
#define _pg_1_ _sn_6_getColorSum
vec3 _sn_4_getColor() {
  return vec3(0.2, 0.3, 0.4);
}
vec3 _sn_5_getColor() {
  return vec3(0.2, 0.3, 0.4);
}
vec3 _sn_6_getColorSum() {
  return _sn_2_getColor1() + _sn_3_getColor2();
}
void _sn_7_main() {
  gl_FragColor = vec4(_sn_1_getColor(), 1.0);
}
void main() {
  _sn_7_main();
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .require('code1')
              .require('code1')
              .isolate()
                .require('code2')
              .end()
              .pipe('code3')
              .graph();

    const snippet = graph.link();
    const code = normalize(snippet.code);

    return expect(code).toBe(result);
  });

  it('handles piped requires with deep deep nesting (require/isolate/require/end/pipe)', function() {

    const code1 = `\
vec3 getColor() {
  return vec3(0.2, 0.3, 0.4);
}\
`;

    const code2 = `\
vec3 getColor1();
vec3 getColor2();
vec3 getColorSum() {
  return getColor1() + getColor2();
}\
`;

    const code3 = `\
vec3 getColor();
void main() {
  gl_FragColor = vec4(getColor(), 1.0);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2,
      'code3': code3
    };

    const result = `\
#define _sn_1_getColor _pg_1_
#define _sn_2_getColor1 _pg_2_
#define _sn_3_getColor2 _pg_3_
#define _pg_2_ _sn_4_getColor
#define _pg_3_ _sn_5_getColor
#define _pg_1_ _sn_6_getColorSum
vec3 _sn_4_getColor() {
  return vec3(0.2, 0.3, 0.4);
}
vec3 _sn_5_getColor() {
  return vec3(0.2, 0.3, 0.4);
}
vec3 _sn_6_getColorSum() {
  return _sn_2_getColor1() + _sn_3_getColor2();
}
void _sn_7_main() {
  gl_FragColor = vec4(_sn_1_getColor(), 1.0);
}
void main() {
  _sn_7_main();
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .require('code1')
              .require('code1')
              .isolate()
                .isolate()
                  .require('code2')
                .end()
              .end()
              .pipe('code3')
              .graph();

    const snippet = graph.link();
    const code = normalize(snippet.code);

    return expect(code).toBe(result);
  });

  it('de-dupes a repeated singleton (require/require/pipe)', function() {

    const squareColor = `\
vec3 squareColor(vec3 rgb) {
  return rgb * rgb;
}\
`;

    const getColor = `\
vec3 getColor() {
  return vec3(1.0, 0.5, 0.25);
}\
`;

    const getCallbackColor = `\
vec3 getColor();
vec3 getCallbackColor() {
  return getColor() * 2.0;
}\
`;

    const setColor = `\
vec3 getColor1();
vec3 getColor2();
void setColor() {
  vec3 color = getColor1() + getColor2();
  gl_FragColor = vec4(color, 1.0);
}\
`;

    const snippets = {squareColor, getColor, getCallbackColor, setColor};

    const result = `\
#define _sn_1_getColor1 _pg_1_
#define _sn_2_getColor _pg_2_
#define _sn_3_getColor2 _pg_3_
#define _pg_1_ _sn_4_getCallbackColor
#define _pg_3_ _sn_4_getCallbackColor
vec3 _sn_5_getColor() {
  return vec3(1.0, 0.5, 0.25);
}
vec3 _sn_6_squareColor(vec3 rgb) {
  return rgb * rgb;
}
vec3 _pg_2_() {
  vec3 _io_1_return;
  vec3 _io_2_return;

  _io_1_return = _sn_5_getColor();
  _io_2_return = _sn_6_squareColor(_io_1_return);
  return _io_2_return;
}
vec3 _sn_4_getCallbackColor() {
  return _sn_2_getColor() * 2.0;
}
void _sn_7_setColor() {
  vec3 color = _sn_1_getColor1() + _sn_3_getColor2();
  gl_FragColor = vec4(color, 1.0);
}
void main() {
  _sn_7_setColor();
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    // Prepare pipeline of two snippets
    const pipeline = shadergraph.shader();
    pipeline.pipe('getColor');
    pipeline.pipe('squareColor');

    // Prepare callback
    const callback = shadergraph.shader();
    callback.require(pipeline);
    callback.pipe('getCallbackColor');

    // Build shader graph
    const shader = shadergraph.shader();
    shader.require(callback);
    shader.require(callback);
    shader.pipe('setColor');

    const snippet = shader.link();
    const code = normalize(snippet.code);

    return expect(code).toBe(result);
  });

  it('de-dupes a repeated isolated singleton (require/require/pipe)', function() {

    const squareColor = `\
vec3 squareColor(vec3 rgb) {
  return rgb * rgb;
}\
`;

    const getColor = `\
vec3 getColor() {
  return vec3(1.0, 0.5, 0.25);
}\
`;

    const setColor = `\
vec3 mapColor1(vec3 color);
vec3 mapColor2(vec3 color);
void setColor(vec3 color) {
  color = mapColor1(color);
  color = mapColor2(color);
  gl_FragColor = vec4(color, 1.0);
}\
`;

    const snippets = {squareColor, getColor, setColor};

    const result = `\
#define _sn_1_mapColor1 _pg_1_
#define _sn_2_mapColor2 _pg_2_
#define _pg_3_ _sn_3_squareColor
#define _pg_4_ _sn_3_squareColor
#define _pg_1_ _pg_5_
#define _pg_2_ _pg_5_
vec3 _sn_3_squareColor(vec3 rgb) {
  return rgb * rgb;
}
vec3 _pg_5_(vec3 _io_1_rgb) {
  vec3 _io_2_return;
  vec3 _io_3_return;

  _io_2_return = _pg_3_(_io_1_rgb);
  _io_3_return = _pg_4_(_io_2_return);
  return _io_3_return;
}
vec3 _sn_4_getColor() {
  return vec3(1.0, 0.5, 0.25);
}
void _sn_5_setColor(vec3 color) {
  color = _sn_1_mapColor1(color);
  color = _sn_2_mapColor2(color);
  gl_FragColor = vec4(color, 1.0);
}
void main() {
  vec3 _io_4_return;

  _io_4_return = _sn_4_getColor();
  _sn_5_setColor(_io_4_return);
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    // Prepare instanced snippet
    const instance = shadergraph.shader();
    instance.pipe('squareColor');

    // Build callback graph
    const callback = shadergraph.shader();
    callback.pipe(instance);
    callback.pipe(instance);

    // Wrap into single node graph
    const isolate = shadergraph.shader();
    isolate.pipe(callback);

    // Build shader graph
    const shader = shadergraph.shader();
    shader.pipe('getColor');
    shader.require(isolate);
    shader.require(isolate);
    shader.pipe('setColor');

    // Link entire shader into a main() function
    const snippet = shader.link();
    const code = normalize(snippet.code);

    return expect(code).toBe(result);
  });

  it('impedance matches a singleton (require/require/pipe)', function() {

    const squareColor = `\
vec3 squareColor(vec3 rgb) {
  return rgb * rgb;
}\
`;

    const getColor = `\
vec3 getColor() {
  return vec3(1.0, 0.5, 0.25);
}\
`;

    const getCallbackColor = `\
void getColor(out vec3 color);
vec3 getCallbackColor() {
  vec3 c;
  getColor(c);
  return c * 2.0;
}\
`;

    const setColor = `\
vec3 getColor1();
vec3 getColor2();
void setColor() {
  vec3 color = getColor1() + getColor2();
  gl_FragColor = vec4(color, 1.0);
}\
`;

    const snippets = {squareColor, getColor, getCallbackColor, setColor};

    const result = `\
#define _sn_1_getColor1 _pg_1_
#define _sn_2_getColor2 _pg_2_
#define _pg_1_ _sn_3_getCallbackColor
#define _pg_2_ _sn_3_getCallbackColor
vec3 _pg_3_();
void _sn_4_getColor(out vec3 color) {
  color = _pg_3_();
}
vec3 _sn_5_getColor() {
  return vec3(1.0, 0.5, 0.25);
}
vec3 _sn_6_squareColor(vec3 rgb) {
  return rgb * rgb;
}
vec3 _pg_3_() {
  vec3 _io_1_return;
  vec3 _io_2_return;

  _io_1_return = _sn_5_getColor();
  _io_2_return = _sn_6_squareColor(_io_1_return);
  return _io_2_return;
}
vec3 _sn_3_getCallbackColor() {
  vec3 c;
  _sn_4_getColor(c);
  return c * 2.0;
}
void _sn_7_setColor() {
  vec3 color = _sn_1_getColor1() + _sn_2_getColor2();
  gl_FragColor = vec4(color, 1.0);
}
void main() {
  _sn_7_setColor();
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    // Prepare pipeline of two snippets
    const pipeline = shadergraph.shader();
    pipeline.pipe('getColor');
    pipeline.pipe('squareColor');

    // Prepare callback
    const callback = shadergraph.shader();
    callback.require(pipeline);
    callback.pipe('getCallbackColor');

    // Build shader graph
    const shader = shadergraph.shader();
    shader.require(callback);
    shader.require(callback);
    shader.pipe('setColor');

    const snippet = shader.link();
    const code = normalize(snippet.code);

    return expect(code).toBe(result);
  });

  it('de-dupes attributes/uniforms on a material', function() {

    const vertex1 = `\
uniform vec4 rgba;
attribute vec3 color;
varying vec3 vColor1;

void main() {
  vColor1 = color * rgba;
}\
`;

    const vertex2 = `\
uniform vec4 rgba;
attribute vec3 color;
varying vec3 vColor2;

void main() {
  vColor2 = color2 * color2 * rgba;
}`;

    const getColor = `\
uniform vec4 rgba;
varying vec3 vColor1;
varying vec3 vColor2;
vec3 getColor() {
  return vColor1 * vColor2 * 2.0;
}\
`;

    const setColor = `\
uniform vec4 rgba;
void setColor(vec3 color) {
  gl_FragColor = vec4(color, 1.0);
}\
`;

    const snippets = {vertex1, vertex2, getColor, setColor};

    const vertexResult = `\
uniform vec4 rgba;
attribute vec3 color;
varying vec3 vColor1;

void _sn_1_main() {
  vColor1 = color * rgba;
}
varying vec3 vColor2;

void _sn_2_main() {
  vColor2 = color2 * color2 * rgba;
}
void main() {
  _sn_1_main();
  _sn_2_main();
}\
`;

    const fragmentResult = `\
uniform vec4 rgba;
varying vec3 vColor1;
varying vec3 vColor2;
vec3 _sn_1_getColor() {
  return vColor1 * vColor2 * 2.0;
}
void _sn_2_setColor(vec3 color) {
  gl_FragColor = vec4(color, 1.0);
}
void main() {
  vec3 _io_1_return;

  _io_1_return = _sn_1_getColor();
  _sn_2_setColor(_io_1_return);
}\
`;

    const shadergraph = ShaderGraph.load(snippets, { globalUniforms: true });

    // Prepare new material
    const material = shadergraph.material();

    material.vertex
      .pipe('vertex1')
      .pipe('vertex2');

    material.fragment
      .pipe('getColor')
      .pipe('setColor');

    const program  = material.link();
    const vertex   = normalize(program.vertexShader);
    const fragment = normalize(program.fragmentShader);

    expect(vertex).toBe(vertexResult);
    return expect(fragment).toBe(fragmentResult);
  });

  it('handles multiple merged returns (callback/pipe/next/pipe/end/require)', function() {

    const getColor1 = `\
vec3 getColor1() {
  return vec3(0.1, 0.1, 0.1);
}\
`;

    const getColor2 = `\
vec3 getColor2() {
  return vec3(0.1, 0.1, 0.1);
}\
`;

    const getColorSum = `\
void getColors(out vec3 color1, out vec3 color2);
vec3 getColorSum() {
  vec3 a, b;
  getColors(a, b);
  return a + b;
}\
`;

    const setColor = `\
vec3 getColor();
void main() {
  gl_FragColor = vec4(getColor(), 1.0);
}\
`;

    const result = `\
#define _sn_1_getColor _pg_1_
#define _pg_1_ _sn_2_getColorSum
vec3 _pg_2_(out vec3 color2);
void _sn_3_getColors(out vec3 color1, out vec3 color2) {
  color1 = _pg_2_(color2);
}
vec3 _sn_4_getColor1() {
  return vec3(0.1, 0.1, 0.1);
}
vec3 _sn_5_getColor2() {
  return vec3(0.1, 0.1, 0.1);
}
vec3 _pg_2_(out vec3 _io_1_return) {
  vec3 _io_2_return;
  vec3 _io_1_return;

  _io_2_return = _sn_4_getColor1();
  _io_1_return = _sn_5_getColor2();
  return _io_2_return;
}
vec3 _sn_2_getColorSum() {
  vec3 a, b;
  _sn_3_getColors(a, b);
  return a + b;
}
void _sn_6_main() {
  gl_FragColor = vec4(_sn_1_getColor(), 1.0);
}
void main() {
  _sn_6_main();
}\
`;

    const shadergraph = ShaderGraph.load();

    const shader  = shadergraph.shader();
    const graph   = shader
              .callback()
                .pipe(getColor1)
              .next()
                .pipe(getColor2)
              .end()
              .require(getColorSum)
              .pipe(setColor)
              .graph();

    const snippet = graph.link();
    const code = normalize(snippet.code);

    return expect(code).toBe(result);
  });


  it('handles inouts inside isolates (isolate/pipe/end)', function() {

    const getColor = `\
vec3 getColor() {
  return vec3(1.0, 0.5, 0.25);
}\
`;

    const squareColor = `\
void squareColor(inout vec3 color) {
  color = color * color;
}\
`;

    const setColor = `\
void setColor(vec3 color) {
  gl_FragColor = vec4(color, 1.0);
}\
`;

    const snippets = {getColor, squareColor, setColor};

    const result = `\
#define _pg_1_ _sn_1_squareColor
vec3 _sn_2_getColor() {
  return vec3(1.0, 0.5, 0.25);
}
void _sn_1_squareColor(inout vec3 color) {
  color = color * color;
}
void _sn_3_setColor(vec3 color) {
  gl_FragColor = vec4(color, 1.0);
}
void main() {
  vec3 _io_1_return;
  vec3 _io_2_color;

  _io_1_return = _sn_2_getColor();
  _io_2_color = _io_1_return;
  _pg_1_(_io_2_color);
  _sn_3_setColor(_io_2_color);
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .pipe('getColor')
              .isolate()
                .pipe('squareColor')
              .end()
              .pipe('setColor')
              .graph();

    const snippet = graph.link();
    const code = normalize(snippet.code);

    expect(code).toBe(result);
  });


  it('splits piped inouts inside isolates (isolate/pipe/pipe/end)', function() {

    const getColor = `\
vec3 getColor() {
  return vec3(1.0, 0.5, 0.25);
}\
`;

    const squareColor = `\
void squareColor(inout vec3 color) {
  color = color * color;
}\
`;

    const setColor = `\
void setColor(vec3 color) {
  gl_FragColor = vec4(color, 1.0);
}\
`;

    const snippets = {getColor, squareColor, setColor};

    const result = `\
vec3 _sn_1_getColor() {
  return vec3(1.0, 0.5, 0.25);
}
void _sn_2_squareColor(inout vec3 color) {
  color = color * color;
}
void _sn_3_squareColor(inout vec3 color) {
  color = color * color;
}
void _pg_1_(in vec3 _io_1_color, out vec3 _io_2_color) {
  vec3 _io_3_color;
  vec3 _io_2_color;

  _io_3_color = _io_1_color;
  _sn_2_squareColor(_io_3_color);
  _io_2_color = _io_3_color;
  _sn_3_squareColor(_io_2_color);
}
void _sn_4_setColor(vec3 color) {
  gl_FragColor = vec4(color, 1.0);
}
void main() {
  vec3 _io_4_return;
  vec3 _io_5_color;

  _io_4_return = _sn_1_getColor();
  _pg_1_(_io_4_return, _io_5_color);
  _sn_4_setColor(_io_5_color);
}\
`;

    const shadergraph = ShaderGraph.load(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .pipe('getColor')
              .isolate()
                .pipe('squareColor')
                .pipe('squareColor')
              .end()
              .pipe('setColor')
              .graph();

    const snippet = graph.link();
    const code = normalize(snippet.code);

    expect(code).toBe(result);
  });
});
