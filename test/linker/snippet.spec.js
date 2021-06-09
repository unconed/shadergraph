describe("snippet", function() {
  const { GLSL, Linker } = ShaderGraph;
  const { Snippet } = Linker;

  let snippet = null;
  const configLocal  = { globalAttributes: false, globalVaryings: false, globalUniforms: false };
  const configGlobal = { globalAttributes: true,  globalVaryings: true,  globalUniforms: true };

  beforeEach(function() {
    const code = `\
uniform float uni1;
uniform vec3 uni2;
attribute vec3 att1;
attribute vec4 att2;
varying vec4 var1;
varying vec3 var2;
void callback1(in vec3 color);
void callback2(out vec3 color);
void testSnippet(float param) { };\
`;

    return snippet = Snippet.load(GLSL, 'test', code);
  });

  it('loads', function() {
    expect(snippet).toBeTruthy();
  });

  it('compiles locals with namespace', function() {
    snippet.bind(configLocal, '_sgtest_');

    expect(snippet.entry).toBe('_sgtest_testSnippet');
    expect(snippet.main).toBeTruthy();

    expect(snippet.main.signature.length).toBe(1);
    expect(snippet.main.signature[0].name).toBe('param');
    expect(snippet.main.signature[0].type).toBe('f');

    expect(snippet.uniforms['_sgtest_uni1'].name).toBe('uni1');
    expect(snippet.uniforms['_sgtest_uni1'].type).toBe('f');
    expect(snippet.uniforms['_sgtest_uni2'].name).toBe('uni2');
    expect(snippet.uniforms['_sgtest_uni2'].type).toBe('v3');

    expect(snippet.externals['_sgtest_callback1'].name).toBe('callback1');
    expect(snippet.externals['_sgtest_callback1'].type).toBe('(v3)()');
    expect(snippet.externals['_sgtest_callback2'].name).toBe('callback2');
    expect(snippet.externals['_sgtest_callback2'].type).toBe('()(v3)');

    expect(snippet.attributes['_sgtest_att1'].name).toBe('att1');
    expect(snippet.attributes['_sgtest_att1'].type).toBe('v3');
    expect(snippet.attributes['_sgtest_att2'].name).toBe('att2');
    expect(snippet.attributes['_sgtest_att2'].type).toBe('v4');

    expect(snippet.varyings['_sgtest_var1'].name).toBe('var1');
    expect(snippet.varyings['_sgtest_var1'].type).toBe('v4');
    expect(snippet.varyings['_sgtest_var2'].name).toBe('var2');
    expect(snippet.varyings['_sgtest_var2'].type).toBe('v3');
  });

  it('compiles globals without namespace', function() {
    snippet.bind(configGlobal, '_sgtest_');

    expect(snippet.entry).toBe('_sgtest_testSnippet');
    expect(snippet.main).toBeTruthy();

    expect(snippet.main.signature.length).toBe(1);
    expect(snippet.main.signature[0].name).toBe('param');
    expect(snippet.main.signature[0].type).toBe('f');

    expect(snippet.uniforms['uni1'].name).toBe('uni1');
    expect(snippet.uniforms['uni1'].type).toBe('f');
    expect(snippet.uniforms['uni2'].name).toBe('uni2');
    expect(snippet.uniforms['uni2'].type).toBe('v3');

    expect(snippet.externals['_sgtest_callback1'].name).toBe('callback1');
    expect(snippet.externals['_sgtest_callback1'].type).toBe('(v3)()');
    expect(snippet.externals['_sgtest_callback2'].name).toBe('callback2');
    expect(snippet.externals['_sgtest_callback2'].type).toBe('()(v3)');

    expect(snippet.attributes['att1'].name).toBe('att1');
    expect(snippet.attributes['att1'].type).toBe('v3');
    expect(snippet.attributes['att2'].name).toBe('att2');
    expect(snippet.attributes['att2'].type).toBe('v4');

    expect(snippet.varyings['var1'].name).toBe('var1');
    expect(snippet.varyings['var1'].type).toBe('v4');
    expect(snippet.varyings['var2'].name).toBe('var2');
    expect(snippet.varyings['var2'].type).toBe('v3');
  });

  it('binds uniforms', function() {
    const uniforms = {
      uni1: {
        type: 'f',
        value: 1.0
      }
    };
    snippet.bind(configLocal, uniforms, '_bind_');

    expect(snippet.uniforms['_bind_uni1']).toBe(uniforms.uni1);
  });

  it('binds uniforms (backwards arguments)', function() {
    const uniforms = {
      uni1: {
        type: 'f',
        value: 1.0
      }
    };
    snippet.bind(configLocal, '_bind_', uniforms);

    expect(snippet.uniforms['_bind_uni1']).toBe(uniforms.uni1);
  });

  it('adds defines', function() {
    snippet.bind(configLocal, '_sgtest_', {}, { FOOBAR: '', BARFOO: 1 });
    expect(snippet.code).toMatch(/#define FOOBAR\s+#define BARFOO 1\s/m);
  });

  it('adds defines (backwards arguments)', function() {
    snippet.bind(configLocal, '_sgtest_', {}, { FOOBAR: '', BARFOO: 1 });
    expect(snippet.code).toMatch(/#define FOOBAR\s+#define BARFOO 1\s/m);
  });

  it('adds defines (shorthand syntax)', function() {
    snippet.bind(configLocal, {}, { FOOBAR: '', BARFOO: 1 });
    expect(snippet.code).toMatch(/#define FOOBAR\s+#define BARFOO 1\s/m);
  });
});
