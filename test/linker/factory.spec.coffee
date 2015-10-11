Linker = ShaderGraph.Linker
Graph  = ShaderGraph.Graph

describe "program", () ->
  return

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

  it 'imports a factory (require/pipe)', () ->

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
    shader.pipe('code1')

    graph  = shadergraph.shader()
              .require(shader)
              .pipe('code2')
              .graph()

    snippet = graph.link()
    code = normalize(snippet.code)

    expect(code).toBe(result)
    expect(snippet.entry.match /^_pg_[0-9]+_$/).toBeTruthy

  it 'constructs an implicit callback (import/call)', () ->

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
              .import('code1')
              .pipe('code2')
              .graph()

    snippet = graph.link()
    code = normalize(snippet.code)

    expect(code).toBe(result)
    expect(snippet.entry.match /^_pg_[0-9]+_$/).toBeTruthy

  it 'passes through an implicit callback (call/import/call)', () ->

    code1 = """
    float foobar(vec3 color) {
    }
    """

    code2 = """
    float callback(vec3 color);
    void main(in vec3 color, in float x) {
      float f = callback(color) * x;
    }
    """

    code3 = """
    float callback() {
      return 1.0;
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
      'code3': code3
    }

    result = """
    #define _sn_1_callback _pg_1_
    #define _pg_1_ _sn_2_foobar
    float _sn_2_foobar(vec3 color) {
    }
    float _sn_3_callback() {
      return 1.0;
    }
    void _sn_4_main(in vec3 color, in float x) {
      float f = _sn_1_callback(color) * x;
    }
    void main(in vec3 _io_1_color) {
      float _io_2_return;
    
      _io_2_return = _sn_3_callback();
      _sn_4_main(_io_1_color, _io_2_return);
    }
    """

    shadergraph = ShaderGraph snippets

    shader = shadergraph.shader()

    graph  = shader
              .pipe('code3')
              .import('code1')
              .pipe('code2')
              .graph()

    snippet = graph.link()
    code = normalize(snippet.code)

    expect(code).toBe(result)
    expect(snippet.entry.match /^_pg_[0-9]+_$/).toBeTruthy

  it 'aggregates tail blocks (pipe/pipe)', () ->

    code1 = """
    void foobar() {
    }
    """

    snippets = {
      'code1': code1
    }

    result = """
    void _sn_1_foobar() {
    }
    void _sn_2_foobar() {
    }
    void _sn_3_foobar() {
    }
    void main() {
      _sn_1_foobar();
      _sn_2_foobar();
      _sn_3_foobar();
    }
    """

    shadergraph = ShaderGraph snippets

    shader = shadergraph.shader()

    graph  = shader
              .pipe('code1')
              .pipe('code1')
              .pipe('code1')
              .graph()

    snippet = graph.link()
    code = normalize(snippet.code)

    expect(code).toBe(result)
    expect(snippet.entry.match /^_pg_[0-9]+_$/).toBeTruthy
