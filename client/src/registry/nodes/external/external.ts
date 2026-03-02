import { DataType, NodeDefinition } from '@/types';

export const imageNode: NodeDefinition = {
  id: 'image',
  name: 'Image',
  category: 'external',
  description: 'Loads an image file as a source. Makes the filter an Effect filter.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [],
  shaderId: 'passthrough',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Image',
  tags: ['image', 'source', 'load', 'file', 'upload'],
};

export const colorControlNode: NodeDefinition = {
  id: 'color-control',
  name: 'Color Control',
  category: 'control',
  description: 'Provides a color value as a Map output. Can accept images.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'color', label: 'Color', type: 'hdrColor', defaultValue: '#808080' },
  ],
  shaderId: 'solid-color',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Paintbrush',
  tags: ['color', 'constant', 'solid', 'fill'],
};

export const sliderControlNode: NodeDefinition = {
  id: 'slider-control',
  name: 'Slider',
  category: 'control',
  description: 'Provides a numeric value from a slider control.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Numeric, required: false },
  ],
  parameters: [
    { id: 'value', label: 'Value', type: 'float', defaultValue: 50, min: 0, max: 100, step: 0.1 },
    { id: 'label', label: 'Label', type: 'option', defaultValue: 'Value', options: [{ label: 'Value', value: 'Value' }] },
  ],
  shaderId: 'numeric-output',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'SlidersHorizontal',
  tags: ['slider', 'control', 'value', 'number'],
};

export const checkboxControlNode: NodeDefinition = {
  id: 'checkbox-control',
  name: 'Checkbox',
  category: 'control',
  description: 'Provides a boolean (0 or 1) numeric value.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Numeric, required: false },
  ],
  parameters: [
    { id: 'value', label: 'Checked', type: 'bool', defaultValue: false },
  ],
  shaderId: 'numeric-output',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'CheckSquare',
  tags: ['checkbox', 'toggle', 'bool', 'switch'],
};

export const angleControlNode: NodeDefinition = {
  id: 'angle-control',
  name: 'Angle',
  category: 'control',
  description: 'Provides an angle value as a numeric output.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Numeric, required: false },
  ],
  parameters: [
    { id: 'value', label: 'Angle', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
  ],
  shaderId: 'numeric-output',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'RotateCcw',
  tags: ['angle', 'rotation', 'degree'],
};
