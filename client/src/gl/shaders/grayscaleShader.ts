/**
 * grayscaleShader.ts
 * 
 * Grayscale filter implementation for WebGL.
 * Converts image to grayscale using luminance weights.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function grayscaleShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Grayscale parameters
uniform float u_amount;

// Output color
out vec4 fragColor;

void main() {
  // Sample original color
  vec4 color = texture(u_inputTexture, v_texCoord);
  
  // Calculate luminance using perceptual weights
  float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  
  // Create grayscale color
  vec4 grayscaleColor = vec4(vec3(luminance), color.a);
  
  // Mix between original and grayscale based on amount
  fragColor = mix(color, grayscaleColor, u_amount);
}
`;

  const shader = new GLShader('grayscale', fragmentSource, 'Converts image to grayscale');
  
  // Add parameters and uniforms
  shader.addParameter({
    name: 'amount',
    type: 'float',
    defaultValue: 1.0,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    description: 'Amount of grayscale effect'
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
    value: 1.0,
    description: 'Effect amount'
  });
  
  return shader;
}