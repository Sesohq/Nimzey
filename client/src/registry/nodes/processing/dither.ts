import { DataType, NodeDefinition } from '@/types';

export const ditherNode: NodeDefinition = {
  id: 'dither',
  name: 'Dither',
  category: 'effect',
  description: 'Ordered dithering with visible dot/pixel patterns. Use Scale to control cell size for a dramatic retro effect.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'algorithm', label: 'Pattern', type: 'option', defaultValue: 0, options: [
      { label: 'Bayer 8x8', value: 0 },
      { label: 'Bayer 4x4', value: 1 },
      { label: 'Bayer 2x2', value: 2 },
      { label: 'Clustered Dot', value: 3 },
      { label: 'Line Screen', value: 4 },
      { label: 'Noise', value: 5 },
      { label: 'Halftone Dot', value: 6 },
    ]},
    { id: 'scale', label: 'Cell Size', type: 'float', defaultValue: 4.0, min: 1.0, max: 32.0, step: 1.0 },
    { id: 'levels', label: 'Color Levels', type: 'int', defaultValue: 2, min: 2, max: 16 },
    { id: 'intensity', label: 'Intensity', type: 'float', defaultValue: 100, min: 0, max: 200, step: 1, unit: '%' },
    { id: 'colorMode', label: 'Color Mode', type: 'option', defaultValue: 0, options: [
      { label: 'Mono', value: 0 },
      { label: 'Per Channel RGB', value: 1 },
      { label: 'Preserve Hue', value: 2 },
    ]},
    { id: 'invert', label: 'Invert', type: 'bool', defaultValue: false },
  ],
  shaderId: 'dither',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Grid3X3',
  tags: ['dither', 'pixel', 'retro', 'bayer', 'halftone', 'noise', 'quantize', '1-bit', 'dither tone'],
};
