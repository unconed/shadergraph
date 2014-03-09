Linker = ShaderGraph.Linker
Graph  = ShaderGraph.Graph

describe "program", () ->

  ns = (name) ->
    (name.match /_sn_([0-9]+)_/)[0]

  normalize = (code, ignore) ->
    # renumber generated outputs
    map = {}
    o = s = p = 0
    code = code.replace /\b_ot_[0-9]+([A-Za-z0-9_]+)\b/g, (match, name) ->
      map[match] ? map[match] = "_ot_#{++o}#{name}"
    code = code.replace /\b_sn_[0-9]+([A-Za-z0-9_]+)\b/g, (match, name) ->
      map[match] ? map[match] = "_sn_#{++s}#{name}"
    code = code.replace /\b_pg_[0-9]+\b/g, (match) ->
      map[match] ? map[match] = "_pg_#{++p}"



  it 'links snippets out/inout/in', () ->

    code1 = """
    void first(out vec3 color) {
      color = vec3(1.0, 1.0, 1.0);
    }
    """

    code2 = """
    void second(inout vec3 color) {
    }
    """

    code3 = """
    void third(in vec3 color) {
      gl_FragColor = vec4(color, 1.0);
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
      'code3': code3
    }

    result = """
    void _sn_1_first(out vec3 color) {
      color = vec3(1.0, 1.0, 1.0);
    }
    void _sn_2_second(inout vec3 color) {
    }
    void _sn_3_third(in vec3 color) {
      gl_FragColor = vec4(color, 1.0);
    }
    void _pg_1() {
      vec3 _ot_1_color;

      _sn_1_first(_ot_1_color);
      _sn_2_second(_ot_1_color);
      _sn_3_third(_ot_1_color);
    }
    """

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .snippet('code1')
              .snippet('code2')
              .snippet('code3')
              .end()

    program = graph.compile()
    code = normalize(program.code)

    expect(code).toBe(result)




  it 'links diamond split/join graph', () ->

    code1 = """
    void split(out vec3 color1, out vec3 color2) {
      color = vec3(1.0, 1.0, 1.0);
    }
    """

    code2 = """
    void map(inout vec3 color) {
    }
    """

    code3 = """
    void join(in vec3 color1, in vec3 color2) {
      gl_FragColor = vec4(color, 1.0);
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
      'code3': code3
    }

    result = """
    void _sn_1_split(out vec3 color1, out vec3 color2) {
      color = vec3(1.0, 1.0, 1.0);
    }
    void _sn_2_map(inout vec3 color) {
    }
    void _sn_3_map(inout vec3 color) {
    }
    void _sn_4_join(in vec3 color1, in vec3 color2) {
      gl_FragColor = vec4(color, 1.0);
    }
    void _pg_1() {
      vec3 _ot_1_color1;
      vec3 _ot_2_color2;

      _sn_1_split(_ot_1_color1, _ot_2_color2);
      _sn_2_map(_ot_1_color1);
      _sn_3_map(_ot_2_color2);
      _sn_4_join(_ot_1_color1, _ot_2_color2);
    }
    """

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .snippet('code1')
              .group()
                .snippet('code2')
              .next()
                .snippet('code2')
              .combine()
              .snippet('code3')
              .end()

    program = graph.compile()
    code = normalize(program.code)

    expect(code).toBe(result)




  it 'links diamond split/join graph with pass', () ->

    code1 = """
    void split(out vec3 color1, out vec3 color2, out mat4 passthrough) {
      color = vec3(1.0, 1.0, 1.0);
    }
    """

    code2 = """
    void map(inout vec3 color) {
    }
    """

    code3 = """
    void join(in vec3 color1, in vec3 color2, in mat4 passthrough) {
      gl_FragColor = vec4(color, 1.0);
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
      'code3': code3
    }

    result = """
    void _sn_1_split(out vec3 color1, out vec3 color2, out mat4 passthrough) {
      color = vec3(1.0, 1.0, 1.0);
    }
    void _sn_2_map(inout vec3 color) {
    }
    void _sn_3_map(inout vec3 color) {
    }
    void _sn_4_join(in vec3 color1, in vec3 color2, in mat4 passthrough) {
      gl_FragColor = vec4(color, 1.0);
    }
    void _pg_1() {
      vec3 _ot_1_color1;
      vec3 _ot_2_color2;
      mat4 _ot_3_passthrough;

      _sn_1_split(_ot_1_color1, _ot_2_color2, _ot_3_passthrough);
      _sn_2_map(_ot_1_color1);
      _sn_3_map(_ot_2_color2);
      _sn_4_join(_ot_1_color1, _ot_2_color2, _ot_3_passthrough);
    }
    """

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .snippet('code1')
              .group()
                .snippet('code2')
              .next()
                .snippet('code2')
              .pass()
              .snippet('code3')
              .end()

    program = graph.compile()
    code = normalize(program.code)

    expect(code).toBe(result)




  it 'exports dangling inputs/outputs', () ->

    code1 = """
    attribute vec2 att1;
    void split(out vec3 color1, out vec3 color2, in vec4 colorIn) {
      color = vec3(1.0, 1.0, 1.0);
    }
    """

    code2 = """
    uniform float uni;
    void map(inout vec3 color) {
    }
    """

    code3 = """
    attribute vec3 att2;
    void join(in vec3 color1, in vec3 color2, out vec4 colorOut) {
      gl_FragColor = vec4(color, 1.0);
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
      'code3': code3
    }

    result = """
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
      gl_FragColor = vec4(color, 1.0);
    }
    void _pg_1(in vec4 _ot_1_colorIn, out vec4 _ot_2_colorOut) {
      vec3 _ot_3_color1;
      vec3 _ot_4_color2;

      _sn_1_split(_ot_3_color1, _ot_4_color2, _ot_1_colorIn);
      _sn_3_map(_ot_3_color1);
      _sn_5_map(_ot_4_color2);
      _sn_6_join(_ot_3_color1, _ot_4_color2, _ot_2_colorOut);
    }
    """

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .snippet('code1')
              .group()
                .snippet('code2')
              .next()
                .snippet('code2')
              .combine()
              .snippet('code3')
              .end()

    program = graph.compile()
    code = normalize(program.code, /uni/)

    # verify basic form
    expect(code).toBe(result)

    # verify if uniforms were duped correctly
    n = 0
    for name, uni of program.uniforms
      namespace = ns(name)
      expect(program.code.indexOf('void '+ namespace + 'map(')).not.toBe -1
      expect(uni.name).toBe('uni')
      expect(uni.type).toBe('f')
      n++
    expect(n).toBe(2)

    # verify attribute
    expect(program.attributes.att1).toBeTruthy()
    expect(program.attributes.att1.name).toBe 'att1'
    expect(program.attributes.att1.type).toBe 'v2'

    expect(program.attributes.att2).toBeTruthy()
    expect(program.attributes.att2.name).toBe 'att2'
    expect(program.attributes.att2.type).toBe 'v3'

    # verify signature
    expect(program.main.signature.length).toBe 2
    expect(program.main.signature[0].type).toBe 'v4'
    expect(program.main.signature[0].inout).toBe 0
    expect(program.main.signature[1].type).toBe 'v4'
    expect(program.main.signature[1].inout).toBe 1
    console.log(program)
