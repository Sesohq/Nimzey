/**
 * Checkerboard Generator Shader
 * 
 * Based on Filter Forge implementation - generates a perfect checkerboard pattern
 * with configurable repeats and colors.
 */

import { GLShader } from '../core/GLShader';

export function createCheckerboardShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_repeat;     // { repeatH, repeatV }
uniform vec4 u_color1;     // RGBA for square type 0
uniform vec4 u_color2;     // RGBA for square type 1

void main() {
  // Compute normalized UV [0,1]
  vec2 uv = gl_FragCoord.xy / u_resolution;
  
  // Scale by repeats to create grid
  vec2 grid = uv * u_repeat;
  
  // Determine square indices by flooring
  float ix = floor(grid.x);
  float iy = floor(grid.y);
  
  // Create alternating pattern using modulo
  float mask = mod(ix + iy, 2.0);
  
  // Mix colors: mask==0 gives color1, mask==1 gives color2
  fragColor = mix(u_color1, u_color2, mask);
}
`;

  const shader = new GLShader('checkerboard', fragmentSource, 'Generates a procedural checkerboard pattern');
  
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
    name: 'repeatH',
    type: 'int',
    defaultValue: 8,
    min: 1,
    max: 32,
    step: 1,
    description: 'Horizontal repeat count'
  });
  
  shader.addParameter({
    name: 'repeatV',
    type: 'int',
    defaultValue: 8,
    min: 1,
    max: 32,
    step: 1,
    description: 'Vertical repeat count'
  });
  
  shader.addParameter({
    name: 'color1',
    type: 'vec4',
    defaultValue: [1.0, 1.0, 1.0, 1.0],
    description: 'First color (white squares)'
  });
  
  shader.addParameter({
    name: 'color2',
    type: 'vec4',
    defaultValue: [0.0, 0.0, 0.0, 1.0],
    description: 'Second color (black squares)'
  });
  
  // Add uniforms
  shader.addUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [512.0, 512.0],
    description: 'Output resolution'
  });
  
  shader.addUniform({
    name: 'u_repeat',
    type: 'vec2',
    value: [8.0, 8.0],
    description: 'Repeat counts'
  });
  
  shader.addUniform({
    name: 'u_color1',
    type: 'vec4',
    value: [1.0, 1.0, 1.0, 1.0],
    description: 'First color'
  });
  
  shader.addUniform({
    name: 'u_color2',
    type: 'vec4',
    value: [0.0, 0.0, 0.0, 1.0],
    description: 'Second color'
  });
  
  return shader;
}