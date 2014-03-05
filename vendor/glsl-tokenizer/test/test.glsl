
precision highp int;
precision highp float;
precision highp vec2;
precision highp vec3;
precision highp vec4;
#line 0

#define X(a) Y \
  asdf \
  barry

varying vec2 vTexcoord;
varying vec3 vPosition;
uniform mat4 proj, view;
 
    attribute vec3 position;
    attribute vec2 texcoord;
 
    void main(){
        vTexcoord = texcoord;
        vPosition = position;
        gl_Position = proj * view * vec4(position, 1.0);
    }
