/**
 * blendShader.ts
 * 
 * Blend mode implementation for WebGL.
 * Supports various blend modes for combining images and effects.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function blendShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input textures
uniform sampler2D u_inputTexture;
uniform sampler2D u_overlayTexture;

// Blend parameters
uniform int u_blendMode; // 0: normal, 1: multiply, 2: screen, etc.
uniform float u_opacity;

// Output color
out vec4 fragColor;

// Normal blend mode
vec4 blendNormal(vec4 base, vec4 blend) {
  return blend;
}

// Multiply blend mode
vec4 blendMultiply(vec4 base, vec4 blend) {
  return base * blend;
}

// Screen blend mode
vec4 blendScreen(vec4 base, vec4 blend) {
  return vec4(1.0) - (vec4(1.0) - base) * (vec4(1.0) - blend);
}

// Overlay blend mode
vec4 blendOverlay(vec4 base, vec4 blend) {
  vec4 result;
  
  // Apply overlay formula for each channel
  for (int i = 0; i < 3; i++) {
    if (base[i] < 0.5) {
      result[i] = 2.0 * base[i] * blend[i];
    } else {
      result[i] = 1.0 - 2.0 * (1.0 - base[i]) * (1.0 - blend[i]);
    }
  }
  
  // Keep original alpha
  result.a = base.a;
  
  return result;
}

// Darken blend mode
vec4 blendDarken(vec4 base, vec4 blend) {
  return vec4(min(base.rgb, blend.rgb), base.a);
}

// Lighten blend mode
vec4 blendLighten(vec4 base, vec4 blend) {
  return vec4(max(base.rgb, blend.rgb), base.a);
}

// Color dodge blend mode
vec4 blendColorDodge(vec4 base, vec4 blend) {
  vec3 result;
  
  for (int i = 0; i < 3; i++) {
    if (blend[i] == 1.0) {
      result[i] = 1.0;
    } else {
      result[i] = min(1.0, base[i] / (1.0 - blend[i]));
    }
  }
  
  return vec4(result, base.a);
}

// Color burn blend mode
vec4 blendColorBurn(vec4 base, vec4 blend) {
  vec3 result;
  
  for (int i = 0; i < 3; i++) {
    if (blend[i] == 0.0) {
      result[i] = 0.0;
    } else {
      result[i] = 1.0 - min(1.0, (1.0 - base[i]) / blend[i]);
    }
  }
  
  return vec4(result, base.a);
}

// Hard light blend mode
vec4 blendHardLight(vec4 base, vec4 blend) {
  vec3 result;
  
  for (int i = 0; i < 3; i++) {
    if (blend[i] < 0.5) {
      result[i] = 2.0 * base[i] * blend[i];
    } else {
      result[i] = 1.0 - 2.0 * (1.0 - base[i]) * (1.0 - blend[i]);
    }
  }
  
  return vec4(result, base.a);
}

// Soft light blend mode
vec4 blendSoftLight(vec4 base, vec4 blend) {
  vec3 result;
  
  for (int i = 0; i < 3; i++) {
    if (blend[i] < 0.5) {
      result[i] = base[i] - (1.0 - 2.0 * blend[i]) * base[i] * (1.0 - base[i]);
    } else {
      float d;
      if (base[i] < 0.25) {
        d = ((16.0 * base[i] - 12.0) * base[i] + 4.0) * base[i];
      } else {
        d = sqrt(base[i]);
      }
      result[i] = base[i] + (2.0 * blend[i] - 1.0) * (d - base[i]);
    }
  }
  
  return vec4(result, base.a);
}

// Difference blend mode
vec4 blendDifference(vec4 base, vec4 blend) {
  return vec4(abs(base.rgb - blend.rgb), base.a);
}

// Exclusion blend mode
vec4 blendExclusion(vec4 base, vec4 blend) {
  return vec4(base.rgb + blend.rgb - 2.0 * base.rgb * blend.rgb, base.a);
}

void main() {
  // Sample textures
  vec4 baseColor = texture(u_inputTexture, v_texCoord);
  vec4 blendColor = texture(u_overlayTexture, v_texCoord);
  
  // Apply selected blend mode
  vec4 blendedColor;
  
  switch (u_blendMode) {
    case 0: // Normal
      blendedColor = blendNormal(baseColor, blendColor);
      break;
    case 1: // Multiply
      blendedColor = blendMultiply(baseColor, blendColor);
      break;
    case 2: // Screen
      blendedColor = blendScreen(baseColor, blendColor);
      break;
    case 3: // Overlay
      blendedColor = blendOverlay(baseColor, blendColor);
      break;
    case 4: // Darken
      blendedColor = blendDarken(baseColor, blendColor);
      break;
    case 5: // Lighten
      blendedColor = blendLighten(baseColor, blendColor);
      break;
    case 6: // Color Dodge
      blendedColor = blendColorDodge(baseColor, blendColor);
      break;
    case 7: // Color Burn
      blendedColor = blendColorBurn(baseColor, blendColor);
      break;
    case 8: // Hard Light
      blendedColor = blendHardLight(baseColor, blendColor);
      break;
    case 9: // Soft Light
      blendedColor = blendSoftLight(baseColor, blendColor);
      break;
    case 10: // Difference
      blendedColor = blendDifference(baseColor, blendColor);
      break;
    case 11: // Exclusion
      blendedColor = blendExclusion(baseColor, blendColor);
      break;
    default: // Normal
      blendedColor = blendNormal(baseColor, blendColor);
      break;
  }
  
  // Apply opacity
  fragColor = mix(baseColor, blendedColor, u_opacity * blendColor.a);
}
`;

  const shader = new GLShader('blend', fragmentSource, 'Blends two images using various modes');
  
  // Add parameters
  shader.addParameter({
    name: 'blendMode',
    type: 'int',
    defaultValue: 0,
    min: 0,
    max: 11,
    step: 1,
    description: 'Blend mode (0: Normal, 1: Multiply, 2: Screen, etc.)'
  });
  
  shader.addParameter({
    name: 'opacity',
    type: 'float',
    defaultValue: 1.0,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    description: 'Blend opacity'
  });
  
  // Add uniforms
  shader.addUniform({
    name: 'u_inputTexture',
    type: 'sampler2D',
    value: null,
    description: 'Base texture'
  });
  
  shader.addUniform({
    name: 'u_overlayTexture',
    type: 'sampler2D',
    value: null,
    description: 'Overlay texture'
  });
  
  shader.addUniform({
    name: 'u_blendMode',
    type: 'int',
    value: 0,
    description: 'Blend mode'
  });
  
  shader.addUniform({
    name: 'u_opacity',
    type: 'float',
    value: 1.0,
    description: 'Blend opacity'
  });
  
  return shader;
}