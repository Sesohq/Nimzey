import { DataType, NodeDefinition } from '@/types';

export const flipNode: NodeDefinition = {
  id: 'flip',
  name: 'Flip',
  category: 'transform',
  description: 'Flips image horizontally and/or vertically.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'horizontal', label: 'Horizontal', type: 'bool', defaultValue: true },
    { id: 'vertical', label: 'Vertical', type: 'bool', defaultValue: false },
  ],
  shaderId: 'flip',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'FlipHorizontal',
  tags: ['flip', 'mirror', 'horizontal', 'vertical'],
};

export const rotateNode: NodeDefinition = {
  id: 'rotate',
  name: 'Rotate',
  category: 'transform',
  description: 'Rotates image around an origin point.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'rotation', label: 'Rotation', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 0.1, unit: '°' },
    { id: 'originX', label: 'Origin X', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    { id: 'originY', label: 'Origin Y', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
  ],
  shaderId: 'rotate',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'RotateCw',
  tags: ['rotate', 'turn', 'spin', 'angle'],
};

export const scaleNode: NodeDefinition = {
  id: 'scale',
  name: 'Scale',
  category: 'transform',
  description: 'Scales image from an origin point. Supports negative values for flipping.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'scale', label: 'Scale', type: 'float', defaultValue: 1, min: -4, max: 4, step: 0.01 },
    { id: 'squash', label: 'Squash', type: 'float', defaultValue: 0, min: -100, max: 100, step: 1, unit: '%' },
    { id: 'originX', label: 'Origin X', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    { id: 'originY', label: 'Origin Y', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
  ],
  shaderId: 'scale',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Maximize',
  tags: ['scale', 'resize', 'zoom', 'enlarge', 'shrink'],
};

export const offsetNode: NodeDefinition = {
  id: 'offset',
  name: 'Offset',
  category: 'transform',
  description: 'Shifts image by specified distances. Seamless tiling.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'offsetX', label: 'Offset X', type: 'float', defaultValue: 0, min: -1, max: 1, step: 0.01 },
    { id: 'offsetY', label: 'Offset Y', type: 'float', defaultValue: 0, min: -1, max: 1, step: 0.01 },
  ],
  shaderId: 'offset',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Move',
  tags: ['offset', 'shift', 'translate', 'move'],
};

export const perspectiveNode: NodeDefinition = {
  id: 'perspective',
  name: 'Perspective',
  category: 'transform',
  description: 'Applies 3D perspective transformation.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
    { id: 'background', label: 'Background', dataType: DataType.Map, required: false, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'perspective', label: 'Perspective', type: 'float', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'fov', label: 'FOV', type: 'float', defaultValue: 60, min: 10, max: 170, step: 1, unit: '°' },
    { id: 'pitch', label: 'Pitch', type: 'float', defaultValue: 0, min: -90, max: 90, step: 1, unit: '°' },
    { id: 'yaw', label: 'Yaw', type: 'float', defaultValue: 0, min: -90, max: 90, step: 1, unit: '°' },
    { id: 'roll', label: 'Roll', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
    { id: 'mode', label: 'Mode', type: 'option', defaultValue: 0, options: [
      { label: 'Clipped', value: 0 }, { label: 'Tiled', value: 1 }, { label: 'Infinite', value: 2 },
    ]},
  ],
  shaderId: 'perspective',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Box',
  tags: ['perspective', '3d', 'transform', 'vanishing'],
};

export const lookupNode: NodeDefinition = {
  id: 'lookup',
  name: 'Lookup',
  category: 'transform',
  description: 'Coordinate remapping - outputs source color at coordinates specified by X/Y maps.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
    { id: 'lookupX', label: 'Lookup X', dataType: DataType.Map, required: false, hdr: true },
    { id: 'lookupY', label: 'Lookup Y', dataType: DataType.Map, required: false, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [],
  shaderId: 'lookup',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Navigation',
  tags: ['lookup', 'remap', 'warp', 'distort', 'coordinates'],
};
