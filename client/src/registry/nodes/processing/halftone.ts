import { DataType, NodeDefinition } from '@/types';

export const halftoneNode: NodeDefinition = {
  id: 'halftone',
  name: 'Halftone',
  category: 'effect',
  description: 'Converts image to halftone dot patterns like newspaper/print.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'algorithm', label: 'Algorithm', type: 'option', defaultValue: 0, options: [
      { label: 'Circle Dot', value: 0 },
      { label: 'Square Dot', value: 1 },
      { label: 'Diamond Dot', value: 2 },
      { label: 'Ellipse Dot', value: 3 },
      { label: 'Line Screen', value: 4 },
      { label: 'CMYK Separation', value: 5 },
      { label: 'Crosshatch', value: 6 },
      { label: 'Stochastic/FM', value: 7 },
      { label: 'Voronoi Stipple', value: 8 },
      { label: 'Newsprint', value: 9 },
      { label: 'Dot with Noise', value: 10 },
      { label: 'Multi-Angle', value: 11 },
    ]},
    { id: 'scale', label: 'Scale', type: 'float', defaultValue: 8, min: 1, max: 100, step: 0.5 },
    { id: 'angle', label: 'Angle', type: 'angle', defaultValue: 45, min: 0, max: 360, step: 1, unit: '°' },
    { id: 'softness', label: 'Softness', type: 'float', defaultValue: 10, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'invert', label: 'Invert', type: 'bool', defaultValue: false },
    { id: 'colorMode', label: 'Color Mode', type: 'option', defaultValue: 0, options: [
      { label: 'Mono', value: 0 },
      { label: 'Preserve Color', value: 1 },
      { label: 'CMYK', value: 2 },
    ]},
    { id: 'dotGain', label: 'Dot Gain', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'crosshatchLevels', label: 'Crosshatch Levels', type: 'int', defaultValue: 3, min: 1, max: 6 },
  ],
  shaderId: 'halftone',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'CircleDot',
  tags: ['halftone', 'dots', 'print', 'newspaper', 'cmyk', 'screen', 'stipple'],
};
