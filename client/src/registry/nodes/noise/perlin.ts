import { DataType, NodeDefinition } from '@/types';

export const perlinNoiseNode: NodeDefinition = {
  id: 'perlin-noise',
  name: 'Perlin Noise',
  category: 'noise',
  description: 'Procedural gradient noise with octave composition. Creates clouds, terrain, organic textures.',
  inputs: [
    { id: 'background', label: 'Background', dataType: DataType.Map, required: false, hdr: true },
    { id: 'roughness', label: 'Roughness', dataType: DataType.Map, required: false },
    { id: 'contrast', label: 'Contrast', dataType: DataType.Map, required: false },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'scale', label: 'Scale', type: 'float', defaultValue: 4.0, min: 0.1, max: 50, step: 0.1 },
    { id: 'stretch', label: 'Stretch', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'angle', label: 'Angle', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
    { id: 'octaves', label: 'Details', type: 'int', defaultValue: 4, min: 1, max: 11 },
    { id: 'roughness', label: 'Roughness', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01, mappable: true },
    { id: 'contrast', label: 'Contrast', type: 'float', defaultValue: 0, min: -100, max: 100, step: 1, mappable: true },
    { id: 'seed', label: 'Variation', type: 'int', defaultValue: 0, min: 0, max: 29999 },
    { id: 'color', label: 'Noise Color', type: 'color', defaultValue: '#ffffff' },
  ],
  shaderId: 'perlin-noise',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Waves',
  tags: ['noise', 'perlin', 'fractal', 'fbm', 'clouds', 'terrain'],
};
