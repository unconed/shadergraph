GLSL = ShaderGraph.GLSL

describe "compiler", () ->

  program    = null
  signatures = null
  assembler  = null

  code = """
  uniform float uf1[2], uf2[3];
  varying vec3 v3;
  attribute vec4 av4;
  const float cf;
  vec4 gv4 = vec4(1.0);
  // Comment
  void callback1(in vec4 v4in);
  /* Comment */
  #pragma test
  void callback2(in vec3 v3in, out vec4 v4out);
  void internal(in mat4 m4in, out mat4 m4out) {
    vec4 v4o;
    callback2(v3, v4o);
    m4out = m4in;
  };
  void callback3(in vec3 v3in, in vec4 v4in, out vec4 v4out);
  void main() {
    vec4 ov4;
    vec4 gv4_dummy;
    vec4 dummy_gv4;
    mat4 m1, m2;
    internal(m1, m2);
    callback1(av4);
    callback3(v3, gv4, ov4);
    gl_FragColor = ov4;
  };
  """

  result = """
  uniform float _t_uf1[2], _t_uf2[3];
  varying vec3 _t_v3;
  attribute vec4 av4;
  const float _t_cf;
  vec4 _t_gv4 = vec4(1.0);
  
  void _t_callback1(in vec4 v4in);
  
  
  void _t_callback2(in vec3 v3in, out vec4 v4out);
  void _t_internal(in mat4 m4in, out mat4 m4out) {
    vec4 v4o;
    _t_callback2(_t_v3, v4o);
    m4out = m4in;
  };
  void _t_callback3(in vec3 v3in, in vec4 v4in, out vec4 v4out);
  void _t_main() {
    vec4 ov4;
    vec4 gv4_dummy;
    vec4 dummy_gv4;
    mat4 m1, m2;
    _t_internal(m1, m2);
    _t_callback1(av4);
    _t_callback3(_t_v3, _t_gv4, ov4);
    gl_FragColor = ov4;
  };
  """

  beforeEach () ->
    parse   = GLSL.parse
    compile = GLSL.compile

    program = parse 'test', code
    [signatures, assembler] = compile program

  it 'creates an assembler function', () ->

    expect(assembler).toBeTruthy()
    expect(assembler.call).toBeTruthy()
    expect(assembler.apply).toBeTruthy()

  it 'assembles with prefix on all global symbols', () ->

    namespace = '_t_'
    compiled = assembler namespace

    expect(compiled).toBe(result)
