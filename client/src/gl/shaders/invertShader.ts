/**
 * invertShader.ts
 * 
 * Color inversion shader for WebGL.
 * Inverts all colors in the image.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function invertShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Effect parameters
uniform float u_amount;

// Output color
out vec4 fragColor;

void main() {
  // Sample original color
  vec4 color = texture(u_inputTexture, v_texCoord);
  
  // Invert color (keep alpha unchanged)
  vec4 invertedColor = vec4(1.0 - color.rgb, color.a);
  
  // Mix between original and inverted based on amount
  fragColor = mix(color, invertedColor, u_amount);
}
`;

  const shader = new GLShader('invert', fragmentSource, 'Inverts image colors');
  
  // Add parameters and uniforms
  shader.addParameter({
    name: 'amount',
    type: 'float',
    defaultValue: 1.0,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    description: 'Amount of inversion effect'
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