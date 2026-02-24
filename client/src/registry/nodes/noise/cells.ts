import { DataType, NodeDefinition } from '@/types';

export const cellsNoiseNode: NodeDefinition = {
  id: 'cells-noise',
  name: 'Cells',
  category: 'noise',
  description: 'Worley/cellular noise. Creates cell-like patterns for stone, scales, bubbles.',
  inputs: [
    { id: 'background', label: 'Background', dataType: DataType.Map, required: false, hdr: true },
    { id: 'roughness', label: 'Roughness', dataType: DataType.Map, required: false },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'scale', label: 'Scale', type: 'float', defaultValue: 4.0, min: 0.1, max: 50, step: 0.1 },
    { id: 'formula', label: 'Formula', type: 'option', defaultValue: 0, options: [
      { label: 'F1 Euclidean', value: 0 }, { label: 'F2 Euclidean', value: 1 },
      { label: 'F2-F1 Euclidean', value: 2 }, { label: 'F1 Manhattan', value: 3 },
      { label: 'F2 Manhattan', value: 4 }, { label: 'F2-F1 Manhattan', value: 5 },
      { label: 'F1 Chebyshev', value: 6 }, { label: 'F2 Chebyshev', value: 7 },
    ]},
    { id: 'octaves', label: 'Details', type: 'int', defaultValue: 3, min: 1, max: 8 },
    { id: 'roughness', label: 'Roughness', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01, mappable: true },
    { id: 'smooth', label: 'Smooth', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'seed', label: 'Variation', type: 'int', defaultValue: 0, min: 0, max: 29999 },
  ],
  shaderId: 'cells-noise',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Hexagon',
  tags: ['noise', 'worley', 'cellular', 'voronoi', 'cells', 'stone'],
};

export const blocksNoiseNode: NodeDefinition = {
  id: 'blocks-noise',
  name: 'Blocks',
  category: 'noise',
  description: 'Overlapping rectangles and pyramids. Creates city blocks, circuitry patterns.',
  inputs: [
    { id: 'background', label: 'Background', dataType: DataType.Map, required: false, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'scale', label: 'Scale', type: 'float', defaultValue: 4.0, min: 0.1, max: 50, step: 0.1 },
    { id: 'formula', label: 'Formula', type: 'option', defaultValue: 0, options: [
      { label: 'F1 Euclidean', value: 0 }, { label: 'F2 Euclidean', value: 1 },
      { label: 'F1 Manhattan', value: 3 }, { label: 'F1 Chebyshev', value: 6 },
    ]},
    { id: 'octaves', label: 'Details', type: 'int', defaultValue: 3, min: 1, max: 8 },
    { id: 'roughness', label: 'Roughness', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    { id: 'seed', label: 'Variation', type: 'int', defaultValue: 0, min: 0, max: 29999 },
  ],
  shaderId: 'blocks-noise',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'LayoutGrid',
  tags: ['noise', 'blocks', 'city', 'circuitry'],
};

export const pyramidsNoiseNode: NodeDefinition = {
  id: 'pyramids-noise',
  name: 'Pyramids',
  category: 'noise',
  description: 'Pyramid-shaped cellular noise.',
  inputs: [
    { id: 'background', label: 'Background', dataType: DataType.Map, required: false, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'scale', label: 'Scale', type: 'float', defaultValue: 4.0, min: 0.1, max: 50, step: 0.1 },
    { id: 'formula', label: 'Formula', type: 'option', defaultValue: 0, options: [
      { label: 'F1 Euclidean', value: 0 }, { label: 'F2 Euclidean', value: 1 },
      { label: 'F1 Manhattan', value: 3 },
    ]},
    { id: 'octaves', label: 'Details', type: 'int', defaultValue: 3, min: 1, max: 8 },
    { id: 'roughness', label: 'Roughness', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    { id: 'seed', label: 'Variation', type: 'int', defaultValue: 0, min: 0, max: 29999 },
  ],
  shaderId: 'pyramids-noise',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Triangle',
  tags: ['noise', 'pyramids', 'cellular'],
};
