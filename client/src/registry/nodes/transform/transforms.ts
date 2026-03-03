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

// ===== New Distortion Nodes =====

function distortionNode(
  id: string, name: string, description: string, icon: string, tags: string[],
  params: NodeDefinition['parameters'] = [],
): NodeDefinition {
  return {
    id,
    name,
    category: 'transform',
    description,
    inputs: [
      { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
    ],
    outputs: [
      { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
    ],
    parameters: params,
    shaderId: id,
    isGenerator: false,
    requiresBitmapCache: false,
    icon,
    tags,
  };
}

export const twirlNode = distortionNode('twirl', 'Twirl', 'Twists the image around a point, creating a spiral distortion.', 'RotateCw', ['twirl', 'twist', 'spiral', 'swirl'], [
  { id: 'strength', label: 'Strength', type: 'float', defaultValue: 1, min: -5, max: 5, step: 0.05, mappable: true },
  { id: 'radius', label: 'Radius', type: 'float', defaultValue: 0.5, min: 0.01, max: 1.5, step: 0.01, mappable: true },
  { id: 'originX', label: 'Origin X', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
  { id: 'originY', label: 'Origin Y', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
]);

export const rippleNode = distortionNode('ripple', 'Ripple', 'Creates expanding wave distortion from a center point, like ripples in water.', 'Waves', ['ripple', 'wave', 'water', 'concentric', 'ring'], [
  { id: 'amplitude', label: 'Amplitude', type: 'float', defaultValue: 0.03, min: 0, max: 0.2, step: 0.002, mappable: true },
  { id: 'frequency', label: 'Frequency', type: 'float', defaultValue: 8, min: 1, max: 50, step: 0.5, mappable: true },
  { id: 'phase', label: 'Phase', type: 'float', defaultValue: 0, min: 0, max: 1, step: 0.01 },
  { id: 'decay', label: 'Decay', type: 'float', defaultValue: 2, min: 0, max: 20, step: 0.5 },
  { id: 'originX', label: 'Origin X', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
  { id: 'originY', label: 'Origin Y', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
]);

export const polarCoordinatesNode = distortionNode('polar-coordinates', 'Polar Coordinates', 'Converts between rectangular and polar coordinate systems.', 'Orbit', ['polar', 'coordinates', 'radial', 'angular', 'circular'], [
  { id: 'mode', label: 'Mode', type: 'option', defaultValue: 0, options: [
    { label: 'Rect → Polar', value: 0 }, { label: 'Polar → Rect', value: 1 },
  ]},
  { id: 'originX', label: 'Origin X', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
  { id: 'originY', label: 'Origin Y', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
]);

export const spherizeNode = distortionNode('spherize', 'Spherize', 'Wraps the image around a sphere or pinches it inward.', 'Globe', ['spherize', 'bulge', 'pinch', 'lens', 'fish-eye'], [
  { id: 'strength', label: 'Strength', type: 'float', defaultValue: 50, min: -100, max: 100, step: 1, mappable: true },
  { id: 'mode', label: 'Mode', type: 'option', defaultValue: 0, options: [
    { label: 'Spherize', value: 0 }, { label: 'Pinch', value: 1 },
  ]},
]);

export const waveNode = distortionNode('wave', 'Wave', 'Displaces the image using wave patterns along X and Y axes.', 'AudioLines', ['wave', 'sine', 'triangle', 'sawtooth', 'wiggle', 'undulate'], [
  { id: 'ampX', label: 'Amplitude X', type: 'float', defaultValue: 0.03, min: 0, max: 0.3, step: 0.005, mappable: true },
  { id: 'ampY', label: 'Amplitude Y', type: 'float', defaultValue: 0.03, min: 0, max: 0.3, step: 0.005, mappable: true },
  { id: 'freqX', label: 'Frequency X', type: 'float', defaultValue: 4, min: 0.5, max: 30, step: 0.5 },
  { id: 'freqY', label: 'Frequency Y', type: 'float', defaultValue: 4, min: 0.5, max: 30, step: 0.5 },
  { id: 'phaseX', label: 'Phase X', type: 'float', defaultValue: 0, min: 0, max: 1, step: 0.01 },
  { id: 'phaseY', label: 'Phase Y', type: 'float', defaultValue: 0, min: 0, max: 1, step: 0.01 },
  { id: 'type', label: 'Wave Type', type: 'option', defaultValue: 0, options: [
    { label: 'Sine', value: 0 }, { label: 'Triangle', value: 1 }, { label: 'Sawtooth', value: 2 },
  ]},
]);

export const kaleidoscopeNode = distortionNode('kaleidoscope', 'Kaleidoscope', 'Creates a mirrored kaleidoscope pattern with adjustable segments.', 'Diamond', ['kaleidoscope', 'mirror', 'symmetry', 'segments', 'mandala'], [
  { id: 'segments', label: 'Segments', type: 'int', defaultValue: 6, min: 2, max: 24, step: 1 },
  { id: 'rotation', label: 'Rotation', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1 },
  { id: 'originX', label: 'Origin X', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
  { id: 'originY', label: 'Origin Y', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
]);

export const vortexNode = distortionNode('vortex', 'Vortex', 'Creates a spiral distortion that intensifies with distance from center.', 'Tornado', ['vortex', 'spiral', 'whirlpool', 'spin'], [
  { id: 'strength', label: 'Strength', type: 'float', defaultValue: 0.5, min: -3, max: 3, step: 0.05, mappable: true },
  { id: 'originX', label: 'Origin X', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
  { id: 'originY', label: 'Origin Y', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
]);

export const barrelDistortNode = distortionNode('barrel-distort', 'Barrel Distort', 'Barrel or pincushion lens distortion effect, like a camera lens.', 'Aperture', ['barrel', 'pincushion', 'lens', 'distort', 'fish-eye', 'camera'], [
  { id: 'k1', label: 'Distortion', type: 'float', defaultValue: 0.3, min: -2, max: 2, step: 0.05, mappable: true },
  { id: 'k2', label: 'Curvature', type: 'float', defaultValue: 0, min: -1, max: 1, step: 0.05 },
]);
