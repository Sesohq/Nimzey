import { DataType, NodeDefinition } from '@/types';

export const curveGeneratorNode: NodeDefinition = {
  id: 'curve-generator',
  name: 'Curve Generator',
  category: 'curve-generator',
  description: 'Generates preset curve shapes for tone mapping.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Curve', dataType: DataType.Curve, required: false },
  ],
  parameters: [
    { id: 'preset', label: 'Curve Type', type: 'option', defaultValue: 0, options: [
      { label: 'S-Curve', value: 0 }, { label: 'Brighten', value: 1 },
      { label: 'Darken', value: 2 }, { label: 'High Contrast', value: 3 },
      { label: 'Solarize', value: 4 }, { label: 'Posterize', value: 5 },
      { label: 'Gamma', value: 6 }, { label: 'Linear', value: 7 },
    ]},
    { id: 'intensity', label: 'Intensity', type: 'float', defaultValue: 1.0, min: 0, max: 1, step: 0.01 },
    { id: 'gamma', label: 'Gamma', type: 'float', defaultValue: 2.2, min: 0.1, max: 5.0, step: 0.01 },
    { id: 'steps', label: 'Steps', type: 'int', defaultValue: 4, min: 2, max: 16 },
  ],
  shaderId: 'curve-generator',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Spline',
  tags: ['curve', 'tone', 'preset', 's-curve', 'gamma'],
};

export const levelsCurveNode: NodeDefinition = {
  id: 'levels-curve',
  name: 'Levels Curve',
  category: 'curve-generator',
  description: 'Maps an input range to an output range with gamma control.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Curve', dataType: DataType.Curve, required: false },
  ],
  parameters: [
    { id: 'inBlack', label: 'In Black', type: 'float', defaultValue: 0, min: 0, max: 1, step: 0.01 },
    { id: 'inWhite', label: 'In White', type: 'float', defaultValue: 1.0, min: 0, max: 1, step: 0.01 },
    { id: 'gamma', label: 'Gamma', type: 'float', defaultValue: 1.0, min: 0.1, max: 10.0, step: 0.01 },
    { id: 'outBlack', label: 'Out Black', type: 'float', defaultValue: 0, min: 0, max: 1, step: 0.01 },
    { id: 'outWhite', label: 'Out White', type: 'float', defaultValue: 1.0, min: 0, max: 1, step: 0.01 },
  ],
  shaderId: 'levels-curve',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'SlidersHorizontal',
  tags: ['curve', 'levels', 'remap', 'range'],
};
