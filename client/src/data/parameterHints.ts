/**
 * Plain-language hints for node parameters.
 * Key format: "definitionId.paramId"
 * These show as tooltips next to parameter labels.
 */

export const parameterHints: Record<string, string> = {
  // Perlin Noise
  'perlin-noise.scale': 'How zoomed in the pattern is. Small = fine detail, large = big blobs',
  'perlin-noise.octaves': 'Layers of detail. More = more complex',
  'perlin-noise.persistence': 'How much each detail layer matters',
  'perlin-noise.lacunarity': 'Spacing between detail layers',
  'perlin-noise.stretch': 'Stretches the noise in one direction',
  'perlin-noise.angle': 'Rotates the stretch direction',
  'perlin-noise.color': 'Color of the noise pattern',
  'perlin-noise.seed': 'Change this to get a different random pattern',

  // Cells Noise
  'cells-noise.scale': 'Size of the cells. Higher = smaller cells',
  'cells-noise.jitter': 'How irregular the cell shapes are',
  'cells-noise.mode': 'Different ways to visualize the cells',
  'cells-noise.seed': 'Change this to get a different random pattern',

  // Blocks Noise
  'blocks-noise.scale': 'Size of the blocks',
  'blocks-noise.seed': 'Change this to get a different random pattern',

  // Pyramids Noise
  'pyramids-noise.scale': 'Size of the crystal patterns',
  'pyramids-noise.seed': 'Change this to get a different random pattern',

  // Blur
  'blur.radius': 'How soft the blur is. Higher = more blurry',
  'blur.quality': 'Higher quality = smoother blur, but slower',

  // Motion Blur
  'motion-blur.radius': 'How far the motion blur stretches',
  'motion-blur.angle': 'Direction of the motion blur',

  // Sharpen
  'sharpen.amount': 'How much to sharpen. Too much creates halos',
  'sharpen.radius': 'Size of the sharpening effect',

  // Blend
  'blend.mode': 'How the two images combine. Try Overlay for a natural mix',
  'blend.opacity': 'How much of the blend to apply. 0% = none, 100% = full',

  // Multiblend
  'multiblend.opacity1': 'How visible Layer 1 is',
  'multiblend.opacity2': 'How visible Layer 2 is',
  'multiblend.opacity3': 'How visible Layer 3 is',
  'multiblend.opacity4': 'How visible Layer 4 is',
  'multiblend.opacity5': 'How visible Layer 5 is',
  'multiblend.opacity6': 'How visible Layer 6 is',
  'multiblend.opacity7': 'How visible Layer 7 is',

  // Brightness/Contrast
  'brightness-contrast.brightness': 'Slide right to brighten, left to darken',
  'brightness-contrast.contrast': 'Higher contrast = more difference between light and dark',

  // Levels
  'levels.inBlack': 'Darkest point. Anything darker becomes black',
  'levels.inWhite': 'Brightest point. Anything brighter becomes white',
  'levels.gamma': 'Adjusts the middle tones between light and dark',
  'levels.outBlack': 'How dark the darkest parts can be',
  'levels.outWhite': 'How bright the brightest parts can be',

  // Hue/Saturation
  'hue-saturation.hue': 'Rotates all colors around the color wheel',
  'hue-saturation.saturation': 'How vivid the colors are. 0 = gray',
  'hue-saturation.lightness': 'Overall brightness of the image',

  // Gamma
  'gamma.gamma': 'Adjusts middle tones. <1 = darker midtones, >1 = brighter',

  // Desaturate
  'desaturate.amount': 'How much color to remove. 100% = fully black & white',

  // Threshold
  'threshold.threshold': 'The cutoff point. Below = black, above = white',

  // Invert
  'invert.amount': 'How much to invert. 100% = fully inverted',

  // Edge Detector
  'edge-detector.strength': 'How sensitive the edge detection is',

  // High Pass
  'high-pass.radius': 'Size of details to keep. Small = very fine details only',

  // Noise Distortion
  'noise-distortion.amount': 'How much the image gets warped',
  'noise-distortion.scale': 'Size of the warp pattern',

  // Refraction
  'refraction.amount': 'How much the glass effect bends the image',

  // Transforms
  'flip.horizontal': 'Mirror the image left to right',
  'flip.vertical': 'Mirror the image top to bottom',
  'rotate.angle': 'How far to spin the image',
  'scale.scaleX': 'Horizontal size. 1.0 = normal, 2.0 = double',
  'scale.scaleY': 'Vertical size. 1.0 = normal, 2.0 = double',
  'offset.offsetX': 'Slide the image left or right',
  'offset.offsetY': 'Slide the image up or down',

  // Patterns
  'checker.scale': 'Size of the squares',
  'checker.color1': 'First square color',
  'checker.color2': 'Second square color',
  'bricks.scaleX': 'Width of the bricks',
  'bricks.scaleY': 'Height of the bricks',
  'bricks.mortarWidth': 'Gap between bricks',
  'bricks.mortarColor': 'Color of the gap between bricks',
  'tiles.scale': 'Size of the tiles',
  'ellipse.radiusX': 'Width of the circle/oval',
  'ellipse.radiusY': 'Height of the circle/oval',
  'polygon.sides': 'Number of sides (3 = triangle, 6 = hexagon)',
  'polygon.radius': 'Size of the shape',
  'rectangle.width': 'Width of the rectangle',
  'rectangle.height': 'Height of the rectangle',

  // Gradients
  'gradient-3-color.color1': 'Start color',
  'gradient-3-color.color2': 'Middle color',
  'gradient-3-color.color3': 'End color',
  'gradient-5-color.color1': 'First color',
  'gradient-5-color.color2': 'Second color',
  'gradient-5-color.color3': 'Third color',
  'gradient-5-color.color4': 'Fourth color',
  'gradient-5-color.color5': 'Fifth color',

  // Math
  'math-lerp.amount': 'How much to mix. 0% = first input, 100% = second input',
  'math-if.threshold': 'Values above this use the first input, below use the second',
  'math-remap-range.inMin': 'Start of the input range',
  'math-remap-range.inMax': 'End of the input range',
  'math-remap-range.outMin': 'Start of the output range',
  'math-remap-range.outMax': 'End of the output range',
  'math-power.exponent': 'The power to raise values to. 2 = square, 0.5 = square root',
  'math-modulo.divisor': 'Values wrap around at this point',

  // Mask
  'mask.channel': 'Which part of the mask image to use as the cutout shape',
  'mask.invert': 'Flip the mask so black becomes visible and white becomes hidden',
  'mask.softness': 'How soft the edges of the cutout are. Higher = more feathered',
  'mask.threshold': 'Where to cut. Adjusts which grays count as "in" or "out"',
  'mask.range_low': 'Darkest mask value to treat as fully hidden',
  'mask.range_high': 'Lightest mask value to treat as fully visible',

  // Halftone
  'halftone.algorithm': 'The type of dot/pattern used for the halftone effect',
  'halftone.scale': 'Size of the dots or pattern cells. Bigger = chunkier look',
  'halftone.angle': 'Rotation of the dot grid. Try 45° for a classic print look',
  'halftone.softness': 'How smooth the dot edges are. 0 = sharp pixels, higher = anti-aliased',
  'halftone.invert': 'Swap black and white in the output',
  'halftone.colorMode': 'Mono = B&W, Preserve = keep colors, CMYK = print-style color separation',
  'halftone.dotGain': 'Simulates ink spreading on paper. Makes dots bigger and darker',
  'halftone.crosshatchLevels': 'How many layers of lines for the crosshatch style',

  // Dither
  'dither.algorithm': 'Dither pattern: Bayer for classic ordered, Clustered Dot for round clusters, Line Screen for stripes, Halftone Dot for circular dots',
  'dither.scale': 'Size of each dither cell in pixels. Crank this up for a chunky retro look. 1 = pixel-level, 8+ = clearly visible pattern',
  'dither.levels': 'How many brightness steps. 2 = pure black & white, 4 = retro console, 8+ = smoother',
  'dither.intensity': 'Strength of the dither pattern. 100% = full effect. Higher values push contrast harder',
  'dither.colorMode': 'Mono = B&W, Per Channel = dither R/G/B separately for color retro, Preserve Hue = keep original hue',
  'dither.invert': 'Swap black and white in the output',
};

/**
 * Get the hint for a parameter, or undefined if none exists.
 */
export function getParameterHint(definitionId: string, paramId: string): string | undefined {
  return parameterHints[`${definitionId}.${paramId}`];
}
