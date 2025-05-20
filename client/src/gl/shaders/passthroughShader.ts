/**
 * passthroughShader.ts
 * 
 * A simple passthrough shader that copies the input texture to the output.
 * Used for nodes that don't apply any filtering, like image nodes or output nodes.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function passthroughShader(): GLShader {
  return GLShaderFactory.createBasicShader(
    'passthrough',
    'Copies input texture to output without modifications',
    `
  // Simple pass-through shader
  // We don't need to modify color as it's already sampled from the input texture
  `
  );
}