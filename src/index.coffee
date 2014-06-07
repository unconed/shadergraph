glsl     = require './glsl'
f        = require './factory'
l        = require './linker'

Factory  = f.Factory
Material = f.Material
library  = f.library
cache    = f.cache

Snippet  = l.Snippet

merge = (a, b = {}) ->
  out = {}
  out[key] = b[key] ? a[key] for key, value of a
  out

class ShaderGraph
  constructor: (snippets, config) ->
    return new ShaderGraph snippets, config if @ !instanceof ShaderGraph

    defaults =
      globalUniforms:   false
      globalVaryings:   true
      globalAttributes: true
      globals:          []

    @config = merge defaults, config
    @fetch  = cache library glsl, snippets, Snippet.load

  shader: (config = {}) ->
    _config = merge @config, config
    new Factory glsl, @fetch, _config

  material: (config) ->
    new Material @shader(config), @shader(config)

  # Expose class hierarchy
  @Block:   require './block'
  @Factory: require './factory'
  @GLSL:    require './glsl'
  @Graph:   require './graph'
  @Linker:  require './linker'

module.exports = ShaderGraph
window.ShaderGraph = ShaderGraph




###


code1 = """
float getMultiplier();
float foobar(vec3 color) {
  return color.x * getMultiplier();
}
"""

code2 = """
void foobar(out float valueOut, in float valueIn) {
  valueOut = valueIn * 2.0;
}
"""

code3 = """
void main(in float a, in float b) {
}
"""

code4 = """
float getMultiplier() {
  return 1.5;
}
"""

snippets = {
  'code1': code1
  'code2': code2
  'code3': code3
  'code4': code4
}

shadergraph = ShaderGraph snippets

shader  = shadergraph.shader()
graph   = shader
          .callback()
            .call('code4')
          .join()
          .call('code1')
          .split()
            .call('code2')
          .next()
            .call('code2')
          .join()
          .call('code3')
          .end()

snippet = graph.link()

normalize = (code) ->
  # renumber generated outputs
  map = {}
  o = s = p = 0
  code = code.replace /\b_io_[0-9]+([A-Za-z0-9_]+)\b/g, (match, name) ->
    map[match] ? map[match] = "_io_#{++o}#{name}"
  code = code.replace /\b_sn_[0-9]+([A-Za-z0-9_]+)\b/g, (match, name) ->
    map[match] ? map[match] = "_sn_#{++s}#{name}"
  code = code.replace /\b_pg_[0-9]+_\b/g, (match) ->
    map[match] ? map[match] = "_pg_#{++p}_"

window.graph   = graph
window.snippet = snippet
window.code    = normalize(snippet.code)

###









###

code = """
// Comment
uniform float uf;
uniform float ufv1[3];
uniform vec2 uv2;
// Comment
uniform vec2 uv2v[3];
uniform vec3 uv3;
uniform vec3 uv3v[3];
uniform vec4 uv4;
uniform vec4 uv4v[3];
uniform sampler2D ut;
uniform sampler2D utv[3];
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

void callback3(in vec3 v3in, in vec4 v4in, out vec4 v4out);

void snippetTest(
  in vec3 v3in, in vec4 v4in, mat3 m3vin[3],
  out vec4 v4out, out vec4 v4vout[3], out mat4 m4out, out mat4 m4vout[3],
  inout vec3 v3inout) {
    callback1(v4in);
    callback2(v3in, v4out);
    callback3(v3in, v4in, v4out);
    gl_FragColor = vec4(v4in.xyz, 1.0);
}
"""











code = """
uniform vec3 color;

#pragma external
const void callback(const in vec4 rgba);

#pragma export
void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); };

"""







code = """
uniform vec2 sampleStep;

uniform float fadeOut;
uniform float field;
uniform float time;

uniform sampler2D texture;
varying vec2 vUV;

float randf(vec2 xy) {
  return fract(sin(dot(xy, vec2(3.1380, 7.41)) * 13.414) * 1414.32);
}

const float c = .9999875;
const float s = .005;
const mat2 roto1 = mat2(c, s, -s, c);
const mat2 roto2 = mat2(c, -s, s, c);

const float c2 = .9998;
const float s2 = .02;
const mat2 roto3 = mat2(c2, -s2, s2, c2);

vec2 rotozoom(vec2 xy) {
  float r = sqrt(dot(xy, xy));
  xy *= (7.0 * r + sin(r)) * .125 / r;
  xy *= roto1;

  return xy;
}

vec2 planeproject(vec2 xy) {
  float f = .0625 * (15.0 + 1.0 / (-xy.y + 1.5));
  xy *= f;
  xy *= roto2;

  return xy;
}

vec2 ball(vec2 xy) {
  float r = sqrt(dot(xy, xy));
  xy *= (3.0 + 1.75 * tan(r * .5) / r) * .25;
  xy *= roto3;

  return xy;
}

vec2 swirl(vec2 xy) {
  vec2 a = xy * 2.25 * 6.28;
  xy += vec2(sin(a.y), sin(a.x)) * .01;

  vec2 b = xy * 4.5 * 6.28;
  xy += vec2(-sin(b.y), sin(b.x)) * .01;

  vec2 c = xy * 9.0 * 6.28;
  xy += vec2(-sin(c.y), -sin(c.x)) * .01;
  return xy;
}

vec2 warp(vec2 xy, float q) {

  float r = sqrt(dot(xy, xy));
  float th = atan(xy.y, xy.x) * 6.0;
  float f = .99 * (r + sin(r * r * q * .5 + time + sin(th) * 2.0) * .02) / r;

  return xy * f;
}

vec2 tiles(vec2 xy) {

  vec2 grid = floor(xy * 9.0);
  float index = mod(grid.x + grid.y + (1.0 + grid.x) * grid.x * grid.y * 3.0, 4.0);

  float d = .01;
  if (index < .5) {
    xy.x += d;
  }
  else if (index < 1.5) {
    xy.x -= d;
  }
  else if (index < 2.5) {
    xy.y += d;
  }
  else {
    xy.y -= d;
  }

  return xy;
}

vec2 flower(vec2 xy) {
  vec2 orig = xy;
  float r = sqrt(dot(xy, xy));
  float th = atan(xy.y, xy.x);

  float th2 = th + sin(r * 64.0);
  float r2 = r + sin(th * 64.0);

  return mix(orig, vec2(cos(th2) * r2, sin(th2) * r2), .01);
}

vec2 rotate(vec2 xy, vec2 ref, float a) {
  vec2 diff = xy - ref;
  float c = cos(a);
  float s = sin(a);
  return ref + diff * mat2(c, -s, s, c);
}

void callback();

void main() {
  vec2 xy = (vUV * 2.0 - 1.0) * vec2(16.0/9.0, 1.0);
  vec2 pos = xy;

  callback();

  if (field > 0.0) {

    if (field < 1.0) {
      xy = mix(xy, rotozoom(pos), clamp(field, 0.0, 1.0));
    }
    else if (field < 2.0) {
      xy = rotozoom(pos);
      xy = mix(xy, planeproject(pos), clamp(field - 1.0, 0.0, 1.0));
    }
    else if (field < 3.0) {
      xy = planeproject(pos);
      xy = mix(xy, ball(pos), clamp(field - 2.0, 0.0, 1.0));
    }
    else if (field < 4.0) {
      xy = ball(pos);
      xy = mix(xy, rotate(xy, pos, time), clamp(field - 3.0, 0.0, 1.0));
    }
    else if (field < 5.0) {
      xy = ball(pos);
      xy = rotate(xy, pos, time);
      xy = mix(xy, rotate(swirl(pos), pos, time), clamp(field - 4.0, 0.0, 1.0) * .5);
    }
    else if (field < 6.0) {
      xy = ball(pos);
      xy = rotate(xy, pos, time);
      xy = mix(xy, rotate(swirl(pos), pos, time), .5);
      xy = mix(xy, mix(rotate(warp(pos * 1.131, 32.0) / 1.131, pos, -time * 1.711), rotate(warp(pos, 27.0), pos, time), .5), clamp(field - 5.0, 0.0, 1.0));
    }
    else if (field < 7.0) {
      xy = mix(rotate(warp(pos * 1.131, 32.0) / 1.131, pos, -time * 1.711), rotate(warp(pos, 27.0), pos, time), .5);
      xy = mix(xy, rotate(tiles(pos), pos, -time), clamp(field - 6.0, 0.0, 1.0));
    }
    else { //if (field < 8.0) {
      xy = rotate(tiles(pos), pos, -time) * .995;
      xy = mix(xy, flower(pos), clamp(field - 7.0, 0.0, 1.0));
    }

    xy += sampleStep * .2;
  }

  xy *= vec2(9.0/16.0, 1.0);

  vec2 uv = fract(xy * .5 + .5);
  vec4 sample = texture2D(texture, uv);

  gl_FragColor = vec4(sample.xyz - vec3(fadeOut), 1.0);

}

"""







code = """
uniform vec2 sampleStep;

uniform float uf1[2], uf2[3];
uniform float fadeOut;
uniform float field[3];
uniform float time, space;
uniform float aa[2], bb[3], cc, dd, ee[4];

uniform sampler2D texture;
varying vec2 vUV;
// woo
const float cf1, cf2;
vec4 gv4;

#pragma woo
#if

float randf(vec2 xy) {
  vec2 a[2], b, c;
  float x = cf1 + cf2;
  float d, e, f;
  return fract(sin(dot(xy, vec2(3.1380, 7.41)) * 1.0 * 2.0 / 3.0 / 4.0 * 5.0) * 1414.32);
}

"""
###
