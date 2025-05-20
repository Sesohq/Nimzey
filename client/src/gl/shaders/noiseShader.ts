/**
 * noiseShader.ts
 * 
 * Noise generation shader for WebGL.
 * Adds procedural noise to the image, with support for various noise types.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function noiseShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Noise parameters
uniform float u_amount;
uniform int u_noiseType; // 0: random, 1: perlin, 2: simplex, 3: value
uniform float u_seed;
uniform vec2 u_resolution;

// Output color
out vec4 fragColor;

// Hash function for random noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Integer hash for perlin noise
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)),
           dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Generate random noise
float randomNoise(vec2 uv, float seed) {
  // Add seed to coordinates
  uv += seed;
  return hash(uv);
}

// Generate value noise
float valueNoise(vec2 uv, float seed) {
  uv *= 10.0; // Scale for more interesting noise
  uv += seed;
  
  vec2 i = floor(uv);
  vec2 f = fract(uv);
  
  // Four corners of cell
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  // Smooth interpolation (cubic Hermite)
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  // Mix the four corners
  return mix(mix(a, b, u.x),
             mix(c, d, u.x), u.y);
}

// Perlin noise implementation
float perlinNoise(vec2 uv, float seed) {
  uv *= 5.0; // Scale for more interesting noise
  uv += seed;
  
  vec2 i = floor(uv);
  vec2 f = fract(uv);
  
  // Four corners gradients
  vec2 g00 = hash2(i);
  vec2 g10 = hash2(i + vec2(1.0, 0.0));
  vec2 g01 = hash2(i + vec2(0.0, 1.0));
  vec2 g11 = hash2(i + vec2(1.0, 1.0));
  
  // Dot products with corner gradients
  float n00 = dot(g00, f);
  float n10 = dot(g10, f - vec2(1.0, 0.0));
  float n01 = dot(g01, f - vec2(0.0, 1.0));
  float n11 = dot(g11, f - vec2(1.0, 1.0));
  
  // Smooth interpolation (cubic Hermite)
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  // Mix the four corners
  return mix(mix(n00, n10, u.x),
             mix(n01, n11, u.x), u.y) * 0.5 + 0.5; // Map from [-1,1] to [0,1]
}

// Simplex noise helper functions
float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

// Simplex noise implementation
float simplexNoise(vec2 v, float seed) {
  v *= 5.0; // Scale for more interesting noise
  v += seed;
  
  // Noise contributions from the three corners
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                      -0.577350269189626, // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  
  // First corner
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  
  // Other corners
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  
  // Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                         + i.x + vec3(0.0, i1.x, 1.0));
  
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  
  // Gradients: 41 points uniformly over a line, mapped onto a diamond.
  // The ring size is controlled by RNOISE in the original code
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  
  // Normalise gradients implicitly by scaling m
  // Approximation of: m *= inversesqrt(a0*a0 + h*h);
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  
  // Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g) * 0.5 + 0.5; // Map from [-1,1] to [0,1]
}

void main() {
  // Sample original color
  vec4 color = texture(u_inputTexture, v_texCoord);
  
  // Generate noise based on selected type
  float noise = 0.0;
  
  if (u_noiseType == 0) {
    // Random noise
    noise = randomNoise(v_texCoord * u_resolution, u_seed);
  } else if (u_noiseType == 1) {
    // Perlin noise
    noise = perlinNoise(v_texCoord, u_seed);
  } else if (u_noiseType == 2) {
    // Simplex noise
    noise = simplexNoise(v_texCoord, u_seed);
  } else {
    // Value noise
    noise = valueNoise(v_texCoord, u_seed);
  }
  
  // Convert noise to [-0.5, 0.5] range for better visual effect
  noise = noise - 0.5;
  
  // Apply noise to color
  vec3 noisyColor = color.rgb + (noise * u_amount);
  
  // Output final color
  fragColor = vec4(noisyColor, color.a);
}
`;

  const shader = new GLShader('noise', fragmentSource, 'Adds procedural noise to the image');
  
  // Add parameters
  shader.addParameter({
    name: 'amount',
    type: 'float',
    defaultValue: 0.2,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    description: 'Noise intensity'
  });
  
  shader.addParameter({
    name: 'noiseType',
    type: 'int',
    defaultValue: 1, // Default to Perlin noise
    min: 0,
    max: 3,
    step: 1,
    description: 'Type of noise (0: Random, 1: Perlin, 2: Simplex, 3: Value)'
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
  
  // Add uniforms
  shader.addUniform({
    name: 'u_inputTexture',
    type: 'sampler2D',
    value: null,
    description: 'Input texture'
  });
  
  shader.addUniform({
    name: 'u_amount',
    type: 'float',
    value: 0.2,
    description: 'Noise intensity'
  });
  
  shader.addUniform({
    name: 'u_noiseType',
    type: 'int',
    value: 1,
    description: 'Type of noise'
  });
  
  shader.addUniform({
    name: 'u_seed',
    type: 'float',
    value: 1.0,
    description: 'Random seed'
  });
  
  shader.addUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [1.0, 1.0],
    description: 'Viewport resolution'
  });
  
  return shader;
}