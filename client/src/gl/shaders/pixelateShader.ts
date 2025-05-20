/**
 * pixelateShader.ts
 * 
 * Pixelation filter implementation for WebGL.
 * Creates a blocky, pixelated effect with configurable pixel size.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function pixelateShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Pixelate parameters
uniform float u_pixelSize;
uniform vec2 u_resolution;

// Output color
out vec4 fragColor;

void main() {
  // Calculate pixel dimensions in normalized texture coordinates
  vec2 pixelSize = vec2(u_pixelSize) / u_resolution;
  
  // Calculate the position of the pixelated coordinate
  vec2 pixelatedCoord = floor(v_texCoord / pixelSize) * pixelSize + (pixelSize * 0.5);
  
  // Sample the pixel at the calculated position
  fragColor = texture(u_inputTexture, pixelatedCoord);
}
`;

  const shader = new GLShader('pixelate', fragmentSource, 'Creates a blocky, pixelated effect');
  
  // Add parameters
  shader.addParameter({
    name: 'pixelSize',
    type: 'float',
    defaultValue: 10.0,
    min: 1.0,
    max: 100.0,
    step: 1.0,
    description: 'Size of pixels in the effect'
  });
  
  // Add uniforms
  shader.addUniform({
    name: 'u_inputTexture',
    type: 'sampler2D',
    value: null,
    description: 'Input texture'
  });
  
  shader.addUniform({
    name: 'u_pixelSize',
    type: 'float',
    value: 10.0,
    description: 'Size of pixels'
  });
  
  shader.addUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [1.0, 1.0],
    description: 'Viewport resolution'
  });
  
  return shader;
}