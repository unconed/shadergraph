Linker = ShaderGraph.Linker
Graph  = ShaderGraph.Graph

describe "program", () ->

  ns = (name) ->
    (name.match /_sn_([0-9]+)_/)[0]

  normalize = (code, ignore) ->
    # renumber generated outputs
    map = {}
    o = s = p = 0
    code = code.replace /\b_io_[0-9]+([A-Za-z0-9_]+)\b/g, (match, name) ->
      map[match] ? map[match] = "_io_#{++o}#{name}"
    code = code.replace /\b_sn_[0-9]+([A-Za-z0-9_]+)\b/g, (match, name) ->
      map[match] ? map[match] = "_sn_#{++s}#{name}"
    code = code.replace /\b_pg_[0-9]+_([A-Za-z0-9_]+)?\b/g, (match, name) ->
      map[match] ? map[match] = "_pg_#{++p}_#{name ? ''}"

  it 'imports a factory (import)', () ->

    code1 = """
    float foobar(vec3 color) {
    }
    """

    code2 = """
    float callback(vec3 color);
    void main(in vec3 color) {
      float f = callback(color);
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
    }

    result = """
    #define _sn_1_callback _pg_1_
    #define _pg_1_ _sn_2_foobar
    float _sn_2_foobar(vec3 color) {
    }
    void _sn_3_main(in vec3 color) {
      float f = _sn_1_callback(color);
    }
    void main(in vec3 _io_1_color) {
      _sn_3_main(_io_1_color);
    }
    """

    shadergraph = ShaderGraph snippets

    shader = shadergraph.shader()
    shader.call('code1')

    graph  = shadergraph.shader()
              .import(shader)
              .call('code2')
              .end()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)
    expect(snippet.entry.match /^_pg_[0-9]+_$/).toBeTruthy

  it 'imports a factory (require)', () ->

    code1 = """
    float foobar(vec3 color) {
    }
    """

    code2 = """
    float callback(vec3 color);
    void main(in vec3 color) {
      float f = callback(color);
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
    }

    result = """
    #define _sn_1_callback _pg_1_
    #define _pg_1_ _sn_2_foobar
    float _sn_2_foobar(vec3 color) {
    }
    void _sn_3_main(in vec3 color) {
      float f = _sn_1_callback(color);
    }
    void main(in vec3 _io_1_color) {
      _sn_3_main(_io_1_color);
    }
    """

    shadergraph = ShaderGraph snippets

    shader = shadergraph.shader()
    shader.call('code1')

    graph  = shadergraph.shader()
              .require(shader)
              .call('code2')
              .end()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)
    expect(snippet.entry.match /^_pg_[0-9]+_$/).toBeTruthy

  it 'constructs an implicit callback (require)', () ->

    code1 = """
    float foobar(vec3 color) {
    }
    """

    code2 = """
    float callback(vec3 color);
    void main(in vec3 color) {
      float f = callback(color);
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
    }

    result = """
    #define _sn_1_callback _pg_1_
    #define _pg_1_ _sn_2_foobar
    float _sn_2_foobar(vec3 color) {
    }
    void _sn_3_main(in vec3 color) {
      float f = _sn_1_callback(color);
    }
    void main(in vec3 _io_1_color) {
      _sn_3_main(_io_1_color);
    }
    """

    shadergraph = ShaderGraph snippets

    shader = shadergraph.shader()

    graph  = shader
              .require('code1')
              .call('code2')
              .end()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)
    expect(snippet.entry.match /^_pg_[0-9]+_$/).toBeTruthy
