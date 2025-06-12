/**
 * maskShader.ts
 * 
 * WebGL shader implementation for the Mask blender filter.
 * Implements Filter Forge's exact Mask component behavior with support
 * for both alpha and luminance modes.
 */

import { GLShader, ShaderParameter } from '../core/GLShader';

export function createMaskShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input textures
uniform sampler2D u_inputTexture;
uniform sampler2D u_maskTexture;
uniform float u_useLuma;

// Output color
out vec4 fragColor;

// Rec.709 luminance coefficients for perceptual brightness
float getLuma(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec2 uv = v_texCoord;
  
  // Sample source and mask textures
  vec4 sourceColor = texture(u_inputTexture, uv);
  vec4 maskColor = texture(u_maskTexture, uv);
  
  // Calculate mask value based on mode
  float maskValue;
  if (u_useLuma > 0.5) {
    // Luma mode: use Rec.709 luminance
    maskValue = getLuma(maskColor.rgb);
  } else {
    // Alpha mode: use alpha channel
    maskValue = maskColor.a;
  }
  
  // Apply mask to source
  fragColor = vec4(sourceColor.rgb * maskValue, sourceColor.a * maskValue);
}`;

  const shader = new GLShader('mask', fragmentSource, 'Multiplies source image by mask values (alpha or luminance)');
  
  // Add input texture uniform
  shader.addUniform({
    name: 'u_inputTexture',
    type: 'sampler2D',
    value: null,
    description: 'Source image to be masked'
  });
  
  // Add mask texture uniform
  shader.addUniform({
    name: 'u_maskTexture',
    type: 'sampler2D', 
    value: null,
    description: 'Mask image (grayscale or alpha)'
  });
  
  // Add luma mode parameter
  shader.addParameter({
    name: 'useLuma',
    type: 'bool',
    defaultValue: false,
    description: 'Use luminance mode instead of alpha mode'
  });
  
  // Add corresponding uniform for luma mode
  shader.addUniform({
    name: 'u_useLuma',
    type: 'float',
    value: 0.0,
    description: 'Use luminance mode (1.0) or alpha mode (0.0)'
  });

  return shader;
}