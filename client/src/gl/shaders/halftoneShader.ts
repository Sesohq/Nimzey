/**
 * halftoneShader.ts
 * 
 * Halftone effect implementation for WebGL.
 * Creates a printed halftone dot pattern effect.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function halftoneShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Halftone parameters
uniform float u_dotSize;
uniform float u_spacing;
uniform float u_angle;
uniform vec2 u_resolution;
uniform int u_shape; // 0: circle, 1: square, 2: line, 3: diamond
uniform bool u_inverted;
uniform vec3 u_dotColor;
uniform vec3 u_backgroundColor;
uniform bool u_useCustomColors;

// Output color
out vec4 fragColor;

// Rotation matrix for pattern angle
mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

// Circle pattern
float circlePattern(vec2 center, float radius, vec2 coord, float value) {
  float dist = distance(center, coord);
  float dotRadius = radius * value;
  return step(dist, dotRadius);
}

// Square pattern
float squarePattern(vec2 center, float size, vec2 coord, float value) {
  float halfSize = size * value * 0.5;
  vec2 d = abs(coord - center);
  return step(d.x, halfSize) * step(d.y, halfSize);
}

// Line pattern
float linePattern(vec2 center, float width, vec2 coord, float angle, float value) {
  // Rotate
  coord = rotate2d(angle) * (coord - center) + center;
  
  // Calculate line mask
  float lineWidth = width * value;
  return step(abs(coord.y - center.y), lineWidth * 0.5);
}

// Diamond pattern
float diamondPattern(vec2 center, float size, vec2 coord, float value) {
  float halfSize = size * value * 0.5;
  vec2 d = abs(coord - center);
  return step(d.x + d.y, halfSize);
}

void main() {
  // Sample original color
  vec4 originalColor = texture(u_inputTexture, v_texCoord);
  
  // Get luminance (brightness)
  float luminance = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));
  
  // Invert if needed
  float value = u_inverted ? 1.0 - luminance : luminance;
  
  // Calculate dot pattern grid
  float spacing = max(2.0, u_spacing);
  vec2 rotatedCoord = rotate2d(u_angle) * (v_texCoord * u_resolution);
  vec2 center = spacing * floor(rotatedCoord / spacing) + spacing * 0.5;
  center = rotate2d(-u_angle) * center / u_resolution;
  
  // Apply selected pattern
  float pattern = 0.0;
  
  if (u_shape == 0) {
    // Circle pattern
    pattern = circlePattern(center, u_dotSize * 0.5, v_texCoord, value);
  } else if (u_shape == 1) {
    // Square pattern
    pattern = squarePattern(center, u_dotSize, v_texCoord, value);
  } else if (u_shape == 2) {
    // Line pattern
    pattern = linePattern(center, u_dotSize, v_texCoord, u_angle, value);
  } else if (u_shape == 3) {
    // Diamond pattern
    pattern = diamondPattern(center, u_dotSize, v_texCoord, value);
  }
  
  // Determine final color
  vec3 finalColor;
  
  if (u_useCustomColors) {
    // Use custom dot and background colors
    finalColor = mix(u_backgroundColor, u_dotColor, pattern);
  } else {
    // Use original color for dots and white background
    finalColor = mix(vec3(1.0), originalColor.rgb, pattern);
  }
  
  // Output final color
  fragColor = vec4(finalColor, originalColor.a);
}
`;

  const shader = new GLShader('halftone', fragmentSource, 'Creates a printed halftone dot pattern effect');
  
  // Add parameters
  shader.addParameter({
    name: 'dotSize',
    type: 'float',
    defaultValue: 8.0,
    min: 1.0,
    max: 50.0,
    step: 0.5,
    description: 'Size of halftone dots'
  });
  
  shader.addParameter({
    name: 'spacing',
    type: 'float',
    defaultValue: 16.0,
    min: 2.0,
    max: 100.0,
    step: 1.0,
    description: 'Spacing between dots'
  });
  
  shader.addParameter({
    name: 'angle',
    type: 'float',
    defaultValue: 0.0,
    min: 0.0,
    max: 6.28318, // 2*PI
    step: 0.1,
    description: 'Angle of halftone pattern'
  });
  
  shader.addParameter({
    name: 'shape',
    type: 'int',
    defaultValue: 0,
    min: 0,
    max: 3,
    step: 1,
    description: 'Shape of halftone pattern (0: circle, 1: square, 2: line, 3: diamond)'
  });
  
  shader.addParameter({
    name: 'inverted',
    type: 'bool',
    defaultValue: false,
    description: 'Invert the halftone pattern'
  });
  
  shader.addParameter({
    name: 'dotColor',
    type: 'vec3',
    defaultValue: [0.0, 0.0, 0.0],
    description: 'Custom color for dots'
  });
  
  shader.addParameter({
    name: 'backgroundColor',
    type: 'vec3',
    defaultValue: [1.0, 1.0, 1.0],
    description: 'Custom color for background'
  });
  
  shader.addParameter({
    name: 'useCustomColors',
    type: 'bool',
    defaultValue: false,
    description: 'Use custom colors instead of original image colors'
  });
  
  // Add uniforms
  shader.addUniform({
    name: 'u_inputTexture',
    type: 'sampler2D',
    value: null,
    description: 'Input texture'
  });
  
  shader.addUniform({
    name: 'u_dotSize',
    type: 'float',
    value: 8.0,
    description: 'Size of halftone dots'
  });
  
  shader.addUniform({
    name: 'u_spacing',
    type: 'float',
    value: 16.0,
    description: 'Spacing between dots'
  });
  
  shader.addUniform({
    name: 'u_angle',
    type: 'float',
    value: 0.0,
    description: 'Angle of halftone pattern'
  });
  
  shader.addUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [1.0, 1.0],
    description: 'Viewport resolution'
  });
  
  shader.addUniform({
    name: 'u_shape',
    type: 'int',
    value: 0,
    description: 'Shape of halftone pattern'
  });
  
  shader.addUniform({
    name: 'u_inverted',
    type: 'bool',
    value: false,
    description: 'Invert the halftone pattern'
  });
  
  shader.addUniform({
    name: 'u_dotColor',
    type: 'vec3',
    value: [0.0, 0.0, 0.0],
    description: 'Custom color for dots'
  });
  
  shader.addUniform({
    name: 'u_backgroundColor',
    type: 'vec3',
    value: [1.0, 1.0, 1.0],
    description: 'Custom color for background'
  });
  
  shader.addUniform({
    name: 'u_useCustomColors',
    type: 'bool',
    value: false,
    description: 'Use custom colors'
  });
  
  return shader;
}