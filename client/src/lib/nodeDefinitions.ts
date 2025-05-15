import { v4 as uuidv4 } from 'uuid';
import { 
  NodeStore, 
  NodeCategory, 
  NodeDefinition,
  NodeRegistry
} from '@shared/nodeTypes';

// Helper function to create a new instance of a node from a definition
export const createNodeInstance = (definition: NodeDefinition, position: { x: number, y: number }): NodeStore => {
  return {
    id: uuidv4(),
    type: definition.id,
    label: definition.name,
    position,
    enabled: true,
    collapsed: definition.defaultCollapsed,
    colorTag: definition.defaultColorTag,
    parameters: definition.parameters.map(param => ({
      ...param,
      sourceNodeId: undefined,
      sourceParameterId: undefined,
      disabled: false // Default to false (not disabled)
    })),
    inputs: definition.inputs.map(input => ({
      ...input,
      connected: false
    })),
    outputs: definition.outputs.map(output => ({
      ...output,
      connected: false
    }))
  };
};

// Registry of all node types
const nodeRegistry: NodeRegistry = {};

// Helper to register a node type
const registerNode = (definition: NodeDefinition) => {
  nodeRegistry[definition.id] = definition;
};

// Source nodes
registerNode({
  id: 'generator-image',
  name: 'Image Source',
  category: NodeCategory.Generator,
  description: 'Import an image from your device',
  defaultColorTag: 'blue',
  defaultCollapsed: false,
  inputs: [],
  outputs: [
    { id: 'output', type: 'image', label: 'Image' }
  ],
  parameters: [
    {
      id: 'image',
      name: 'Image',
      type: 'image',
      controlType: 'image',
      value: undefined,
      defaultValue: undefined
    }
  ]
});

// Basic filter nodes
registerNode({
  id: 'filter-blur',
  name: 'Blur',
  category: NodeCategory.Filter,
  description: 'Apply a blur effect to the image',
  defaultColorTag: 'green',
  defaultCollapsed: false,
  inputs: [
    { id: 'input', type: 'image', label: 'Image' }
  ],
  outputs: [
    { id: 'output', type: 'image', label: 'Result' }
  ],
  parameters: [
    {
      id: 'radius',
      name: 'Radius',
      type: 'float',
      controlType: 'slider',
      value: 5,
      defaultValue: 5,
      min: 0,
      max: 50,
      step: 0.1,
      unit: 'px'
    },
    {
      id: 'mode',
      name: 'Mode',
      type: 'string',
      controlType: 'dropdown',
      value: 'gaussian',
      defaultValue: 'gaussian',
      options: ['gaussian', 'box', 'motion']
    },
    {
      id: 'highQuality',
      name: 'High Quality',
      type: 'boolean',
      controlType: 'toggle',
      value: false,
      defaultValue: false
    }
  ]
});

registerNode({
  id: 'filter-noise',
  name: 'Noise',
  category: NodeCategory.Filter,
  description: 'Add noise to the image',
  defaultColorTag: 'green',
  defaultCollapsed: false,
  inputs: [
    { id: 'input', type: 'image', label: 'Image' }
  ],
  outputs: [
    { id: 'output', type: 'image', label: 'Result' }
  ],
  parameters: [
    {
      id: 'amount',
      name: 'Amount',
      type: 'float',
      controlType: 'slider',
      value: 0.5,
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      id: 'type',
      name: 'Noise Type',
      type: 'string',
      controlType: 'dropdown',
      value: 'gaussian',
      defaultValue: 'gaussian',
      options: ['gaussian', 'uniform', 'salt-pepper', 'perlin', 'simplex']
    },
    {
      id: 'seed',
      name: 'Seed',
      type: 'float',
      controlType: 'slider',
      value: 42,
      defaultValue: 42,
      min: 0,
      max: 1000,
      step: 1
    },
    {
      id: 'monochrome',
      name: 'Monochrome',
      type: 'boolean',
      controlType: 'toggle',
      value: false,
      defaultValue: false
    }
  ]
});

registerNode({
  id: 'filter-dither',
  name: 'Dither',
  category: NodeCategory.Filter,
  description: 'Apply dithering to reduce banding',
  defaultColorTag: 'green',
  defaultCollapsed: false,
  inputs: [
    { id: 'input', type: 'image', label: 'Image' }
  ],
  outputs: [
    { id: 'output', type: 'image', label: 'Result' }
  ],
  parameters: [
    {
      id: 'algorithm',
      name: 'Algorithm',
      type: 'string',
      controlType: 'dropdown',
      value: 'floyd-steinberg',
      defaultValue: 'floyd-steinberg',
      options: ['floyd-steinberg', 'bayer', 'ordered', 'atkinson', 'sierra', 'stucki']
    },
    {
      id: 'threshold',
      name: 'Threshold',
      type: 'float',
      controlType: 'slider',
      value: 0.5,
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      id: 'matrix',
      name: 'Matrix Size',
      type: 'float',
      controlType: 'slider',
      value: 8,
      defaultValue: 8,
      min: 2,
      max: 16,
      step: 1
    },
    {
      id: 'colors',
      name: 'Colors',
      type: 'float',
      controlType: 'slider',
      value: 2,
      defaultValue: 2,
      min: 2,
      max: 256,
      step: 1
    }
  ]
});

registerNode({
  id: 'filter-edge',
  name: 'Find Edges',
  category: NodeCategory.Filter,
  description: 'Detect edges in the image',
  defaultColorTag: 'green',
  defaultCollapsed: false,
  inputs: [
    { id: 'input', type: 'image', label: 'Image' }
  ],
  outputs: [
    { id: 'output', type: 'image', label: 'Result' },
    { id: 'mask', type: 'mask', label: 'Edge Mask' }
  ],
  parameters: [
    {
      id: 'mode',
      name: 'Mode',
      type: 'string',
      controlType: 'dropdown',
      value: 'sobel',
      defaultValue: 'sobel',
      options: ['sobel', 'prewitt', 'roberts', 'laplacian', 'canny']
    },
    {
      id: 'threshold',
      name: 'Threshold',
      type: 'float',
      controlType: 'slider',
      value: 0.1,
      defaultValue: 0.1,
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      id: 'strength',
      name: 'Strength',
      type: 'float',
      controlType: 'slider',
      value: 1,
      defaultValue: 1,
      min: 0,
      max: 5,
      step: 0.1
    }
  ]
});

registerNode({
  id: 'filter-halftone',
  name: 'Halftone',
  category: NodeCategory.Filter,
  description: 'Create a halftone pattern effect',
  defaultColorTag: 'green',
  defaultCollapsed: false,
  inputs: [
    { id: 'input', type: 'image', label: 'Image' }
  ],
  outputs: [
    { id: 'output', type: 'image', label: 'Result' }
  ],
  parameters: [
    {
      id: 'dotSize',
      name: 'Dot Size',
      type: 'float',
      controlType: 'slider',
      value: 4,
      defaultValue: 4,
      min: 1,
      max: 20,
      step: 0.5
    },
    {
      id: 'spacing',
      name: 'Spacing',
      type: 'float',
      controlType: 'slider',
      value: 6,
      defaultValue: 6,
      min: 1,
      max: 20,
      step: 0.5
    },
    {
      id: 'angle',
      name: 'Angle',
      type: 'float',
      controlType: 'slider',
      value: 45,
      defaultValue: 45,
      min: 0,
      max: 360,
      step: 1,
      unit: '°'
    },
    {
      id: 'shape',
      name: 'Shape',
      type: 'string',
      controlType: 'dropdown',
      value: 'circle',
      defaultValue: 'circle',
      options: ['circle', 'square', 'line', 'diamond', 'cross']
    },
    {
      id: 'cmyk',
      name: 'CMYK Mode',
      type: 'boolean',
      controlType: 'toggle',
      value: false,
      defaultValue: false
    }
  ]
});

// Compositing nodes
registerNode({
  id: 'compositing-blend',
  name: 'Blend',
  category: NodeCategory.Compositing,
  description: 'Blend two images together',
  defaultColorTag: 'orange',
  defaultCollapsed: false,
  inputs: [
    { id: 'background', type: 'image', label: 'Background' },
    { id: 'foreground', type: 'image', label: 'Foreground' },
    { id: 'mask', type: 'mask', label: 'Mask', required: false }
  ],
  outputs: [
    { id: 'output', type: 'image', label: 'Result' }
  ],
  parameters: [
    {
      id: 'blendMode',
      name: 'Blend Mode',
      type: 'string',
      controlType: 'dropdown',
      value: 'normal',
      defaultValue: 'normal',
      options: [
        'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
        'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 
        'exclusion', 'hue', 'saturation', 'color', 'luminosity'
      ]
    },
    {
      id: 'opacity',
      name: 'Opacity',
      type: 'float',
      controlType: 'slider',
      value: 1,
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.01
    }
  ]
});

// Adjustment nodes
registerNode({
  id: 'adjustment-brightness',
  name: 'Brightness & Contrast',
  category: NodeCategory.Adjustment,
  description: 'Adjust image brightness and contrast',
  defaultColorTag: 'yellow',
  defaultCollapsed: false,
  inputs: [
    { id: 'input', type: 'image', label: 'Image' }
  ],
  outputs: [
    { id: 'output', type: 'image', label: 'Result' }
  ],
  parameters: [
    {
      id: 'brightness',
      name: 'Brightness',
      type: 'float',
      controlType: 'slider',
      value: 0,
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01
    },
    {
      id: 'contrast',
      name: 'Contrast',
      type: 'float',
      controlType: 'slider',
      value: 0,
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01
    }
  ]
});

// Output nodes
registerNode({
  id: 'output-final',
  name: 'Output',
  category: NodeCategory.Output,
  description: 'Final output of the node graph',
  defaultColorTag: 'gray',
  defaultCollapsed: false,
  inputs: [
    { id: 'input', type: 'image', label: 'Image' }
  ],
  outputs: [],
  parameters: [
    {
      id: 'quality',
      name: 'Quality',
      type: 'float',
      controlType: 'slider',
      value: 90,
      defaultValue: 90,
      min: 1,
      max: 100,
      step: 1
    },
    {
      id: 'format',
      name: 'Format',
      type: 'string',
      controlType: 'dropdown',
      value: 'png',
      defaultValue: 'png',
      options: ['png', 'jpeg', 'webp']
    }
  ]
});

// Public API functions
export const getNodeDefinition = (id: string): NodeDefinition | undefined => {
  return nodeRegistry[id];
};

export const getAllNodeDefinitions = (): NodeDefinition[] => {
  return Object.values(nodeRegistry);
};

export const getNodesByCategory = (category: NodeCategory): NodeDefinition[] => {
  return Object.values(nodeRegistry).filter(def => def.category === category);
};