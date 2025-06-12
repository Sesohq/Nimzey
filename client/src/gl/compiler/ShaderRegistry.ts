/**
 * ShaderRegistry.ts
 * 
 * Registry of WebGL shaders for the filter engine.
 * Manages a collection of shaders and provides factory methods
 * for creating new shaders for different filter types.
 */

import { FilterType } from '@/types';
import { GLShader, GLShaderFactory, ShaderParameter } from '../core/GLShader';
import { createPerlinNoiseShader } from '../shaders/perlinNoiseShader';
import { createCheckerboardShader } from '../shaders/checkerboardShader';
import { createMaskShader } from '../shaders/maskShader';

export class ShaderRegistry {
  private shaders: Map<string, GLShader> = new Map();
  
  constructor() {
    this.registerDefaultShaders();
  }
  
  /**
   * Register a shader in the registry
   */
  public registerShader(filterType: string, shader: GLShader): void {
    this.shaders.set(filterType, shader);
  }
  
  /**
   * Get a shader from the registry
   */
  public getShader(filterType: string): GLShader | undefined {
    return this.shaders.get(filterType);
  }
  
  /**
   * Get all registered shaders
   */
  public getAllShaders(): Map<string, GLShader> {
    return this.shaders;
  }
  
  /**
   * Register default shaders
   */
  private registerDefaultShaders(): void {
    // Create simple passthrough shader
    const passthroughShader = GLShaderFactory.createBasicShader(
      'passthrough',
      'Copies input texture to output without modifications',
      `
      // Simple pass-through shader
      // We don't need to modify color as it's already sampled from the input texture
      `
    );
    
    // Register basic built-in shaders
    this.registerShader('passthrough', passthroughShader);
    
    // For the real implementation, we would register all the shader implementations here
    // Since we haven't implemented all of them yet, we'll use a placeholder approach
    const dummyShader = (name: string) => {
      return GLShaderFactory.createBasicShader(
        name,
        `Placeholder for ${name} shader`,
        `
        // This is a placeholder shader for demonstration
        // In the real implementation, this would be replaced with the actual shader code
        `
      );
    };
    
    // Register placeholder shaders for all required filter types
    this.registerShader('blur', dummyShader('blur'));
    this.registerShader('sharpen', dummyShader('sharpen'));
    this.registerShader('grayscale', dummyShader('grayscale'));
    this.registerShader('invert', dummyShader('invert'));
    this.registerShader('noise', dummyShader('noise'));
    this.registerShader('pixelate', dummyShader('pixelate'));
    this.registerShader('findEdges', dummyShader('findEdges'));
    this.registerShader('blend', dummyShader('blend'));
    this.registerShader('glow', dummyShader('glow'));
    this.registerShader('halftone', dummyShader('halftone'));
    this.registerShader('wave', dummyShader('wave'));
    this.registerShader('dither', dummyShader('dither'));
    this.registerShader('texture', dummyShader('texture'));
    
    // Register the Perlin noise generator
    this.registerShader('perlinNoise', createPerlinNoiseShader());
    
    // Register the Checkerboard generator
    this.registerShader('checkerboard', createCheckerboardShader());
    
    // Register the Mask blender
    this.registerShader('mask', createMaskShader());
    
    // In the real implementation, we would populate these with our actual shader implementations
    // e.g. this.registerShader('blur', blurShader());
  }
  
  /**
   * Create a fused shader from multiple filter types
   */
  public createFusedShader(
    name: string,
    filterTypes: FilterType[],
    parameters: Record<string, ShaderParameter[]>
  ): GLShader | null {
    // This is a complex implementation that would:
    // 1. Analyze each filter shader
    // 2. Combine their source code intelligently
    // 3. Merge uniform declarations and main functions
    // 4. Return a new shader that applies all effects in one pass
    
    // TODO: Implement shader fusion logic
    console.warn('Shader fusion not yet implemented');
    return null;
  }
  
  /**
   * Create shader to apply a specific blend mode
   */
  public createBlendModeShader(blendMode: string): GLShader {
    const fragmentMain = this.getBlendModeShaderCode(blendMode);
    
    return GLShaderFactory.createMultiTextureShader(
      `blend_${blendMode}`,
      `Applies ${blendMode} blend mode`,
      [
        {
          name: 'opacity',
          type: 'float',
          defaultValue: 1.0,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          description: 'Blend opacity'
        }
      ],
      `uniform sampler2D u_overlayTexture;
uniform float u_opacity;`,
      fragmentMain
    );
  }
  
  /**
   * Get GLSL code for a specific blend mode
   */
  private getBlendModeShaderCode(blendMode: string): string {
    switch (blendMode) {
      case 'normal':
        return `
  // Sample overlay texture
  vec4 overlay = texture(u_overlayTexture, v_texCoord);
  
  // Normal blend mode
  color = mix(color, overlay, overlay.a * u_opacity);
`;
      
      case 'multiply':
        return `
  // Sample overlay texture
  vec4 overlay = texture(u_overlayTexture, v_texCoord);
  
  // Multiply blend mode
  vec4 blended = color * overlay;
  color = mix(color, blended, overlay.a * u_opacity);
`;
      
      case 'screen':
        return `
  // Sample overlay texture
  vec4 overlay = texture(u_overlayTexture, v_texCoord);
  
  // Screen blend mode
  vec4 blended = vec4(1.0) - (vec4(1.0) - color) * (vec4(1.0) - overlay);
  color = mix(color, blended, overlay.a * u_opacity);
`;
      
      case 'overlay':
        return `
  // Sample overlay texture
  vec4 overlay = texture(u_overlayTexture, v_texCoord);
  
  // Overlay blend mode
  vec4 blended;
  
  // Apply overlay formula for each channel
  for (int i = 0; i < 3; i++) {
    if (color[i] < 0.5) {
      blended[i] = 2.0 * color[i] * overlay[i];
    } else {
      blended[i] = 1.0 - 2.0 * (1.0 - color[i]) * (1.0 - overlay[i]);
    }
  }
  
  // Keep original alpha
  blended.a = color.a;
  
  // Apply opacity and overlay alpha
  color = mix(color, blended, overlay.a * u_opacity);
`;
      
      // Add more blend modes as needed
      
      default:
        return `
  // Sample overlay texture
  vec4 overlay = texture(u_overlayTexture, v_texCoord);
  
  // Default to normal blend
  color = mix(color, overlay, overlay.a * u_opacity);
`;
    }
  }
}