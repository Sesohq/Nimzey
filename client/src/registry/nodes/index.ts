import { NodeRegistry } from '../NodeRegistry';

// Noise generators
import { perlinNoiseNode } from './noise/perlin';
import { cellsNoiseNode, blocksNoiseNode, pyramidsNoiseNode } from './noise/cells';

// Gradients
import {
  threeColorGradientNode, fiveColorGradientNode, profileGradientNode,
  freeGradientNode, elevationGradientNode, spectrumNode,
} from './gradient/gradients';

// Patterns
import {
  checkerNode, bricksNode, tilesNode, ellipseNode, polygonNode, rectangleNode,
} from './pattern/patterns';

// Processing
import { blendNode, multiblendNode } from './processing/blend';
import {
  blurNode, motionBlurNode, sharpenNode, edgeDetectorNode,
  highPassNode, noiseDistortionNode, refractionNode, medianNode,
  maximumNode, minimumNode,
} from './processing/blur';
import { maskNode } from './processing/mask';
import { halftoneNode } from './processing/halftone';
import { ditherNode } from './processing/dither';

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

// External & Controls
import {
  imageNode, colorControlNode, sliderControlNode, checkboxControlNode, angleControlNode,
} from './external/external';

// Special
import { resultNode, resultPBRNode } from './special/result';

// Register all nodes
const allNodes = [
  // Noise
  perlinNoiseNode, cellsNoiseNode, blocksNoiseNode, pyramidsNoiseNode,

  // Gradients
  threeColorGradientNode, fiveColorGradientNode, profileGradientNode,
  freeGradientNode, elevationGradientNode, spectrumNode,

  // Patterns
  checkerNode, bricksNode, tilesNode, ellipseNode, polygonNode, rectangleNode,

  // Processing
  blendNode, multiblendNode, blurNode, motionBlurNode, sharpenNode,
  edgeDetectorNode, highPassNode, noiseDistortionNode, refractionNode,
  medianNode, maximumNode, minimumNode, maskNode, halftoneNode, ditherNode,

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

  // External & Controls
  imageNode, colorControlNode, sliderControlNode, checkboxControlNode, angleControlNode,

  // Special
  resultNode, resultPBRNode,
];

NodeRegistry.registerAll(allNodes);

export { NodeRegistry };

// Re-export all node definitions for direct access
export {
  // Noise
  perlinNoiseNode, cellsNoiseNode, blocksNoiseNode, pyramidsNoiseNode,
  // Gradients
  threeColorGradientNode, fiveColorGradientNode, profileGradientNode,
  freeGradientNode, elevationGradientNode, spectrumNode,
  // Patterns
  checkerNode, bricksNode, tilesNode, ellipseNode, polygonNode, rectangleNode,
  // Processing
  blendNode, multiblendNode, blurNode, motionBlurNode, sharpenNode,
  edgeDetectorNode, highPassNode, noiseDistortionNode, refractionNode,
  medianNode, maximumNode, minimumNode, maskNode, halftoneNode, ditherNode,
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
  // External & Controls
  imageNode, colorControlNode, sliderControlNode, checkboxControlNode, angleControlNode,
  // Special
  resultNode, resultPBRNode,
};
