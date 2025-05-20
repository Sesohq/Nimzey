/**
 * ShaderRegistry.ts
 * 
 * Registry of WebGL shaders for the filter engine.
 * Manages a collection of shaders and provides factory methods
 * for creating new shaders for different filter types.
 */

import { FilterType } from '@/types';
import { GLShader, GLShaderFactory, ShaderParameter } from '../core/GLShader';
import { blurShader } from '../shaders/blurShader';
import { sharpenShader } from '../shaders/sharpenShader';
import { grayscaleShader } from '../shaders/grayscaleShader';
import { invertShader } from '../shaders/invertShader';
import { noiseShader } from '../shaders/noiseShader';
import { pixelateShader } from '../shaders/pixelateShader';
import { edgeDetectionShader } from '../shaders/edgeDetectionShader';
import { blendShader } from '../shaders/blendShader';
import { glowShader } from '../shaders/glowShader';
import { halftoneShader } from '../shaders/halftoneShader';
import { passthroughShader } from '../shaders/passthroughShader';
import { waveShader } from '../shaders/waveShader';
import { ditherShader } from '../shaders/ditherShader';
import { textureShader } from '../shaders/textureShader';

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
    // Register basic shaders
    this.registerShader('passthrough', passthroughShader());
    this.registerShader('blur', blurShader());
    this.registerShader('sharpen', sharpenShader());
    this.registerShader('grayscale', grayscaleShader());
    this.registerShader('invert', invertShader());
    this.registerShader('noise', noiseShader());
    this.registerShader('pixelate', pixelateShader());
    this.registerShader('findEdges', edgeDetectionShader());
    this.registerShader('blend', blendShader());
    this.registerShader('glow', glowShader());
    this.registerShader('halftone', halftoneShader());
    this.registerShader('wave', waveShader());
    this.registerShader('dither', ditherShader());
    this.registerShader('texture', textureShader());
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