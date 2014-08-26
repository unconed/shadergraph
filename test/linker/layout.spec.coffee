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

  it 'links a callback (callback/end)', () ->

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

    shader  = shadergraph.shader()
    graph   = shader
              .callback()
                .pipe('code1')
              .end()
              .pipe('code2')
              .graph()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)
    expect(snippet.entry.match /^_pg_[0-9]+_$/).toBeTruthy


  it 'links a callback (require)', () ->

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

    shader  = shadergraph.shader()
    graph   = shader
              .require('code1')
              .pipe('code2')
              .graph()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)
    expect(snippet.entry.match /^_pg_[0-9]+_$/).toBeTruthy


  it 'links a callback recursively (callback/end)', () ->

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
    }
    """

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .callback()
                .callback()
                  .pipe('code1')
                .end()
                .pipe('code2')
              .end()
              .pipe('code3')
              .graph()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)



  it 'creates linkages for subgraphs and signature mismatches (callback/end)', () ->

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
                .pipe('code1')
                .pipe('code2')
              .end()
              .pipe('code3')
              .graph()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)


  it 'links nested graphs (isolate/end)', () ->

    code1 = """
    float foobar(vec3 color) {
      return color.x;
    }
    """

    code2 = """
    void main(float f) {
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
    }

    result = """
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
    }
    """

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .isolate()
                .pipe('code1')
              .end()
              .pipe('code2')
              .graph()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)

  it 'handles piped requires (require/require/pipe)', () ->

    code1 = """
    vec3 getColor() {
      return vec3(0.2, 0.3, 0.4);
    }
    """

    code2 = """
    vec3 getColor1();
    vec3 getColor2();
    vec3 getColorSum() {
      return getColor1() + getColor2();
    }
    """

    code3 = """
    vec3 getColor();
    void main() {
      gl_FragColor = vec4(getColor(), 1.0);
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
      'code3': code3
    }

    result = """
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
    }
    """

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .require('code1')
              .require('code1')
              .require('code2')
              .pipe('code3')
              .graph()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)

  it 'handles piped requires with deep nesting (require/isolate/require/end/pipe)', () ->

    code1 = """
    vec3 getColor() {
      return vec3(0.2, 0.3, 0.4);
    }
    """

    code2 = """
    vec3 getColor1();
    vec3 getColor2();
    vec3 getColorSum() {
      return getColor1() + getColor2();
    }
    """

    code3 = """
    vec3 getColor();
    void main() {
      gl_FragColor = vec4(getColor(), 1.0);
    }
    """

    snippets = {
      'code1': code1
      'code2': code2
      'code3': code3
    }

    result = """
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
    }
    """

    shadergraph = ShaderGraph snippets

    shader  = shadergraph.shader()
    graph   = shader
              .require('code1')
              .require('code1')
              .isolate()
                .require('code2')
              .end()
              .pipe('code3')
              .graph()

    snippet = graph.link('main')
    code = normalize(snippet.code)

    expect(code).toBe(result)

  it 'de-dupes a repeated singleton (require/require/pipe)', () ->

    squareColor = """
    vec3 squareColor(vec3 rgb) {
      return rgb * rgb;
    }
    """

    getColor = """
    vec3 getColor() {
      return vec3(1.0, 0.5, 0.25);
    }
    """

    getCallbackColor = """
    vec3 getColor();
    vec3 getCallbackColor() {
      return getColor() * 2.0;
    }
    """

    setColor = """
    vec3 getColor1();
    vec3 getColor2();
    void setColor() {
      vec3 color = getColor1() + getColor2();
      gl_FragColor = vec4(color, 1.0);
    }
    """

    snippets = {squareColor, getColor, getCallbackColor, setColor}

    result = """
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
    }
    """

    shadergraph = ShaderGraph snippets

    # Prepare pipeline of two snippets
    pipeline = shadergraph.shader()
    pipeline.pipe 'getColor'
    pipeline.pipe 'squareColor'

    # Prepare callback
    callback = shadergraph.shader()
    callback.require pipeline
    callback.pipe 'getCallbackColor'

    # Build shader graph
    shader = shadergraph.shader();
    shader.require callback
    shader.require callback
    shader.pipe 'setColor'

    snippet = shader.link('main');
    code = normalize(snippet.code)

    expect(code).toBe(result)

  it 'de-dupes a repeated singleton (require/require/pipe)', () ->

    squareColor = """
    vec3 squareColor(vec3 rgb) {
      return rgb * rgb;
    }
    """

    getColor = """
    vec3 getColor() {
      return vec3(1.0, 0.5, 0.25);
    }
    """

    setColor = """
    vec3 mapColor1(vec3 color);
    vec3 mapColor2(vec3 color);
    void setColor(vec3 color) {
      color = mapColor1(color);
      color = mapColor2(color);
      gl_FragColor = vec4(color, 1.0);
    }
    """

    snippets = {squareColor, getColor, setColor}

    result = """
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
    }
    """

    shadergraph = ShaderGraph snippets

    # Prepare instanced snippet
    instance = shadergraph.shader()
    instance.pipe 'squareColor'

    # Build callback graph
    callback = shadergraph.shader()
    callback.pipe instance
    callback.pipe instance

    # Wrap into single node graph
    isolate = shadergraph.shader()
    isolate.pipe callback

    # Build shader graph
    shader = shadergraph.shader()
    shader.pipe 'getColor'
    shader.require isolate
    shader.require isolate
    shader.pipe 'setColor'

    # Link entire shader into a main() function
    snippet = shader.link('main');
    code = normalize(snippet.code)

    expect(code).toBe(result)

  it 'impedance matches a singleton (require/require/pipe)', () ->

    squareColor = """
    vec3 squareColor(vec3 rgb) {
      return rgb * rgb;
    }
    """

    getColor = """
    vec3 getColor() {
      return vec3(1.0, 0.5, 0.25);
    }
    """

    getCallbackColor = """
    void getColor(out vec3 color);
    vec3 getCallbackColor() {
      vec3 c;
      getColor(c);
      return c * 2.0;
    }
    """

    setColor = """
    vec3 getColor1();
    vec3 getColor2();
    void setColor() {
      vec3 color = getColor1() + getColor2();
      gl_FragColor = vec4(color, 1.0);
    }
    """

    snippets = {squareColor, getColor, getCallbackColor, setColor}

    result = """
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
    }
    """

    shadergraph = ShaderGraph snippets

    # Prepare pipeline of two snippets
    pipeline = shadergraph.shader()
    pipeline.pipe 'getColor'
    pipeline.pipe 'squareColor'

    # Prepare callback
    callback = shadergraph.shader()
    callback.require pipeline
    callback.pipe 'getCallbackColor'

    # Build shader graph
    shader = shadergraph.shader();
    shader.require callback
    shader.require callback
    shader.pipe 'setColor'

    snippet = shader.link('main');
    code = normalize(snippet.code)

    expect(code).toBe(result)
