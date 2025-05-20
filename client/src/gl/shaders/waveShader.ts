/**
 * waveShader.ts
 * 
 * Wave distortion effect implementation for WebGL.
 * Creates flowing wave patterns and distortions.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function waveShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Wave parameters
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_speed;
uniform float u_time;
uniform int u_direction; // 0: horizontal, 1: vertical, 2: both
uniform vec2 u_resolution;

// Output color
out vec4 fragColor;

void main() {
  // Calculate distortion based on wave parameters
  vec2 distortion = vec2(0.0);
  
  // Wave amplitude in normalized coordinates
  float amplitude = u_amplitude / 100.0;
  
  // Calculate time-based phase
  float phase = u_time * u_speed;
  
  // Calculate wave effect
  if (u_direction == 0 || u_direction == 2) {
    // Horizontal wave
    distortion.y = amplitude * sin(u_frequency * v_texCoord.x * 6.28318 + phase);
  }
  
  if (u_direction == 1 || u_direction == 2) {
    // Vertical wave
    distortion.x = amplitude * sin(u_frequency * v_texCoord.y * 6.28318 + phase);
  }
  
  // Apply distortion to texture coordinates
  vec2 distortedCoord = v_texCoord + distortion;
  
  // Sample the distorted coordinates
  vec4 color = texture(u_inputTexture, distortedCoord);
  
  // Handle sampling outside texture bounds
  if (distortedCoord.x < 0.0 || distortedCoord.x > 1.0 || 
      distortedCoord.y < 0.0 || distortedCoord.y > 1.0) {
    // Option 1: Use original color for out-of-bounds sampling
    color = texture(u_inputTexture, v_texCoord);
    
    // Option 2: Create a border effect (uncomment to use)
    // color = vec4(0.0, 0.0, 0.0, 1.0);
  }
  
  // Output final color
  fragColor = color;
}
`;

  const shader = new GLShader('wave', fragmentSource, 'Creates flowing wave patterns and distortions');
  
  // Add parameters
  shader.addParameter({
    name: 'amplitude',
    type: 'float',
    defaultValue: 10.0,
    min: 0.0,
    max: 50.0,
    step: 0.5,
    description: 'Wave amplitude'
  });
  
  shader.addParameter({
    name: 'frequency',
    type: 'float',
    defaultValue: 5.0,
    min: 0.1,
    max: 20.0,
    step: 0.1,
    description: 'Wave frequency'
  });
  
  shader.addParameter({
    name: 'speed',
    type: 'float',
    defaultValue: 0.5,
    min: 0.0,
    max: 5.0,
    step: 0.1,
    description: 'Wave animation speed'
  });
  
  shader.addParameter({
    name: 'direction',
    type: 'int',
    defaultValue: 0,
    min: 0,
    max: 2,
    step: 1,
    description: 'Wave direction (0: horizontal, 1: vertical, 2: both)'
  });
  
  // Add uniforms
  shader.addUniform({
    name: 'u_inputTexture',
    type: 'sampler2D',
    value: null,
    description: 'Input texture'
  });
  
  shader.addUniform({
    name: 'u_amplitude',
    type: 'float',
    value: 10.0,
    description: 'Wave amplitude'
  });
  
  shader.addUniform({
    name: 'u_frequency',
    type: 'float',
    value: 5.0,
    description: 'Wave frequency'
  });
  
  shader.addUniform({
    name: 'u_speed',
    type: 'float',
    value: 0.5,
    description: 'Wave animation speed'
  });
  
  shader.addUniform({
    name: 'u_time',
    type: 'float',
    value: 0.0,
    description: 'Animation time'
  });
  
  shader.addUniform({
    name: 'u_direction',
    type: 'int',
    value: 0,
    description: 'Wave direction'
  });
  
  shader.addUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [1.0, 1.0],
    description: 'Viewport resolution'
  });
  
  return shader;
}