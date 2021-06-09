describe("program", function() {
  const { Linker, Graph } = ShaderGraph;

  const ns = name => (name.match(/_sn_([0-9]+)_/))[0];

  const normalize = function(code, ignore) {
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

  it('links snippets with return values (call)', function() {
    const code1 = `\
vec3 first() {
  return vec3(1.0, 1.0, 1.0);
}\
`;

    const code2 = `\
vec3 second(vec3 color) {
  return color;
}\
`;

    const code3 = `\
void third(vec3 color) {
  gl_FragColor = vec4(color, 1.0);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2,
      'code3': code3
    };

    const result = `\
vec3 _sn_1_first() {
  return vec3(1.0, 1.0, 1.0);
}
vec3 _sn_2_second(vec3 color) {
  return color;
}
void _sn_3_third(vec3 color) {
  gl_FragColor = vec4(color, 1.0);
}
void main() {
  vec3 _io_1_return;
  vec3 _io_2_return;

  _io_1_return = _sn_1_first();
  _io_2_return = _sn_2_second(_io_1_return);
  _sn_3_third(_io_2_return);
}\
`;

    const shadergraph = new ShaderGraph(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .pipe('code1')
              .pipe('code2')
              .pipe('code3')
              .graph();

    const snippet = graph.compile();
    const code = normalize(snippet.code);

    expect(code).toBe(result);
  });


  it('links snippets out/inout/in (call)', function() {

    const code1 = `\
void first(out vec3 color) {
  color = vec3(1.0, 1.0, 1.0);
}\
`;

    const code2 = `\
void second(inout vec3 color) {
}\
`;

    const code3 = `\
void third(in vec3 color) {
  gl_FragColor = vec4(color, 1.0);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2,
      'code3': code3
    };

    const result = `\
void _sn_1_first(out vec3 color) {
  color = vec3(1.0, 1.0, 1.0);
}
void _sn_2_second(inout vec3 color) {
}
void _sn_3_third(in vec3 color) {
  gl_FragColor = vec4(color, 1.0);
}
void main() {
  vec3 _io_1_color;
  vec3 _io_2_color;

  _sn_1_first(_io_1_color);
  _io_2_color = _io_1_color;
  _sn_2_second(_io_2_color);
  _sn_3_third(_io_2_color);
}\
`;

    const shadergraph = new ShaderGraph(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .pipe('code1')
              .pipe('code2')
              .pipe('code3')
              .graph();

    const snippet = graph.compile();
    const code = normalize(snippet.code);

    expect(code).toBe(result);
  });




  it('links diamond split/join graph (split/next/end)', function() {

    const code1 = `\
void split(out vec3 color1, out vec3 color2) {
  color = vec3(1.0, 1.0, 1.0);
}\
`;

    const code2 = `\
void map(inout vec3 color) {
}\
`;

    const code3 = `\
void join(in vec3 color1, in vec3 color2) {
  gl_FragColor = vec4(color1, 1.0);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2,
      'code3': code3
    };

    const result = `\
void _sn_1_split(out vec3 color1, out vec3 color2) {
  color = vec3(1.0, 1.0, 1.0);
}
void _sn_2_map(inout vec3 color) {
}
void _sn_3_map(inout vec3 color) {
}
void _sn_4_join(in vec3 color1, in vec3 color2) {
  gl_FragColor = vec4(color1, 1.0);
}
void main() {
  vec3 _io_1_color1;
  vec3 _io_2_color2;
  vec3 _io_3_color;
  vec3 _io_4_color;

  _sn_1_split(_io_1_color1, _io_2_color2);
  _io_3_color = _io_1_color1;
  _sn_2_map(_io_3_color);
  _io_4_color = _io_2_color2;
  _sn_3_map(_io_4_color);
  _sn_4_join(_io_3_color, _io_4_color);
}\
`;

    const shadergraph = new ShaderGraph(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .pipe('code1')
              .split()
                .pipe('code2')
              .next()
                .pipe('code2')
              .end()
              .pipe('code3')
              .graph();

    const snippet = graph.compile();
    const code = normalize(snippet.code);

    expect(code).toBe(result);
  });




  it('links diamond split/join graph with pass (split/next/pass)', function() {

    const code1 = `\
void split(out vec3 color1, out vec3 color2, out mat4 passthrough) {
  color = vec3(1.0, 1.0, 1.0);
}\
`;

    const code2 = `\
void map(inout vec3 color) {
}\
`;

    const code3 = `\
void join(in vec3 color1, in vec3 color2, in mat4 passthrough) {
  gl_FragColor = vec4(color1, 1.0);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2,
      'code3': code3
    };

    const result = `\
void _sn_1_split(out vec3 color1, out vec3 color2, out mat4 passthrough) {
  color = vec3(1.0, 1.0, 1.0);
}
void _sn_2_map(inout vec3 color) {
}
void _sn_3_map(inout vec3 color) {
}
void _sn_4_join(in vec3 color1, in vec3 color2, in mat4 passthrough) {
  gl_FragColor = vec4(color1, 1.0);
}
void main() {
  vec3 _io_1_color1;
  vec3 _io_2_color2;
  mat4 _io_3_passthrough;
  vec3 _io_4_color;
  vec3 _io_5_color;

  _sn_1_split(_io_1_color1, _io_2_color2, _io_3_passthrough);
  _io_4_color = _io_1_color1;
  _sn_2_map(_io_4_color);
  _io_5_color = _io_2_color2;
  _sn_3_map(_io_5_color);
  _sn_4_join(_io_4_color, _io_5_color, _io_3_passthrough);
}\
`;

    const shadergraph = new ShaderGraph(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .pipe('code1')
              .split()
                .pipe('code2')
              .next()
                .pipe('code2')
              .pass()
              .pipe('code3')
              .graph();

    const snippet = graph.compile();
    const code = normalize(snippet.code);

    expect(code).toBe(result);
  });



  it('links fanned diamond split/join graph (fan/next/end)', function() {

    const code1 = `\
void split(out vec3 color) {
  color = vec3(1.0, 1.0, 1.0);
}\
`;

    const code2 = `\
void map(in vec3 colorIn, out vec3 colorOut) {
  colorOut = colorIn;
}\
`;

    const code3 = `\
void join(in vec3 color1, in vec3 color2) {
  gl_FragColor = vec4(color1 + color2, 1.0);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2,
      'code3': code3
    };

    const result = `\
void _sn_1_split(out vec3 color) {
  color = vec3(1.0, 1.0, 1.0);
}
void _sn_2_map(in vec3 colorIn, out vec3 colorOut) {
  colorOut = colorIn;
}
void _sn_3_map(in vec3 colorIn, out vec3 colorOut) {
  colorOut = colorIn;
}
void _sn_4_join(in vec3 color1, in vec3 color2) {
  gl_FragColor = vec4(color1 + color2, 1.0);
}
void main() {
  vec3 _io_1_color;
  vec3 _io_2_color;
  vec3 _io_3_color;

  _sn_1_split(_io_1_color);
  _sn_2_map(_io_1_color, _io_2_color);
  _sn_3_map(_io_1_color, _io_3_color);
  _sn_4_join(_io_2_color, _io_3_color);
}\
`;

    const shadergraph = new ShaderGraph(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .pipe('code1')
              .fan()
                .pipe('code2')
              .next()
                .pipe('code2')
              .end()
              .pipe('code3')
              .graph();

    const snippet = graph.compile();
    const code = normalize(snippet.code);

    expect(code).toBe(result);
  });




  it('exports dangling callbacks (call)', function() {

    const code1 = `\
vec2 callback1(float value);
void split(out vec3 color1, out vec3 color2, in vec4 colorIn) {
  color = vec3(1.0, 1.0, 1.0);
}\
`;

    const code2 = `\
vec3 callback2(vec3 pos);
void join(in vec3 color1, in vec3 color2, out vec4 colorOut) {
  gl_FragColor = vec4(color1, 1.0);
}\
`;

    let snippets = {
      'code1': code1,
      'code2': code2
    };

    // note: normalized numbering is wrong for callbacks, is verified later
    const result = `\
vec2 _sn_1_callback1(float value);
void _sn_2_split(out vec3 color1, out vec3 color2, in vec4 colorIn) {
  color = vec3(1.0, 1.0, 1.0);
}
vec3 _sn_3_callback2(vec3 pos);
void _sn_4_join(in vec3 color1, in vec3 color2, out vec4 colorOut) {
  gl_FragColor = vec4(color1, 1.0);
}
void main(in vec4 _io_1_color, out vec4 _io_2_color) {
  vec3 _io_3_color1;
  vec3 _io_4_color2;

  _sn_2_split(_io_3_color1, _io_4_color2, _io_1_color);
  _sn_4_join(_io_3_color1, _io_4_color2, _io_2_color);
}\
`;

    const shadergraph = new ShaderGraph(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .pipe('code1')
              .pipe('code2')
              .graph();

    const snippet = graph.compile();

    // verify basic form
    const code = normalize(snippet.code, /uni/);
    expect(code).toBe(result);

    // verify if externals were exported correctly
    let n = 0;
    const names = ['_io_1_callback1', '_io_1_callback2'];
    snippets = ['split', 'join'];
    const types = ['(f)(v2)', '(v3)(v3)'];
    for (let name in snippet.externals) {
      const ext = snippet.externals[name];
      const namespace = ns(name);
      expect(snippet.code.indexOf('void '+ namespace + snippets[n] + '(')).not.toBe(-1);
      expect(normalize(ext.name)).toBe(names[n]);
      expect(ext.type).toBe(types[n]);
      n++;
    }
    expect(n).toBe(2);
  });



  it('exports dangling inputs/outputs (split/next/end)', function() {

    let name;
    const code1 = `\
attribute vec2 att1;
void split(out vec3 color1, out vec3 color2, in vec4 colorIn) {
  color = vec3(1.0, 1.0, 1.0);
}\
`;

    const code2 = `\
uniform float uni;
void map(inout vec3 color) {
}\
`;

    const code3 = `\
attribute vec3 att2;
void join(in vec3 color1, in vec3 color2, out vec4 colorOut) {
  gl_FragColor = vec4(color1, 1.0);
}\
`;

    const snippets = {
      'code1': code1,
      'code2': code2,
      'code3': code3
    };

    // note: normalized numbering is wrong for uniforms, is verified later
    const result = `\
attribute vec2 att1;
void _sn_1_split(out vec3 color1, out vec3 color2, in vec4 colorIn) {
  color = vec3(1.0, 1.0, 1.0);
}
uniform float _sn_2_uni;
void _sn_3_map(inout vec3 color) {
}
uniform float _sn_4_uni;
void _sn_5_map(inout vec3 color) {
}
attribute vec3 att2;
void _sn_6_join(in vec3 color1, in vec3 color2, out vec4 colorOut) {
  gl_FragColor = vec4(color1, 1.0);
}
void main(in vec4 _io_1_color, out vec4 _io_2_color) {
  vec3 _io_3_color1;
  vec3 _io_4_color2;
  vec3 _io_5_color;
  vec3 _io_6_color;

  _sn_1_split(_io_3_color1, _io_4_color2, _io_1_color);
  _io_5_color = _io_3_color1;
  _sn_3_map(_io_5_color);
  _io_6_color = _io_4_color2;
  _sn_5_map(_io_6_color);
  _sn_6_join(_io_5_color, _io_6_color, _io_2_color);
}\
`;

    const shadergraph = new ShaderGraph(snippets);

    const shader  = shadergraph.shader();
    const graph   = shader
              .pipe('code1')
              .split()
                .pipe('code2')
              .next()
                .pipe('code2')
              .end()
              .pipe('code3')
              .graph();

    const snippet = graph.compile();

    // verify basic form
    const code = normalize(snippet.code, /uni/);
    expect(code).toBe(result);

    // verify if uniforms were duped correctly
    let n = 0;
    for (name in snippet.uniforms) {
      const uni = snippet.uniforms[name];
      const namespace = ns(name);
      expect(snippet.code.indexOf('void '+ namespace + 'map(')).not.toBe(-1);
      expect(uni.name).toBe('uni');
      expect(uni.type).toBe('f');
      n++;
    }
    expect(n).toBe(2);

    // verify attribute
    expect(snippet.attributes.att1).toBeTruthy();
    expect(snippet.attributes.att1.name).toBe('att1');
    expect(snippet.attributes.att1.type).toBe('v2');

    expect(snippet.attributes.att2).toBeTruthy();
    expect(snippet.attributes.att2.name).toBe('att2');
    expect(snippet.attributes.att2.type).toBe('v3');

    // verify signature
    expect(snippet.main.signature.length).toBe(2);
    expect(snippet.main.signature[0].type).toBe('v4');
    expect(snippet.main.signature[0].inout).toBe(0);
    expect(snippet.main.signature[1].type).toBe('v4');
    expect(snippet.main.signature[1].inout).toBe(1);
  });
});
