import { DataType, NodeDefinition } from '@/types';

export const brightnessContrastNode: NodeDefinition = {
  id: 'brightness-contrast',
  name: 'Brightness/Contrast',
  category: 'adjustment',
  description: 'Adjusts brightness and contrast of the image.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'brightness', label: 'Brightness', type: 'float', defaultValue: 0, min: -100, max: 100, step: 1, mappable: true },
    { id: 'contrast', label: 'Contrast', type: 'float', defaultValue: 0, min: -100, max: 100, step: 1, mappable: true },
    { id: 'preserveColor', label: 'Preserve Color', type: 'bool', defaultValue: false },
  ],
  shaderId: 'brightness-contrast',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Sun',
  tags: ['brightness', 'contrast', 'adjust', 'exposure'],
};

export const levelsNode: NodeDefinition = {
  id: 'levels',
  name: 'Levels',
  category: 'adjustment',
  description: 'Redistributes tonal range between black and white points with gamma correction.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'blackPoint', label: 'Black Point', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'whitePoint', label: 'White Point', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'gamma', label: 'Gamma', type: 'float', defaultValue: 0, min: -100, max: 100, step: 1, mappable: true },
    { id: 'preserveColor', label: 'Preserve Color', type: 'bool', defaultValue: false },
  ],
  shaderId: 'levels',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'BarChart3',
  tags: ['levels', 'tonal', 'range', 'histogram'],
};

export const hueSaturationNode: NodeDefinition = {
  id: 'hue-saturation',
  name: 'Hue/Saturation',
  category: 'adjustment',
  description: 'Adjusts hue, saturation, and lightness.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'hue', label: 'Hue', type: 'float', defaultValue: 0, min: -180, max: 180, step: 1, unit: '°', mappable: true },
    { id: 'saturation', label: 'Saturation', type: 'float', defaultValue: 0, min: -100, max: 100, step: 1, mappable: true },
    { id: 'lightness', label: 'Lightness', type: 'float', defaultValue: 0, min: -100, max: 100, step: 1, mappable: true },
  ],
  shaderId: 'hue-saturation',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Palette',
  tags: ['hue', 'saturation', 'lightness', 'color'],
};

export const invertNode: NodeDefinition = {
  id: 'invert',
  name: 'Invert',
  category: 'adjustment',
  description: 'Inverts all color channels. Alpha is unaffected.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'invert', label: 'Invert', type: 'bool', defaultValue: true },
  ],
  shaderId: 'invert',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'CircleOff',
  tags: ['invert', 'negate', 'reverse'],
};

export const gammaNode: NodeDefinition = {
  id: 'gamma',
  name: 'Gamma',
  category: 'adjustment',
  description: 'Applies gamma correction. Primarily affects midtones.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'gamma', label: 'Gamma', type: 'float', defaultValue: 0, min: -100, max: 100, step: 1, mappable: true },
  ],
  shaderId: 'gamma',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Contrast',
  tags: ['gamma', 'midtones', 'correction'],
};

export const desaturateNode: NodeDefinition = {
  id: 'desaturate',
  name: 'Desaturate',
  category: 'adjustment',
  description: 'Converts to grayscale using weighted average, simple average, or lightness methods.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'method', label: 'Method', type: 'option', defaultValue: 0, options: [
      { label: 'Weighted Average (HSY)', value: 0 },
      { label: 'Average', value: 1 },
      { label: 'Lightness (HSB)', value: 2 },
    ]},
  ],
  shaderId: 'desaturate',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Droplets',
  tags: ['desaturate', 'grayscale', 'gray', 'mono'],
};

export const thresholdNode: NodeDefinition = {
  id: 'threshold',
  name: 'Threshold',
  category: 'adjustment',
  description: 'Creates a two-color image based on pixel lightness threshold.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
    { id: 'low', label: 'Low Color', dataType: DataType.Map, required: false, hdr: true },
    { id: 'high', label: 'High Color', dataType: DataType.Map, required: false, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'threshold', label: 'Threshold', type: 'float', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'smooth', label: 'Smooth', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'lowColor', label: 'Low Color', type: 'color', defaultValue: '#000000' },
    { id: 'highColor', label: 'High Color', type: 'color', defaultValue: '#ffffff' },
  ],
  shaderId: 'threshold',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Split',
  tags: ['threshold', 'binary', 'two-tone', 'posterize'],
};

export const toneCurveNode: NodeDefinition = {
  id: 'tone-curve',
  name: 'Tone Curve',
  category: 'adjustment',
  description: 'Applies an arbitrary tone curve to the image.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
    { id: 'curve', label: 'Curve', dataType: DataType.Curve, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'preserveColor', label: 'Preserve Color', type: 'bool', defaultValue: false },
  ],
  shaderId: 'tone-curve',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Spline',
  tags: ['curve', 'tone', 'custom'],
};
