Snippet = ShaderGraph.Linker.Snippet
GLSL    = ShaderGraph.GLSL

describe "snippet", () ->

  snippet = null

  beforeEach () ->
    code = """
    uniform float uni1;
    uniform vec3 uni2;
    attribute vec3 att1;
    attribute vec4 att2;
    void callback1(in vec3 color);
    void callback2(out vec3 color);
    void testSnippet(float param) { };
    """

    snippet = Snippet.load GLSL, 'test', code

  it 'loads', () ->
    expect(snippet).toBeTruthy()

  it 'compiles with namespace', () ->

    snippet.bind {}, '_sgtest_'

    expect(snippet.entry).toBe('_sgtest_testSnippet')
    expect(snippet.main).toBeTruthy()

    expect(snippet.main.signature.length).toBe(1)
    expect(snippet.main.signature[0].name).toBe('param')
    expect(snippet.main.signature[0].type).toBe('f')

    expect(snippet.uniforms['_sgtest_uni1'].name).toBe('uni1')
    expect(snippet.uniforms['_sgtest_uni1'].type).toBe('f')
    expect(snippet.uniforms['_sgtest_uni2'].name).toBe('uni2')
    expect(snippet.uniforms['_sgtest_uni2'].type).toBe('v3')

    expect(snippet.externals['_sgtest_callback1'].name).toBe('callback1')
    expect(snippet.externals['_sgtest_callback1'].type).toBe('(v3)()')
    expect(snippet.externals['_sgtest_callback2'].name).toBe('callback2')
    expect(snippet.externals['_sgtest_callback2'].type).toBe('()(v3)')

    # don't rename attributes
    expect(snippet.attributes['att1'].name).toBe('att1')
    expect(snippet.attributes['att1'].type).toBe('v3')
    expect(snippet.attributes['att2'].name).toBe('att2')
    expect(snippet.attributes['att2'].type).toBe('v4')

  it 'binds uniforms', () ->
    uniforms =
      uni:
        type: 'f'
        value: 1.0
    snippet.bind uniforms, '_bind_'

    expect(snippet.uniforms['_bind_uni']).toBe(uniforms.uni)
