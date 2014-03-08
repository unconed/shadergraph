Snippet = ShaderGraph.Snippet

describe "snippet", () ->

  snippet = null

  beforeEach () ->
    code = """
    uniform float uni;
    attribute vec3 att;
    varying vec4 var;
    void testSnippet() { }
    """

    snippet = Snippet.load 'test', code

  it 'loads', () ->
    expect(snippet).toBeTruthy()

  it 'compiles with namespace', () ->

    snippet.apply {}, '_sgtest_'

    expect(snippet.entry).toBe('_sgtest_testSnippet')
    expect(snippet.main).toBeTruthy()

    # rename uniforms
    expect(snippet.uniforms['_sgtest_uni'].name).toBe('uni')
    expect(snippet.uniforms['_sgtest_uni'].type).toBe('f')

    # don't rename attributes
    expect(snippet.attributes['att'].name).toBe('att')
    expect(snippet.attributes['att'].type).toBe('v3')

  it 'binds uniforms', () ->
    uniforms =
      uni:
        type: 'f'
        value: 1.0
    snippet.apply uniforms, '_bind_'

    expect(snippet.uniforms['_bind_uni']).toEqual(uniforms.uni)
