import { DataType, NodeDefinition } from '@/types';

export const maskNode: NodeDefinition = {
  id: 'mask',
  name: 'Mask',
  category: 'processing',
  description: 'Uses a grayscale map to control transparency. White = visible, black = hidden.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
    { id: 'mask', label: 'Mask', dataType: DataType.Map, required: true },
    { id: 'background', label: 'Background', dataType: DataType.Map, required: false, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'channel', label: 'Channel', type: 'option', defaultValue: 0, options: [
      { label: 'Luminance', value: 0 }, { label: 'Red', value: 1 },
      { label: 'Green', value: 2 }, { label: 'Blue', value: 3 },
      { label: 'Alpha', value: 4 },
    ]},
    { id: 'invert', label: 'Invert', type: 'bool', defaultValue: false },
    { id: 'softness', label: 'Softness', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'threshold', label: 'Threshold', type: 'float', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'range_low', label: 'Range Low', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'range_high', label: 'Range High', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%' },
  ],
  shaderId: 'mask',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'RectangleEllipsis',
  tags: ['mask', 'transparency', 'alpha', 'matte', 'cutout'],
};
