/**
 * ShaderLibrary - Central registry of all GLSL shader implementations.
 * Maps shader IDs (from NodeDefinition.shaderId) to ShaderDefinitions.
 */

import { ShaderDefinition, parametersToUniforms } from '../ShaderDefinition';

// Import all shader definitions
import { passthroughShader, solidColorShader, resultShader, numericOutputShader, resultPBRShader } from './special/utility';
import { perlinNoiseShader } from './noise/perlin';
import { cellsNoiseShader, blocksNoiseShader, pyramidsNoiseShader } from './noise/cells';
import { blendShader, multiblendShader } from './processing/blend';
import { maskShader } from './processing/mask';
import { halftoneShader } from './processing/halftone';
import { ditherShader } from './processing/dither';
import { blurShader, sharpenShader, edgeDetectorShader, highPassShader, motionBlurShader } from './processing/filters';
import { noiseDistortionShader, refractionShader, medianShader, maximumShader, minimumShader } from './processing/advanced';
import { brightnessContrastShader, levelsShader, hueSaturationShader, invertShader, gammaShader, desaturateShader, thresholdShader, toneCurveShader } from './adjustment/adjustments';
import { extractRGBShader, assembleRGBShader, extractHSBShader, assembleHSBShader, getAlphaShader, setAlphaShader, extractHLSShader, assembleHLSShader } from './channel/channels';
import { checkerShader, bricksShader, tilesShader, ellipseShader, polygonShader, rectangleShader } from './pattern/patterns';
import { threeColorGradientShader, fiveColorGradientShader, profileGradientShader, freeGradientShader, elevationGradientShader, spectrumShader } from './gradient/gradients';
import { flipShader, rotateShader, scaleShader, offsetShader, perspectiveShader, lookupShader } from './transform/transforms';
import {
  addShader, subtractShader, multiplyShader, divideShader, negateShader, absShader, minShader, maxShader, lerpShader, remapRangeShader,
  powerShader, moduloShader, ifShader, floorShader, ceilShader, roundShader,
  sineShader, cosineShader, tangentShader, arcsineShader, arccosineShader, arctangentShader,
} from './math/math';
import { curveGeneratorShader, levelsCurveShader } from './curve/curves';

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
  passthroughShader, solidColorShader, resultShader, numericOutputShader, resultPBRShader,
  // Noise
  perlinNoiseShader, cellsNoiseShader, blocksNoiseShader, pyramidsNoiseShader,
  // Processing
  blendShader, multiblendShader, maskShader, halftoneShader, ditherShader,
  blurShader, sharpenShader, edgeDetectorShader, highPassShader, motionBlurShader,
  noiseDistortionShader, refractionShader, medianShader, maximumShader, minimumShader,
  // Adjustments
  brightnessContrastShader, levelsShader, hueSaturationShader, invertShader,
  gammaShader, desaturateShader, thresholdShader, toneCurveShader,
  // Channels
  extractRGBShader, assembleRGBShader, extractHSBShader, assembleHSBShader,
  extractHLSShader, assembleHLSShader, getAlphaShader, setAlphaShader,
  // Patterns
  checkerShader, bricksShader, tilesShader, ellipseShader, polygonShader, rectangleShader,
  // Gradients
  threeColorGradientShader, fiveColorGradientShader, profileGradientShader,
  freeGradientShader, elevationGradientShader, spectrumShader,
  // Transforms
  flipShader, rotateShader, scaleShader, offsetShader, perspectiveShader, lookupShader,
  // Math
  addShader, subtractShader, multiplyShader, divideShader, moduloShader,
  negateShader, absShader, powerShader, minShader, maxShader,
  lerpShader, ifShader, remapRangeShader,
  floorShader, ceilShader, roundShader,
  sineShader, cosineShader, tangentShader, arcsineShader, arccosineShader, arctangentShader,
  // Curve generators
  curveGeneratorShader, levelsCurveShader,
]);
