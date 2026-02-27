/**
 * Suggested "what to add next" connections for each node type.
 * Shows as floating pills after adding a node.
 */

export const suggestedConnections: Record<string, string[]> = {
  // Generators -> processing/adjustment
  'perlin-noise': ['blur', 'brightness-contrast', 'blend', 'refraction'],
  'cells-noise': ['blur', 'threshold', 'blend', 'edge-detector'],
  'blocks-noise': ['blur', 'brightness-contrast', 'blend'],
  'pyramids-noise': ['blur', 'sharpen', 'blend'],

  // Gradients
  'gradient-3-color': ['blend', 'brightness-contrast', 'hue-saturation'],
  'gradient-5-color': ['blend', 'brightness-contrast'],
  'spectrum': ['blend', 'hue-saturation'],

  // Patterns
  'checker': ['blur', 'blend', 'noise-distortion'],
  'bricks': ['blur', 'blend', 'edge-detector'],
  'tiles': ['blur', 'blend', 'noise-distortion'],
  'ellipse': ['blur', 'blend'],
  'polygon': ['blur', 'blend'],
  'rectangle': ['blur', 'blend'],

  // Image
  'image': ['brightness-contrast', 'hue-saturation', 'blur', 'blend'],

  // Processing
  'blur': ['sharpen', 'brightness-contrast', 'blend'],
  'sharpen': ['brightness-contrast', 'hue-saturation'],
  'edge-detector': ['invert', 'levels', 'blend'],
  'noise-distortion': ['blur', 'brightness-contrast'],
  'refraction': ['brightness-contrast', 'hue-saturation'],
  'blend': ['brightness-contrast', 'blur', 'sharpen'],
  'high-pass': ['blend', 'levels'],

  // Adjustments
  'brightness-contrast': ['hue-saturation', 'sharpen', 'blend'],
  'hue-saturation': ['brightness-contrast', 'sharpen', 'blend'],
  'levels': ['hue-saturation', 'sharpen'],
  'gamma': ['brightness-contrast', 'hue-saturation'],
  'desaturate': ['brightness-contrast', 'levels'],
  'threshold': ['blur', 'invert', 'blend'],
  'invert': ['brightness-contrast', 'blend'],
  'tone-curve': ['hue-saturation', 'sharpen'],
};
