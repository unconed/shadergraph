Linker = ShaderGraph.Linker
Graph  = ShaderGraph.Graph

describe "program", () ->

  normalize = (code) ->
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

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .snippet('code1')
              .snippet('code2')
              .snippet('code3')
              .end()

    program = graph.compile()
    code = normalize(program.code)

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

    expect(code).toBe(result)

