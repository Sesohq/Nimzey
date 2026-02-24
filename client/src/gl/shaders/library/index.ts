/**
 * ShaderLibrary - Central registry of all GLSL shader implementations.
 * Maps shader IDs (from NodeDefinition.shaderId) to ShaderDefinitions.
 */

import { ShaderDefinition, parametersToUniforms } from '../ShaderDefinition';

// Import all shader definitions
import { passthroughShader, solidColorShader, resultShader } from './special/utility';
import { perlinNoiseShader } from './noise/perlin';
import { cellsNoiseShader, blocksNoiseShader, pyramidsNoiseShader } from './noise/cells';
import { blendShader } from './processing/blend';
import { blurShader, sharpenShader, edgeDetectorShader, highPassShader, motionBlurShader } from './processing/filters';
import { noiseDistortionShader, refractionShader, medianShader, maximumShader, minimumShader } from './processing/advanced';
import { brightnessContrastShader, levelsShader, hueSaturationShader, invertShader, gammaShader, desaturateShader, thresholdShader } from './adjustment/adjustments';
import { extractRGBShader, assembleRGBShader, extractHSBShader, assembleHSBShader, getAlphaShader, setAlphaShader } from './channel/channels';
import { checkerShader, bricksShader, tilesShader, ellipseShader, polygonShader, rectangleShader } from './pattern/patterns';
import { threeColorGradientShader, fiveColorGradientShader, profileGradientShader, freeGradientShader, spectrumShader } from './gradient/gradients';
import { flipShader, rotateShader, scaleShader, offsetShader, lookupShader } from './transform/transforms';
import { addShader, subtractShader, multiplyShader, divideShader, negateShader, absShader, minShader, maxShader, lerpShader, remapRangeShader } from './math/math';

class ShaderLibraryImpl {
  private shaders = new Map<string, ShaderDefinition>();

  register(shader: ShaderDefinition): void {
    this.shaders.set(shader.id, shader);
  }

  registerAll(shaders: ShaderDefinition[]): void {
    for (const s of shaders) {
      this.shaders.set(s.id, s);
    }
  }

  get(id: string): ShaderDefinition | undefined {
    return this.shaders.get(id);
  }

  getAll(): ShaderDefinition[] {
    return Array.from(this.shaders.values());
  }
}

export const ShaderLibrary = new ShaderLibraryImpl();

// Register all shaders
ShaderLibrary.registerAll([
  // Special / Utility
  passthroughShader, solidColorShader, resultShader,
  // Noise
  perlinNoiseShader, cellsNoiseShader, blocksNoiseShader, pyramidsNoiseShader,
  // Processing
  blendShader, blurShader, sharpenShader, edgeDetectorShader, highPassShader, motionBlurShader,
  noiseDistortionShader, refractionShader, medianShader, maximumShader, minimumShader,
  // Adjustments
  brightnessContrastShader, levelsShader, hueSaturationShader, invertShader, gammaShader, desaturateShader, thresholdShader,
  // Channels
  extractRGBShader, assembleRGBShader, extractHSBShader, assembleHSBShader, getAlphaShader, setAlphaShader,
  // Patterns
  checkerShader, bricksShader, tilesShader, ellipseShader, polygonShader, rectangleShader,
  // Gradients
  threeColorGradientShader, fiveColorGradientShader, profileGradientShader, freeGradientShader, spectrumShader,
  // Transforms
  flipShader, rotateShader, scaleShader, offsetShader, lookupShader,
  // Math
  addShader, subtractShader, multiplyShader, divideShader, negateShader, absShader, minShader, maxShader, lerpShader, remapRangeShader,
]);
