import { DataType, NodeDefinition } from '@/types';

export const blendNode: NodeDefinition = {
  id: 'blend',
  name: 'Blend',
  category: 'blender',
  description: 'Composites foreground over background using blend modes with alpha awareness.',
  inputs: [
    { id: 'foreground', label: 'Foreground', dataType: DataType.Map, required: true, hdr: true },
    { id: 'background', label: 'Background', dataType: DataType.Map, required: true, hdr: true },
    { id: 'opacity', label: 'Opacity', dataType: DataType.Map, required: false },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'mode', label: 'Mode', type: 'option', defaultValue: 0, options: [
      { label: 'Normal', value: 0 }, { label: 'Darken', value: 1 },
      { label: 'Multiply', value: 2 }, { label: 'Color Burn', value: 3 },
      { label: 'Linear Burn', value: 4 }, { label: 'Lighten', value: 5 },
      { label: 'Screen', value: 6 }, { label: 'Color Dodge', value: 7 },
      { label: 'Linear Dodge', value: 8 }, { label: 'Overlay', value: 9 },
      { label: 'Soft Light', value: 10 }, { label: 'Hard Light', value: 11 },
      { label: 'Vivid Light', value: 12 }, { label: 'Linear Light', value: 13 },
      { label: 'Difference', value: 14 }, { label: 'Exclusion', value: 15 },
      { label: 'Hue', value: 16 }, { label: 'Saturation', value: 17 },
      { label: 'Color', value: 18 }, { label: 'Luminosity', value: 19 },
      { label: 'Hard Mix', value: 20 },
    ]},
    { id: 'opacity', label: 'Opacity', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', mappable: true },
  ],
  shaderId: 'blend',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Layers',
  tags: ['blend', 'composite', 'mix', 'overlay'],
};

export const multiblendNode: NodeDefinition = {
  id: 'multiblend',
  name: 'Multiblend',
  category: 'blender',
  description: 'Blends up to 7 layers using Normal mode with individual opacity controls.',
  inputs: [
    { id: 'layer1', label: 'Layer 1', dataType: DataType.Map, required: false, hdr: true },
    { id: 'layer2', label: 'Layer 2', dataType: DataType.Map, required: false, hdr: true },
    { id: 'layer3', label: 'Layer 3', dataType: DataType.Map, required: false, hdr: true },
    { id: 'layer4', label: 'Layer 4', dataType: DataType.Map, required: false, hdr: true },
    { id: 'layer5', label: 'Layer 5', dataType: DataType.Map, required: false, hdr: true },
    { id: 'layer6', label: 'Layer 6', dataType: DataType.Map, required: false, hdr: true },
    { id: 'layer7', label: 'Layer 7', dataType: DataType.Map, required: false, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'opacity1', label: 'Opacity 1', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'opacity2', label: 'Opacity 2', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'opacity3', label: 'Opacity 3', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'opacity4', label: 'Opacity 4', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'opacity5', label: 'Opacity 5', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'opacity6', label: 'Opacity 6', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'opacity7', label: 'Opacity 7', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', mappable: true },
  ],
  shaderId: 'multiblend',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Layers',
  tags: ['blend', 'layers', 'composite'],
};
