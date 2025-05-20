/**
 * sharpenShader.ts
 * 
 * Sharpen filter implementation for WebGL.
 * Uses an unsharp mask technique for high-quality results.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function sharpenShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Sharpen parameters
uniform float u_amount;
uniform vec2 u_resolution;

// Output color
out vec4 fragColor;

void main() {
  // Get pixel size
  vec2 texelSize = 1.0 / u_resolution;
  
  // Sample center pixel
  vec4 center = texture(u_inputTexture, v_texCoord);
  
  // Sample adjacent pixels (3x3 kernel)
  vec4 top = texture(u_inputTexture, v_texCoord + vec2(0.0, -texelSize.y));
  vec4 right = texture(u_inputTexture, v_texCoord + vec2(texelSize.x, 0.0));
  vec4 bottom = texture(u_inputTexture, v_texCoord + vec2(0.0, texelSize.y));
  vec4 left = texture(u_inputTexture, v_texCoord + vec2(-texelSize.x, 0.0));
  
  // Compute laplacian (4-neighbor)
  vec4 laplacian = 4.0 * center - top - right - bottom - left;
  
  // Apply unsharp mask formula: original + (amount * laplacian)
  vec4 sharpened = center + (u_amount * laplacian);
  
  // Enforce valid values
  fragColor = clamp(sharpened, 0.0, 1.0);
}
`;

  const shader = new GLShader('sharpen', fragmentSource, 'Sharpens the image details using unsharp masking');
  
  // Add parameters and uniforms
  shader.addParameter({
    name: 'amount',
    type: 'float',
    defaultValue: 0.5,
    min: 0.0,
    max: 5.0,
    step: 0.1,
    description: 'Sharpening amount'
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
    value: 0.5,
    description: 'Sharpening amount'
  });
  
  shader.addUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [1.0, 1.0],
    description: 'Viewport resolution'
  });
  
  return shader;
}