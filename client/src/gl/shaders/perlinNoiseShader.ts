/**
 * Perlin Noise Generator Shader
 * 
 * Based on Filter Forge implementation - generates procedural Perlin noise
 * with multiple octaves and configurable parameters.
 */

import { GLShader } from '../core/GLShader';

export function createPerlinNoiseShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_seed;
uniform int u_octaves;
uniform float u_persistence;

// Permutation table for Perlin noise
vec4 permute(vec4 x) {
  return mod(((x*34.0)+1.0)*x, 289.0);
}

vec2 fade(vec2 t) {
  return t*t*t*(t*(t*6.0 - 15.0) + 10.0);
}

// 2D Perlin noise implementation
float perlin(in vec2 P) {
  vec2 Pi = floor(P);
  vec2 Pf = fract(P);
  
  // Hash corners
  vec4 ix = vec4(Pi.x, Pi.x+1.0, Pi.x, Pi.x+1.0);
  vec4 iy = vec4(Pi.y, Pi.y, Pi.y+1.0, Pi.y+1.0);
  vec4 perm = permute(permute(ix) + iy);
  
  // Gradients
  vec4 gx = fract(perm * (1.0/41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  gx = gx - floor(gx + 0.5);
  
  // Interpolate
  vec2 fadeXY = fade(Pf);
  
  vec2 v1 = vec2(gx.x, gy.x) * vec2(Pf.x, Pf.y);
  vec2 v2 = vec2(gx.y, gy.y) * vec2(Pf.x-1.0, Pf.y);
  vec2 v3 = vec2(gx.z, gy.z) * vec2(Pf.x, Pf.y-1.0);
  vec2 v4 = vec2(gx.w, gy.w) * vec2(Pf.x-1.0, Pf.y-1.0);
  
  float n1 = mix(dot(v1, vec2(1.0)), dot(v2, vec2(1.0)), fadeXY.x);
  float n2 = mix(dot(v3, vec2(1.0)), dot(v4, vec2(1.0)), fadeXY.x);
  
  return mix(n1, n2, fadeXY.y);
}

// Multi-octave Perlin noise
float octavePerlin(vec2 uv, int octaves, float persistence) {
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  float maxValue = 0.0;
  
  for(int i = 0; i < 8; i++) {
    if(i >= octaves) break;
    
    value += perlin(uv * frequency) * amplitude;
    maxValue += amplitude;
    
    amplitude *= persistence;
    frequency *= 2.0;
  }
  
  return value / maxValue;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  
  // Apply scale and seed offset
  vec2 scaledUV = uv * u_scale + vec2(u_seed);
  
  // Generate multi-octave Perlin noise
  float noise = octavePerlin(scaledUV, u_octaves, u_persistence);
  
  // Normalize from [-1,1] to [0,1]
  float normalizedNoise = noise * 0.5 + 0.5;
  
  // Output as grayscale
  fragColor = vec4(vec3(normalizedNoise), 1.0);
}
`;

  const shader = new GLShader('perlinNoise', fragmentSource, 'Generates procedural Perlin noise patterns');
  
  // Add parameters that match the filter definition
  shader.addParameter({
    name: 'width',
    type: 'int',
    defaultValue: 512,
    min: 64,
    max: 2048,
    step: 64,
    description: 'Output texture width'
  });
  
  shader.addParameter({
    name: 'height',
    type: 'int',
    defaultValue: 512,
    min: 64,
    max: 2048,
    step: 64,
    description: 'Output texture height'
  });
  
  shader.addParameter({
    name: 'scale',
    type: 'float',
    defaultValue: 4.0,
    min: 0.1,
    max: 20.0,
    step: 0.1,
    description: 'Noise scale/frequency'
  });
  
  shader.addParameter({
    name: 'seed',
    type: 'float',
    defaultValue: 1.0,
    min: 0.0,
    max: 100.0,
    step: 0.1,
    description: 'Random seed for noise generation'
  });
  
  shader.addParameter({
    name: 'octaves',
    type: 'int',
    defaultValue: 4,
    min: 1,
    max: 8,
    step: 1,
    description: 'Number of noise octaves'
  });
  
  shader.addParameter({
    name: 'persistence',
    type: 'float',
    defaultValue: 0.5,
    min: 0.1,
    max: 1.0,
    step: 0.01,
    description: 'Amplitude reduction per octave'
  });
  
  // Add uniforms
  shader.addUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [512.0, 512.0],
    description: 'Output resolution'
  });
  
  shader.addUniform({
    name: 'u_scale',
    type: 'float',
    value: 4.0,
    description: 'Noise scale'
  });
  
  shader.addUniform({
    name: 'u_seed',
    type: 'float',
    value: 1.0,
    description: 'Random seed'
  });
  
  shader.addUniform({
    name: 'u_octaves',
    type: 'int',
    value: 4,
    description: 'Number of octaves'
  });
  
  shader.addUniform({
    name: 'u_persistence',
    type: 'float',
    value: 0.5,
    description: 'Amplitude persistence'
  });
  
  return shader;
}