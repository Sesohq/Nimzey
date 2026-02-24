import { DataType, NodeDefinition } from '@/types';

export const extractRGBNode: NodeDefinition = {
  id: 'extract-rgb',
  name: 'Extract RGB',
  category: 'channel',
  description: 'Isolates individual R, G, or B channels as grayscale.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'channel', label: 'Channel', type: 'option', defaultValue: 0, options: [
      { label: 'Red', value: 0 }, { label: 'Green', value: 1 }, { label: 'Blue', value: 2 },
    ]},
    { id: 'invert', label: 'Invert', type: 'bool', defaultValue: false },
  ],
  shaderId: 'extract-rgb',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'SplitSquareHorizontal',
  tags: ['extract', 'channel', 'rgb', 'red', 'green', 'blue'],
};

export const assembleRGBNode: NodeDefinition = {
  id: 'assemble-rgb',
  name: 'Assemble RGB',
  category: 'channel',
  description: 'Combines individual grayscale channels into a color image.',
  inputs: [
    { id: 'red', label: 'Red', dataType: DataType.Map, required: false },
    { id: 'green', label: 'Green', dataType: DataType.Map, required: false },
    { id: 'blue', label: 'Blue', dataType: DataType.Map, required: false },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [],
  shaderId: 'assemble-rgb',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Merge',
  tags: ['assemble', 'combine', 'channel', 'rgb'],
};

export const extractHSBNode: NodeDefinition = {
  id: 'extract-hsb',
  name: 'Extract HSB',
  category: 'channel',
  description: 'Isolates Hue, Saturation, or Brightness channel as grayscale.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'channel', label: 'Channel', type: 'option', defaultValue: 0, options: [
      { label: 'Hue', value: 0 }, { label: 'Saturation', value: 1 }, { label: 'Brightness', value: 2 },
    ]},
    { id: 'invert', label: 'Invert', type: 'bool', defaultValue: false },
  ],
  shaderId: 'extract-hsb',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'SplitSquareHorizontal',
  tags: ['extract', 'channel', 'hsb', 'hue', 'saturation', 'brightness'],
};

export const assembleHSBNode: NodeDefinition = {
  id: 'assemble-hsb',
  name: 'Assemble HSB',
  category: 'channel',
  description: 'Combines individual channels into a color image using HSB color model.',
  inputs: [
    { id: 'hue', label: 'Hue', dataType: DataType.Map, required: false },
    { id: 'saturation', label: 'Saturation', dataType: DataType.Map, required: false },
    { id: 'brightness', label: 'Brightness', dataType: DataType.Map, required: false },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [],
  shaderId: 'assemble-hsb',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Merge',
  tags: ['assemble', 'combine', 'channel', 'hsb'],
};

export const extractHLSNode: NodeDefinition = {
  id: 'extract-hls',
  name: 'Extract HLS',
  category: 'channel',
  description: 'Isolates Hue, Lightness, or Saturation (HLS model) as grayscale.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'channel', label: 'Channel', type: 'option', defaultValue: 0, options: [
      { label: 'Hue', value: 0 }, { label: 'Lightness', value: 1 }, { label: 'Saturation', value: 2 },
    ]},
    { id: 'invert', label: 'Invert', type: 'bool', defaultValue: false },
  ],
  shaderId: 'extract-hls',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'SplitSquareHorizontal',
  tags: ['extract', 'channel', 'hls', 'hue', 'lightness', 'saturation'],
};

export const assembleHLSNode: NodeDefinition = {
  id: 'assemble-hls',
  name: 'Assemble HLS',
  category: 'channel',
  description: 'Combines individual channels into a color image using HLS color model.',
  inputs: [
    { id: 'hue', label: 'Hue', dataType: DataType.Map, required: false },
    { id: 'lightness', label: 'Lightness', dataType: DataType.Map, required: false },
    { id: 'saturation', label: 'Saturation', dataType: DataType.Map, required: false },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [],
  shaderId: 'assemble-hls',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Merge',
  tags: ['assemble', 'combine', 'channel', 'hls'],
};

export const getAlphaNode: NodeDefinition = {
  id: 'get-alpha',
  name: 'Get Alpha',
  category: 'channel',
  description: 'Extracts the alpha channel as a grayscale image.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [],
  shaderId: 'get-alpha',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Eye',
  tags: ['alpha', 'transparency', 'mask', 'extract'],
};

export const setAlphaNode: NodeDefinition = {
  id: 'set-alpha',
  name: 'Set Alpha',
  category: 'channel',
  description: 'Sets the alpha channel from a grayscale map input.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
    { id: 'alpha', label: 'Alpha', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [],
  shaderId: 'set-alpha',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'EyeOff',
  tags: ['alpha', 'transparency', 'mask', 'set'],
};
