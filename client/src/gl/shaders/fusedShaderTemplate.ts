/**
 * fusedShaderTemplate.ts
 * 
 * Template for generating fused GLSL shaders from multiple filter nodes.
 * This template is used by the graph compiler to create optimized single-pass shaders.
 */

export const FUSED_SHADER_TEMPLATE = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Common uniforms
uniform sampler2D u_inputTexture;
uniform vec2 u_resolution;

// Custom uniform declarations
/* UNIFORM_DECLARATIONS */

// Output color
out vec4 fragColor;

// Common utility functions
float luminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

// Gaussian function for blur calculations
float gaussian(float x, float sigma) {
  return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * 3.14159265359) * sigma);
}

void main() {
  // Initialize with input texture sample
  vec4 color = texture(u_inputTexture, v_texCoord);
  
  // Fused filter chain - code inserted by graph compiler
  /* MAIN_FUNCTION_BODY */
  
  // Output final color
  fragColor = color;
}
`;

/**
 * Generate a fused shader source from individual shader functions
 */
export function generateFusedShaderSource(
  uniforms: string[], 
  shaderFunctions: string[],
  mainBody: string[]
): string {
  // Start with the template
  let source = FUSED_SHADER_TEMPLATE;
  
  // Add custom uniforms
  source = source.replace('/* UNIFORM_DECLARATIONS */', uniforms.join('\n'));
  
  // Add functions section if any
  if (shaderFunctions.length > 0) {
    const functionsBlock = shaderFunctions.join('\n\n');
    source = source.replace('// Common utility functions', 
      `// Common utility functions\n\n${functionsBlock}`);
  }
  
  // Add main body
  source = source.replace('/* MAIN_FUNCTION_BODY */', mainBody.join('\n\n'));
  
  return source;
}