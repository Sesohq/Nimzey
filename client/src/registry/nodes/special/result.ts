import { DataType, NodeDefinition } from '@/types';

export const resultNode: NodeDefinition = {
  id: 'result',
  name: 'Result',
  category: 'special',
  description: 'The mandatory root node. Only components connected to Result affect the output.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [],
  parameters: [
    { id: 'mode', label: 'Mode', type: 'option', defaultValue: 0, options: [
      { label: 'Simple', value: 0 },
      { label: 'PBR Surface', value: 1 },
    ]},
  ],
  shaderId: 'result',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'MonitorPlay',
  tags: ['result', 'output', 'final', 'root'],
};

/**
 * PBR Surface Result - activated when Result mode is set to PBR.
 * Has additional inputs for game engine texture maps.
 */
export const resultPBRNode: NodeDefinition = {
  id: 'result-pbr',
  name: 'Result (PBR)',
  category: 'special',
  description: 'PBR Surface result with physically-based rendering outputs.',
  inputs: [
    { id: 'baseColor', label: 'Base Color', dataType: DataType.Map, required: true, hdr: true },
    { id: 'height', label: 'Height', dataType: DataType.Map, required: true },
    { id: 'roughness', label: 'Roughness', dataType: DataType.Map, required: false },
    { id: 'metallic', label: 'Metallic', dataType: DataType.Map, required: false },
    { id: 'emission', label: 'Emission', dataType: DataType.Map, required: false, hdr: true },
    { id: 'normal', label: 'Normal', dataType: DataType.Map, required: false },
    { id: 'occlusion', label: 'Occlusion', dataType: DataType.Map, required: false },
  ],
  outputs: [],
  parameters: [
    { id: 'surfaceHeight', label: 'Surface Height', type: 'float', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%' },
  ],
  shaderId: 'result-pbr',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Box',
  tags: ['result', 'pbr', 'surface', 'game', 'texture'],
};
