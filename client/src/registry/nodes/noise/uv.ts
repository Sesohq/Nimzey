import { DataType, NodeDefinition } from '@/types';

export const uvCoordinatesNode: NodeDefinition = {
  id: 'uv-coordinates',
  name: 'UV Coordinates',
  category: 'generator',
  description: 'Outputs the UV coordinate space as an image (R=X, G=Y). Foundation for procedural distortion.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'tilingX', label: 'Tiling X', type: 'float', defaultValue: 1, min: 0.1, max: 20, step: 0.1, mappable: true },
    { id: 'tilingY', label: 'Tiling Y', type: 'float', defaultValue: 1, min: 0.1, max: 20, step: 0.1, mappable: true },
    { id: 'offsetX', label: 'Offset X', type: 'float', defaultValue: 0, min: -2, max: 2, step: 0.01 },
    { id: 'offsetY', label: 'Offset Y', type: 'float', defaultValue: 0, min: -2, max: 2, step: 0.01 },
  ],
  shaderId: 'uv-coordinates',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Navigation',
  tags: ['uv', 'coordinates', 'vector', 'distortion', 'position'],
};
