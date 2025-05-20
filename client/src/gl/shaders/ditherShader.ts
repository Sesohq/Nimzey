/**
 * ditherShader.ts
 * 
 * Dithering effect implementation for WebGL.
 * Creates retro dithering effects with various algorithms.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function ditherShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Dither parameters
uniform int u_algorithm; // 0: Bayer, 1: Blue Noise, 2: Error Diffusion
uniform float u_intensity;
uniform float u_threshold;
uniform int u_matrixSize; // For Bayer dithering (2, 4, 8)
uniform vec2 u_resolution;
uniform bool u_colorDither; // true for color dithering, false for black & white
uniform int u_colorLevels; // Number of color levels per channel

// Output color
out vec4 fragColor;

// Bayer dithering matrices
const mat2 BAYER2 = mat2(0.0, 2.0, 3.0, 1.0) / 4.0;

const mat4 BAYER4 = mat4(
  0.0, 8.0, 2.0, 10.0,
  12.0, 4.0, 14.0, 6.0,
  3.0, 11.0, 1.0, 9.0,
  15.0, 7.0, 13.0, 5.0
) / 16.0;

const float BAYER8[64] = float[](
  0.0, 32.0, 8.0, 40.0, 2.0, 34.0, 10.0, 42.0,
  48.0, 16.0, 56.0, 24.0, 50.0, 18.0, 58.0, 26.0,
  12.0, 44.0, 4.0, 36.0, 14.0, 46.0, 6.0, 38.0,
  60.0, 28.0, 52.0, 20.0, 62.0, 30.0, 54.0, 22.0,
  3.0, 35.0, 11.0, 43.0, 1.0, 33.0, 9.0, 41.0,
  51.0, 19.0, 59.0, 27.0, 49.0, 17.0, 57.0, 25.0,
  15.0, 47.0, 7.0, 39.0, 13.0, 45.0, 5.0, 37.0,
  63.0, 31.0, 55.0, 23.0, 61.0, 29.0, 53.0, 21.0
) / 64.0;

// Hash function for blue noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Get Bayer matrix value at specified coordinates
float getBayerValue(ivec2 coord) {
  if (u_matrixSize == 2) {
    return BAYER2[coord.y % 2][coord.x % 2];
  } else if (u_matrixSize == 4) {
    return BAYER4[coord.y % 4][coord.x % 4];
  } else { // size 8
    int idx = (coord.y % 8) * 8 + (coord.x % 8);
    return BAYER8[idx];
  }
}

// Apply threshold using a dither pattern
float applyDither(float value, float ditherValue, float threshold) {
  return step(ditherValue * u_intensity, value + threshold - 0.5);
}

// Quantize color to specific number of levels
vec3 quantize(vec3 color, int levels) {
  if (levels <= 1) return vec3(0.0); // Avoid division by zero
  return floor(color * float(levels)) / float(levels - 1);
}

void main() {
  // Sample original color
  vec4 originalColor = texture(u_inputTexture, v_texCoord);
  
  // Get pixel position
  ivec2 pixelCoord = ivec2(v_texCoord * u_resolution);
  
  // Calculate dither pattern value based on selected algorithm
  float ditherValue = 0.0;
  
  if (u_algorithm == 0) {
    // Bayer dithering
    ditherValue = getBayerValue(pixelCoord);
  } else if (u_algorithm == 1) {
    // Blue noise dithering (approximated with hash)
    ditherValue = hash(vec2(pixelCoord) / u_resolution);
  } else {
    // Error diffusion is more complex and would ideally use multiple passes
    // For now, we'll use a simple noise pattern as an approximation
    ditherValue = hash(vec2(pixelCoord));
  }
  
  // Apply dithering
  vec4 result;
  
  if (u_colorDither) {
    // Color dithering - quantize each channel
    vec3 quantized = quantize(originalColor.rgb, u_colorLevels);
    
    // Apply dither to help visually smooth the transitions between levels
    vec3 error = originalColor.rgb - quantized;
    vec3 dithered = originalColor.rgb + (ditherValue - 0.5) * u_intensity / float(u_colorLevels);
    result = vec4(quantize(dithered, u_colorLevels), originalColor.a);
  } else {
    // Black and white dithering
    float luminance = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));
    float dithered = applyDither(luminance, ditherValue, u_threshold / 255.0);
    result = vec4(vec3(dithered), originalColor.a);
  }
  
  // Output final color
  fragColor = result;
}
`;

  const shader = new GLShader('dither', fragmentSource, 'Creates retro dithering effects');
  
  // Add parameters
  shader.addParameter({
    name: 'algorithm',
    type: 'int',
    defaultValue: 0,
    min: 0,
    max: 2,
    step: 1,
    description: 'Dithering algorithm (0: Bayer, 1: Blue Noise, 2: Error Diffusion)'
  });
  
  shader.addParameter({
    name: 'intensity',
    type: 'float',
    defaultValue: 1.0,
    min: 0.0,
    max: 2.0,
    step: 0.05,
    description: 'Dithering intensity'
  });
  
  shader.addParameter({
    name: 'threshold',
    type: 'float',
    defaultValue: 127.0,
    min: 0.0,
    max: 255.0,
    step: 1.0,
    description: 'Threshold for black & white dithering'
  });
  
  shader.addParameter({
    name: 'matrixSize',
    type: 'int',
    defaultValue: 4,
    min: 2,
    max: 8,
    step: 2,
    description: 'Bayer matrix size (2, 4, or 8)'
  });
  
  shader.addParameter({
    name: 'colorDither',
    type: 'bool',
    defaultValue: false,
    description: 'Enable color dithering (vs black & white)'
  });
  
  shader.addParameter({
    name: 'colorLevels',
    type: 'int',
    defaultValue: 4,
    min: 2,
    max: 16,
    step: 1,
    description: 'Number of color levels per channel'
  });
  
  // Add uniforms
  shader.addUniform({
    name: 'u_inputTexture',
    type: 'sampler2D',
    value: null,
    description: 'Input texture'
  });
  
  shader.addUniform({
    name: 'u_algorithm',
    type: 'int',
    value: 0,
    description: 'Dithering algorithm'
  });
  
  shader.addUniform({
    name: 'u_intensity',
    type: 'float',
    value: 1.0,
    description: 'Dithering intensity'
  });
  
  shader.addUniform({
    name: 'u_threshold',
    type: 'float',
    value: 127.0,
    description: 'Threshold for black & white dithering'
  });
  
  shader.addUniform({
    name: 'u_matrixSize',
    type: 'int',
    value: 4,
    description: 'Bayer matrix size'
  });
  
  shader.addUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [1.0, 1.0],
    description: 'Viewport resolution'
  });
  
  shader.addUniform({
    name: 'u_colorDither',
    type: 'bool',
    value: false,
    description: 'Enable color dithering'
  });
  
  shader.addUniform({
    name: 'u_colorLevels',
    type: 'int',
    value: 4,
    description: 'Number of color levels per channel'
  });
  
  return shader;
}