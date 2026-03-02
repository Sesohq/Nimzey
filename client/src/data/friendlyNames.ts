/**
 * Friendly names and descriptions for all nodes.
 * Maps definitionId -> { name, description } in plain English.
 * Original technical names remain accessible as fallback.
 */

export interface FriendlyInfo {
  name: string;
  description: string;
}

export const friendlyNames: Record<string, FriendlyInfo> = {
  // Noise generators
  'perlin-noise': { name: 'Smooth Noise', description: 'Generates soft, cloudy patterns' },
  'cells-noise': { name: 'Cell Pattern', description: 'Creates organic cell-like shapes' },
  'blocks-noise': { name: 'Blocky Noise', description: 'Generates sharp, pixelated blocks' },
  'pyramids-noise': { name: 'Crystal Noise', description: 'Creates angular, gem-like patterns' },

  // Gradients
  'gradient-3-color': { name: 'Three Color Blend', description: 'Smooth blend between three colors' },
  'gradient-5-color': { name: 'Five Color Blend', description: 'Smooth blend between five colors' },
  'gradient-profile': { name: 'Profile Gradient', description: 'Gradient following a curve profile' },
  'gradient-free': { name: 'Free Gradient', description: 'Fully customizable gradient' },
  'gradient-elevation': { name: 'Height Gradient', description: 'Gradient based on height values' },
  'spectrum': { name: 'Rainbow', description: 'Full color spectrum gradient' },

  // Patterns
  'checker': { name: 'Checkerboard', description: 'Classic checkerboard pattern' },
  'bricks': { name: 'Brick Wall', description: 'Generates a brick pattern' },
  'tiles': { name: 'Tile Grid', description: 'Creates a tiled pattern' },
  'ellipse': { name: 'Circle / Oval', description: 'Draws circles and ovals' },
  'polygon': { name: 'Shape', description: 'Draws triangles, hexagons, stars, etc.' },
  'rectangle': { name: 'Rectangle', description: 'Draws rectangles and squares' },

  // Processing
  'blend': { name: 'Blend', description: 'Combines two images together' },
  'multiblend': { name: 'Layer Stack', description: 'Stacks up to 7 layers with opacity' },
  'blur': { name: 'Soften', description: 'Makes the image soft and smooth' },
  'motion-blur': { name: 'Directional Blur', description: 'Blurs in one direction like motion' },
  'sharpen': { name: 'Sharpen', description: 'Makes details crisper' },
  'edge-detector': { name: 'Find Edges', description: 'Highlights outlines and edges' },
  'high-pass': { name: 'Detail Extract', description: 'Isolates fine details' },
  'noise-distortion': { name: 'Warp', description: 'Bends the image with noise' },
  'refraction': { name: 'Glass Effect', description: 'Distorts like looking through glass' },
  'median': { name: 'Smooth (Keep Edges)', description: 'Smooths while keeping edges sharp' },
  'maximum': { name: 'Grow Bright', description: 'Expands bright areas' },
  'minimum': { name: 'Grow Dark', description: 'Expands dark areas' },
  'mask': { name: 'Mask', description: 'Uses a grayscale image to cut out areas' },
  'halftone': { name: 'Halftone', description: 'Creates newspaper-style dot patterns' },
  'dither': { name: 'Dither', description: 'Reduces colors with artistic pixel patterns' },
  'pixelate': { name: 'Pixelate', description: 'Creates a blocky, retro mosaic effect' },
  'extrude': { name: 'Extrude', description: 'Gives a 3D pop-out effect with depth shadows' },

  // Adjustments
  'brightness-contrast': { name: 'Bright & Dark', description: 'Makes image lighter or darker' },
  'levels': { name: 'Light Levels', description: 'Fine-tune shadows and highlights' },
  'hue-saturation': { name: 'Color Shift', description: 'Changes colors and vividness' },
  'invert': { name: 'Invert', description: 'Swaps light and dark' },
  'gamma': { name: 'Midtones', description: 'Adjusts middle brightness' },
  'desaturate': { name: 'Remove Color', description: 'Turns image black & white' },
  'threshold': { name: 'Black & White Cut', description: 'Splits into pure black and white' },
  'tone-curve': { name: 'Custom Curve', description: 'Draw your own brightness curve' },

  // Channels
  'extract-rgb': { name: 'Split Red/Green/Blue', description: 'Separates color channels' },
  'assemble-rgb': { name: 'Combine Red/Green/Blue', description: 'Merges channels back together' },
  'extract-hsb': { name: 'Split Hue/Sat/Bright', description: 'Separates hue, saturation, brightness' },
  'assemble-hsb': { name: 'Combine Hue/Sat/Bright', description: 'Merges HSB channels' },
  'extract-hls': { name: 'Split Hue/Light/Sat', description: 'Separates HLS channels' },
  'assemble-hls': { name: 'Combine Hue/Light/Sat', description: 'Merges HLS channels' },
  'get-alpha': { name: 'Get Transparency', description: 'Extracts the see-through layer' },
  'set-alpha': { name: 'Set Transparency', description: 'Controls what\'s see-through' },

  // Math (all prefixed with math-)
  'math-add': { name: 'Add (Brighten)', description: 'Adds pixel values together' },
  'math-subtract': { name: 'Subtract (Darken)', description: 'Subtracts pixel values' },
  'math-multiply': { name: 'Multiply (Tint)', description: 'Multiplies colors together' },
  'math-divide': { name: 'Divide (Lighten)', description: 'Divides pixel values' },
  'math-modulo': { name: 'Wrap Around', description: 'Wraps values at a threshold' },
  'math-negate': { name: 'Flip Values', description: 'Inverts light/dark values' },
  'math-abs': { name: 'Make Positive', description: 'Forces all values positive' },
  'math-power': { name: 'Contrast Curve', description: 'Raises values to a power' },
  'math-min': { name: 'Minimum Of', description: 'Takes the darker of two inputs' },
  'math-max': { name: 'Maximum Of', description: 'Takes the brighter of two inputs' },
  'math-lerp': { name: 'Mix Between', description: 'Blends smoothly between two inputs' },
  'math-if': { name: 'Choose If', description: 'Picks input based on a condition' },
  'math-remap-range': { name: 'Rescale Values', description: 'Maps values from one range to another' },
  'math-floor': { name: 'Round Down', description: 'Rounds values down' },
  'math-ceil': { name: 'Round Up', description: 'Rounds values up' },
  'math-round': { name: 'Round Off', description: 'Rounds to nearest whole' },
  'math-sine': { name: 'Sine Wave', description: 'Generates smooth wave patterns' },
  'math-cosine': { name: 'Cosine Wave', description: 'Generates offset wave patterns' },
  'math-tangent': { name: 'Tangent', description: 'Generates sharp wave patterns' },
  'math-arcsine': { name: 'Arc Sine', description: 'Inverse sine curve' },
  'math-arccosine': { name: 'Arc Cosine', description: 'Inverse cosine curve' },
  'math-arctangent': { name: 'Arc Tangent', description: 'Inverse tangent curve' },

  // Curve generators
  'curve-generator': { name: 'Curve Presets', description: 'Generate preset curve shapes for tone mapping' },
  'levels-curve': { name: 'Levels Curve', description: 'Remap input range to output range with gamma' },

  // Transforms
  'flip': { name: 'Mirror', description: 'Flips the image horizontally or vertically' },
  'rotate': { name: 'Spin', description: 'Rotates the image' },
  'scale': { name: 'Resize', description: 'Scales the image up or down' },
  'offset': { name: 'Slide', description: 'Shifts the image position' },
  'perspective': { name: '3D Tilt', description: 'Adds perspective distortion' },
  'lookup': { name: 'Color Map', description: 'Remaps colors using a lookup table' },

  // External
  'image': { name: 'Photo', description: 'Upload your own image' },
  'color-control': { name: 'Color Picker', description: 'Pick a color value' },
  'slider-control': { name: 'Value Slider', description: 'Adjustable number input' },
  'checkbox-control': { name: 'Toggle Switch', description: 'On/off control' },
  'angle-control': { name: 'Angle Dial', description: 'Pick a rotation angle' },

  // Special
  'result': { name: 'Output', description: 'Final image output' },
  'result-pbr': { name: 'PBR Output', description: 'Material output for 3D' },
};

/**
 * Get the friendly name for a node, falling back to the definition name.
 */
export function getFriendlyName(definitionId: string, fallback: string): string {
  return friendlyNames[definitionId]?.name ?? fallback;
}

/**
 * Get the friendly description for a node, falling back to the definition description.
 */
export function getFriendlyDescription(definitionId: string, fallback: string): string {
  return friendlyNames[definitionId]?.description ?? fallback;
}
