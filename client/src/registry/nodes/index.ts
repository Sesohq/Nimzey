import { NodeRegistry, getEffectiveInputs } from '../NodeRegistry';

// Generators — Noise
import { perlinNoiseNode } from './noise/perlin';
import { cellsNoiseNode, blocksNoiseNode, pyramidsNoiseNode } from './noise/cells';

// Generators — Gradients
import {
  threeColorGradientNode, fiveColorGradientNode, profileGradientNode,
  freeGradientNode, elevationGradientNode, spectrumNode,
} from './gradient/gradients';

// Generators — Patterns
import {
  checkerNode, bricksNode, tilesNode, ellipseNode, polygonNode, rectangleNode,
} from './pattern/patterns';

// Blenders
import { blendNode, multiblendNode } from './processing/blend';
import { maskNode } from './processing/mask';

// Filters
import {
  blurNode, motionBlurNode, sharpenNode, edgeDetectorNode,
  highPassNode, medianNode, maximumNode, minimumNode,
} from './processing/blur';

// Effects
import { noiseDistortionNode, refractionNode } from './processing/blur';
import { halftoneNode } from './processing/halftone';
import { ditherNode } from './processing/dither';
import { pixelateNode, extrudeNode } from './processing/effects';

// Adjustments
import {
  brightnessContrastNode, levelsNode, hueSaturationNode, invertNode,
  gammaNode, desaturateNode, thresholdNode, toneCurveNode,
} from './adjustment/brightness-contrast';

// Channels
import {
  extractRGBNode, assembleRGBNode, extractHSBNode, assembleHSBNode,
  extractHLSNode, assembleHLSNode, getAlphaNode, setAlphaNode,
} from './channel/extract-assemble';

// Transforms
import {
  flipNode, rotateNode, scaleNode, offsetNode, perspectiveNode, lookupNode,
} from './transform/transforms';

// Math
import {
  addNode, subtractNode, multiplyNode, divideNode, moduloNode,
  negateNode, absNode, powerNode, minNode, maxNode,
  lerpNode, ifNode, remapRangeNode,
  floorNode, ceilNode, roundNode,
  sineNode, cosineNode, tangentNode, arcsineNode, arccosineNode, arctangentNode,
} from './math/rgb-math';

// Utility (sources + controls)
import {
  imageNode, colorControlNode, sliderControlNode, checkboxControlNode, angleControlNode,
} from './external/external';

// Curves
import { curveGeneratorNode, levelsCurveNode } from './curve/curves';

// Special (output nodes)
import { resultNode, resultPBRNode } from './special/result';

// Register all nodes
const allNodes = [
  // Generators — Noise
  perlinNoiseNode, cellsNoiseNode, blocksNoiseNode, pyramidsNoiseNode,

  // Generators — Gradients
  threeColorGradientNode, fiveColorGradientNode, profileGradientNode,
  freeGradientNode, elevationGradientNode, spectrumNode,

  // Generators — Patterns
  checkerNode, bricksNode, tilesNode, ellipseNode, polygonNode, rectangleNode,

  // Blenders
  blendNode, multiblendNode, maskNode,

  // Filters
  blurNode, motionBlurNode, sharpenNode, edgeDetectorNode,
  highPassNode, medianNode, maximumNode, minimumNode,

  // Effects
  noiseDistortionNode, refractionNode, halftoneNode, ditherNode,
  pixelateNode, extrudeNode,

  // Adjustments
  brightnessContrastNode, levelsNode, hueSaturationNode, invertNode,
  gammaNode, desaturateNode, thresholdNode, toneCurveNode,

  // Channels
  extractRGBNode, assembleRGBNode, extractHSBNode, assembleHSBNode,
  extractHLSNode, assembleHLSNode, getAlphaNode, setAlphaNode,

  // Transforms
  flipNode, rotateNode, scaleNode, offsetNode, perspectiveNode, lookupNode,

  // Math
  addNode, subtractNode, multiplyNode, divideNode, moduloNode,
  negateNode, absNode, powerNode, minNode, maxNode,
  lerpNode, ifNode, remapRangeNode,
  floorNode, ceilNode, roundNode,
  sineNode, cosineNode, tangentNode, arcsineNode, arccosineNode, arctangentNode,

  // Utility
  imageNode, colorControlNode, sliderControlNode, checkboxControlNode, angleControlNode,

  // Curves
  curveGeneratorNode, levelsCurveNode,

  // Special
  resultNode, resultPBRNode,
];

NodeRegistry.registerAll(allNodes);

export { NodeRegistry, getEffectiveInputs };

// Re-export all node definitions for direct access
export {
  // Generators — Noise
  perlinNoiseNode, cellsNoiseNode, blocksNoiseNode, pyramidsNoiseNode,
  // Generators — Gradients
  threeColorGradientNode, fiveColorGradientNode, profileGradientNode,
  freeGradientNode, elevationGradientNode, spectrumNode,
  // Generators — Patterns
  checkerNode, bricksNode, tilesNode, ellipseNode, polygonNode, rectangleNode,
  // Blenders
  blendNode, multiblendNode, maskNode,
  // Filters
  blurNode, motionBlurNode, sharpenNode, edgeDetectorNode,
  highPassNode, medianNode, maximumNode, minimumNode,
  // Effects
  noiseDistortionNode, refractionNode, halftoneNode, ditherNode,
  pixelateNode, extrudeNode,
  // Adjustments
  brightnessContrastNode, levelsNode, hueSaturationNode, invertNode,
  gammaNode, desaturateNode, thresholdNode, toneCurveNode,
  // Channels
  extractRGBNode, assembleRGBNode, extractHSBNode, assembleHSBNode,
  extractHLSNode, assembleHLSNode, getAlphaNode, setAlphaNode,
  // Transforms
  flipNode, rotateNode, scaleNode, offsetNode, perspectiveNode, lookupNode,
  // Math
  addNode, subtractNode, multiplyNode, divideNode, moduloNode,
  negateNode, absNode, powerNode, minNode, maxNode,
  lerpNode, ifNode, remapRangeNode,
  floorNode, ceilNode, roundNode,
  sineNode, cosineNode, tangentNode, arcsineNode, arccosineNode, arctangentNode,
  // Utility
  imageNode, colorControlNode, sliderControlNode, checkboxControlNode, angleControlNode,
  // Curves
  curveGeneratorNode, levelsCurveNode,
  // Special
  resultNode, resultPBRNode,
};
