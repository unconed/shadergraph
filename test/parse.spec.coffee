Snippet = ShaderGraph.Snippet

describe "parser", () ->

  program = null

  beforeEach () ->
    code = """
    // Comment
    uniform float uf, ufv1[3];
    uniform vec2 uv2;
    // Comment
    uniform vec2 uv2v[3];
    uniform vec3 uv3, uv3v[3];
    uniform vec4 uv4;
    uniform vec4 uv4v[3];
    uniform sampler2D utv[3], ut;
    varying float vf;
    varying float vfv1[3];
    varying mat3 vm3;
    varying mat3 vm3v[3];
    varying mat4 vm4;
    varying mat4 vm4v[3];
    attribute float af;
    attribute float afv1[3];
    attribute vec3 av3;
    attribute vec3 av3v[3];
    attribute mat4 am4;
    attribute mat4 am4v[3];

    void callback1(in vec4 v4in);

    void callback2(in vec3 v3in, out vec4 v4out);

    void internal(in mat4 m4in, out mat4 m4out) {
      m4out = m4in;
    }

    void callback3(in vec3 v3in, in vec4 v4in, out vec4 v4out);

    void snippetTest(
      in vec4 v4in, mat3 m3vin[3],
      out vec4 v4out, out vec4 v4vout[3], out mat4 m4out, out mat4 m4vout[3],
      inout vec3 v3inout) {
         gl_FragColor = v4in.xyz;
    }
    """

    parse = Snippet.parse
    program = parse 'test', code

  it 'parses GLSL and signatures', () ->
    expect(program).toBeTruthy()

  it 'builds an AST tree', () ->

    expect(program.ast).toBeTruthy()
    expect(program.ast.children.length).toBeTruthy()
    expect(program.ast.children[0].children.length).toBeTruthy()

    expect(program.ast.type).toBe('stmtlist')
    expect(program.ast.children[0].type).toBe('stmt')
    expect(program.ast.children[0].children[0].type).toBe('decl')

  it 'parses uniforms/varying/attributes', () ->

    expect(program.signatures).toBeTruthy()

    s = program.signatures

    expect(s.uniform.length).toBe(10)

    expect(s.uniform[0].name).toBe('uf')
    expect(s.uniform[0].type).toBe('f')

    expect(s.uniform[1].name).toBe('ufv1')
    expect(s.uniform[1].type).toBe('fv')

    expect(s.uniform[2].name).toBe('uv2')
    expect(s.uniform[2].type).toBe('v2')

    # ...

    expect(s.varying.length).toBe(6)

    expect(s.varying[0].name).toBe('vf')
    expect(s.varying[0].type).toBe('f')

    expect(s.varying[1].name).toBe('vfv1')
    expect(s.varying[1].type).toBe('fv')

    expect(s.varying[2].name).toBe('vm3')
    expect(s.varying[2].type).toBe('m3')

    # ...

    expect(s.attribute.length).toBe(6)

    expect(s.attribute[0].name).toBe('af')
    expect(s.attribute[0].type).toBe('f')

    expect(s.attribute[1].name).toBe('afv1')
    expect(s.attribute[1].type).toBe('fv')

    expect(s.attribute[2].name).toBe('av3')
    expect(s.attribute[2].type).toBe('v3')

  it 'parses main and callbacks', () ->

    expect(program.signatures).toBeTruthy()

    s = program.signatures

    expect(s.main).toBeTruthy()
    expect(s.main.name).toBe('snippetTest')
    expect(s.main.type).toBe('(v4,m3v,v3)(v4,v4v,m4,m4v,v3)')

    expect(s.external.length).toBe(3)

    expect(s.external[0].name).toBe('callback1')
    expect(s.external[0].type).toBe('(v4)()')

    expect(s.external[1].name).toBe('callback2')
    expect(s.external[1].type).toBe('(v3)(v4)')

    expect(s.external[2].name).toBe('callback3')
    expect(s.external[2].type).toBe('(v3,v4)(v4)')
