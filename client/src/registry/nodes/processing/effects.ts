import { DataType, NodeDefinition } from '@/types';

export const pixelateNode: NodeDefinition = {
  id: 'pixelate',
  name: 'Pixelate',
  category: 'effect',
  description: 'Creates a blocky, pixelated mosaic effect with configurable pixel size and shape.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'pixelSize', label: 'Pixel Size', type: 'float', defaultValue: 10, min: 1, max: 100, step: 1, mappable: true },
    { id: 'shape', label: 'Shape', type: 'option', defaultValue: 0, options: [
      { label: 'Square', value: 0 },
      { label: 'Circle', value: 1 },
      { label: 'Diamond', value: 2 },
    ]},
  ],
  shaderId: 'pixelate',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Grid3X3',
  tags: ['pixelate', 'mosaic', 'pixel', 'blocky', 'retro', '8-bit'],
};

export const extrudeNode: NodeDefinition = {
  id: 'extrude',
  name: 'Extrude',
  category: 'effect',
  description: 'Creates a 3D extrusion effect by layering offset copies of the image.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'height', label: 'Height', type: 'float', defaultValue: 30, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'angle', label: 'Angle', type: 'angle', defaultValue: 135, min: 0, max: 360, step: 1, unit: '°' },
    { id: 'steps', label: 'Steps', type: 'int', defaultValue: 16, min: 1, max: 64 },
    { id: 'fadeMode', label: 'Fade', type: 'option', defaultValue: 0, options: [
      { label: 'Shadow', value: 0 },
      { label: 'Flat', value: 1 },
      { label: 'Deep Shadow', value: 2 },
    ]},
  ],
  shaderId: 'extrude',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Box',
  tags: ['extrude', '3d', 'depth', 'shadow', 'emboss', 'pop'],
};
