Linker = ShaderGraph.Linker
Graph  = ShaderGraph.Graph

describe "layout", () ->

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



  it 'links a callback (group/callback)', () ->

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
    float _sn_1_callback(vec3 color);
    void _sn_3_main(in vec3 color) {
      float f = _sn_1_callback(color);
    }
    void main(in vec3 _io_1_color) {
      _sn_3_main(_io_1_color);
    }
    """

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .callback()
                .call('code1')
              .join()
              .call('code2')
              .end()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)
    expect(snippet.entry.match /^_pg_[0-9]+_$/).toBeTruthy


  it 'links a callback recursively (group/callback)', () ->

    code1 = """
    float foobar(vec3 color) {
    }
    """

    code2 = """
    float callback(vec3 color);
    float foobar(vec3 color) {
    }
    """

    code3 = """
    float callback(vec3 color);
    void main(in vec3 color) {
      float f = callback(color);
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
      'code3': code3
    }

    #wtf coffeescript?
    result =
    """#define _sn_1_callback _pg_1_
    #define _pg_1_ _sn_2_foobar
    #define _pg_2_ _sn_3_foobar
    #define _sn_4_callback _pg_2_;
    float _sn_2_foobar(vec3 color) {
    }
    float _sn_1_callback(vec3 color);
    float _sn_3_foobar(vec3 color) {
    }
    float _sn_4_callback(vec3 color);
    void _sn_5_main(in vec3 color) {
      float f = _sn_4_callback(color);
    }
    void main(in vec3 _io_1_color) {
      _sn_5_main(_io_1_color);
    }
    """

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .callback()
                .callback()
                  .call('code1')
                .join()
                .call('code2')
              .join()
              .call('code3')
              .end()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)



  it 'creates linkages for subgraphs and signature mismatches (group/callback)', () ->

    code1 = """
    float foobar(vec3 color) {
      return color.x;
    }
    """

    code2 = """
    void foobar(out float valueOut, in float valueIn) {
      valueOut = valueIn * 2.0;
    }
    """

    code3 = """
    float callback(vec3 color);
    void main(in vec3 color) {
      float f = callback(color);
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
      'code3': code3
    }

    result = """
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
    float _sn_1_callback(vec3 color);
    void _sn_4_main(in vec3 color) {
      float f = _sn_1_callback(color);
    }
    void main(in vec3 _io_4_color) {
      _sn_4_main(_io_4_color);
    }
    """

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .callback()
                .call('code1')
                .call('code2')
              .join()
              .call('code3')
              .end()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)

