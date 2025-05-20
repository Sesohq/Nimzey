/**
 * glowShader.ts
 * 
 * Glow effect implementation for WebGL.
 * Creates a bloom/glow effect around bright areas of the image.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function glowShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Glow parameters
uniform float u_radius;
uniform float u_intensity;
uniform vec3 u_glowColor;
uniform bool u_useCustomColor;
uniform vec2 u_resolution;

// Output color
out vec4 fragColor;

// Gaussian function for glow weight
float gaussian(float x, float sigma) {
  return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * 3.14159265359) * sigma);
}

void main() {
  // Sample original color
  vec4 originalColor = texture(u_inputTexture, v_texCoord);
  
  // Skip processing if radius is 0
  if (u_radius <= 0.0) {
    fragColor = originalColor;
    return;
  }
  
  // Calculate normalized pixel size
  vec2 texelSize = 1.0 / u_resolution;
  
  // Determine glow source
  vec3 glowSource;
  if (u_useCustomColor) {
    // Use custom glow color
    glowSource = u_glowColor;
  } else {
    // Use original color as glow source
    glowSource = originalColor.rgb;
  }
  
  // Apply glow
  vec4 glowAccumulator = vec4(0.0);
  float weightSum = 0.0;
  
  // Two-pass approximation (horizontal + vertical)
  // Horizontal pass
  for (float x = -u_radius; x <= u_radius; x += 1.0) {
    float weight = gaussian(x, u_radius / 2.0);
    vec2 offset = vec2(x * texelSize.x, 0.0);
    glowAccumulator += texture(u_inputTexture, v_texCoord + offset) * weight;
    weightSum += weight;
  }
  
  // Normalize horizontal pass
  vec4 horizontalBlur = glowAccumulator / weightSum;
  
  // Reset accumulators for vertical pass
  glowAccumulator = vec4(0.0);
  weightSum = 0.0;
  
  // Vertical pass
  for (float y = -u_radius; y <= u_radius; y += 1.0) {
    float weight = gaussian(y, u_radius / 2.0);
    vec2 offset = vec2(0.0, y * texelSize.y);
    glowAccumulator += texture(u_inputTexture, v_texCoord + offset) * weight;
    weightSum += weight;
  }
  
  // Normalize vertical pass
  vec4 verticalBlur = glowAccumulator / weightSum;
  
  // Combine blur passes
  vec4 blurred = mix(horizontalBlur, verticalBlur, 0.5);
  
  // Calculate glow
  vec3 glow = blurred.rgb * u_intensity;
  
  if (u_useCustomColor) {
    // Modulate glow by custom color
    glow *= u_glowColor;
  }
  
  // Apply glow using screen blend mode (1 - (1 - base) * (1 - blend))
  vec3 result = originalColor.rgb + glow - originalColor.rgb * glow;
  
  // Output final color
  fragColor = vec4(result, originalColor.a);
}
`;

  const shader = new GLShader('glow', fragmentSource, 'Creates a bloom/glow effect around bright areas');
  
  // Add parameters
  shader.addParameter({
    name: 'radius',
    type: 'float',
    defaultValue: 10.0,
    min: 0.0,
    max: 50.0,
    step: 0.5,
    description: 'Glow radius'
  });
  
  shader.addParameter({
    name: 'intensity',
    type: 'float',
    defaultValue: 0.5,
    min: 0.0,
    max: 2.0,
    step: 0.05,
    description: 'Glow intensity'
  });
  
  shader.addParameter({
    name: 'glowColor',
    type: 'vec3',
    defaultValue: [1.0, 1.0, 1.0],
    description: 'Custom glow color'
  });
  
  shader.addParameter({
    name: 'useCustomColor',
    type: 'bool',
    defaultValue: false,
    description: 'Use custom glow color instead of source colors'
  });
  
  // Add uniforms
  shader.addUniform({
    name: 'u_inputTexture',
    type: 'sampler2D',
    value: null,
    description: 'Input texture'
  });
  
  shader.addUniform({
    name: 'u_radius',
    type: 'float',
    value: 10.0,
    description: 'Glow radius'
  });
  
  shader.addUniform({
    name: 'u_intensity',
    type: 'float',
    value: 0.5,
    description: 'Glow intensity'
  });
  
  shader.addUniform({
    name: 'u_glowColor',
    type: 'vec3',
    value: [1.0, 1.0, 1.0],
    description: 'Custom glow color'
  });
  
  shader.addUniform({
    name: 'u_useCustomColor',
    type: 'bool',
    value: false,
    description: 'Use custom glow color'
  });
  
  shader.addUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [1.0, 1.0],
    description: 'Viewport resolution'
  });
  
  return shader;
}