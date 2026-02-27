import { DataType, NodeDefinition } from '@/types';

export const ditherNode: NodeDefinition = {
  id: 'dither',
  name: 'Dither',
  category: 'processing',
  description: 'Reduces color depth with artistic dithering patterns.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'algorithm', label: 'Algorithm', type: 'option', defaultValue: 0, options: [
      { label: 'Bayer 2x2', value: 0 },
      { label: 'Bayer 4x4', value: 1 },
      { label: 'Bayer 8x8', value: 2 },
      { label: 'Blue Noise', value: 3 },
      { label: 'White Noise', value: 4 },
      { label: 'Interleaved Gradient', value: 5 },
      { label: 'Floyd-Steinberg', value: 6 },
      { label: 'Atkinson', value: 7 },
      { label: 'Pattern', value: 8 },
      { label: 'Clustered Dot', value: 9 },
      { label: 'Threshold', value: 10 },
      { label: 'Stucki', value: 11 },
      { label: 'Burkes', value: 12 },
      { label: 'Sierra Lite', value: 13 },
    ]},
    { id: 'levels', label: 'Levels', type: 'int', defaultValue: 2, min: 2, max: 32 },
    { id: 'intensity', label: 'Intensity', type: 'float', defaultValue: 100, min: 0, max: 200, step: 1, unit: '%' },
    { id: 'scale', label: 'Scale', type: 'float', defaultValue: 1.0, min: 0.5, max: 8.0, step: 0.1 },
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
  tags: ['dither', 'pixel', 'retro', 'bayer', 'floyd-steinberg', 'noise', 'quantize', '1-bit'],
};
