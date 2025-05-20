/**
 * edgeDetectionShader.ts
 * 
 * Edge detection filter implementation for WebGL.
 * Implements Sobel, Prewitt, and other edge detection algorithms.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function edgeDetectionShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Edge detection parameters
uniform int u_method; // 0: Sobel, 1: Prewitt, 2: Laplacian
uniform float u_strength;
uniform float u_threshold;
uniform bool u_preserveColor;
uniform bool u_invert;
uniform vec2 u_resolution;

// Output color
out vec4 fragColor;

// Luminance conversion
float getLuminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

// Sample with offset
vec4 sampleOffset(vec2 offset) {
  return texture(u_inputTexture, v_texCoord + offset / u_resolution);
}

// Apply Sobel operator
vec3 applySobel() {
  // Define Sobel kernels
  float sobelX[9] = float[](
    -1.0, 0.0, 1.0,
    -2.0, 0.0, 2.0,
    -1.0, 0.0, 1.0
  );
  
  float sobelY[9] = float[](
    -1.0, -2.0, -1.0,
    0.0, 0.0, 0.0,
    1.0, 2.0, 1.0
  );
  
  float gx = 0.0;
  float gy = 0.0;
  
  // Apply convolution with Sobel kernels
  int idx = 0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      float luma = getLuminance(sampleOffset(vec2(float(x), float(y))).rgb);
      gx += luma * sobelX[idx];
      gy += luma * sobelY[idx];
      idx++;
    }
  }
  
  // Calculate gradient magnitude
  float g = sqrt(gx * gx + gy * gy);
  
  // Apply threshold
  g = g > (u_threshold / 255.0) ? g : 0.0;
  
  // Apply strength
  g *= u_strength;
  
  // Invert if needed
  if (u_invert) {
    g = 1.0 - g;
  }
  
  return vec3(g);
}

// Apply Prewitt operator
vec3 applyPrewitt() {
  // Define Prewitt kernels
  float prewittX[9] = float[](
    -1.0, 0.0, 1.0,
    -1.0, 0.0, 1.0,
    -1.0, 0.0, 1.0
  );
  
  float prewittY[9] = float[](
    -1.0, -1.0, -1.0,
    0.0, 0.0, 0.0,
    1.0, 1.0, 1.0
  );
  
  float gx = 0.0;
  float gy = 0.0;
  
  // Apply convolution with Prewitt kernels
  int idx = 0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      float luma = getLuminance(sampleOffset(vec2(float(x), float(y))).rgb);
      gx += luma * prewittX[idx];
      gy += luma * prewittY[idx];
      idx++;
    }
  }
  
  // Calculate gradient magnitude
  float g = sqrt(gx * gx + gy * gy);
  
  // Apply threshold
  g = g > (u_threshold / 255.0) ? g : 0.0;
  
  // Apply strength
  g *= u_strength;
  
  // Invert if needed
  if (u_invert) {
    g = 1.0 - g;
  }
  
  return vec3(g);
}

// Apply Laplacian operator
vec3 applyLaplacian() {
  // Define Laplacian kernel
  float laplacian[9] = float[](
    -1.0, -1.0, -1.0,
    -1.0, 8.0, -1.0,
    -1.0, -1.0, -1.0
  );
  
  float g = 0.0;
  
  // Apply convolution with Laplacian kernel
  int idx = 0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      float luma = getLuminance(sampleOffset(vec2(float(x), float(y))).rgb);
      g += luma * laplacian[idx];
      idx++;
    }
  }
  
  // Normalize and clamp
  g = abs(g);
  
  // Apply threshold
  g = g > (u_threshold / 255.0) ? g : 0.0;
  
  // Apply strength
  g *= u_strength;
  
  // Invert if needed
  if (u_invert) {
    g = 1.0 - g;
  }
  
  return vec3(g);
}

void main() {
  // Sample original color
  vec4 originalColor = texture(u_inputTexture, v_texCoord);
  
  // Apply edge detection based on selected method
  vec3 edgeColor;
  
  if (u_method == 0) {
    // Sobel
    edgeColor = applySobel();
  } else if (u_method == 1) {
    // Prewitt
    edgeColor = applyPrewitt();
  } else {
    // Laplacian
    edgeColor = applyLaplacian();
  }
  
  // Preserve original color if needed
  vec3 finalColor;
  if (u_preserveColor) {
    // Use edge detection as a mask on the original image
    finalColor = mix(vec3(0.0), originalColor.rgb, edgeColor.r);
  } else {
    // Use the edge detection result directly
    finalColor = edgeColor;
  }
  
  // Output final color
  fragColor = vec4(finalColor, originalColor.a);
}
`;

  const shader = new GLShader('edgeDetection', fragmentSource, 'Detects edges in the image');
  
  // Add parameters
  shader.addParameter({
    name: 'method',
    type: 'int',
    defaultValue: 0,
    min: 0,
    max: 2,
    step: 1,
    description: 'Edge detection method (0: Sobel, 1: Prewitt, 2: Laplacian)'
  });
  
  shader.addParameter({
    name: 'strength',
    type: 'float',
    defaultValue: 1.0,
    min: 0.0,
    max: 5.0,
    step: 0.1,
    description: 'Edge detection strength'
  });
  
  shader.addParameter({
    name: 'threshold',
    type: 'float',
    defaultValue: 25.0,
    min: 0.0,
    max: 255.0,
    step: 1.0,
    description: 'Edge detection threshold'
  });
  
  shader.addParameter({
    name: 'preserveColor',
    type: 'bool',
    defaultValue: false,
    description: 'Preserve original colors'
  });
  
  shader.addParameter({
    name: 'invert',
    type: 'bool',
    defaultValue: false,
    description: 'Invert edge detection result'
  });
  
  // Add uniforms
  shader.addUniform({
    name: 'u_inputTexture',
    type: 'sampler2D',
    value: null,
    description: 'Input texture'
  });
  
  shader.addUniform({
    name: 'u_method',
    type: 'int',
    value: 0,
    description: 'Edge detection method'
  });
  
  shader.addUniform({
    name: 'u_strength',
    type: 'float',
    value: 1.0,
    description: 'Edge detection strength'
  });
  
  shader.addUniform({
    name: 'u_threshold',
    type: 'float',
    value: 25.0,
    description: 'Edge detection threshold'
  });
  
  shader.addUniform({
    name: 'u_preserveColor',
    type: 'bool',
    value: false,
    description: 'Preserve original colors'
  });
  
  shader.addUniform({
    name: 'u_invert',
    type: 'bool',
    value: false,
    description: 'Invert edge detection result'
  });
  
  shader.addUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [1.0, 1.0],
    description: 'Viewport resolution'
  });
  
  return shader;
}