import { v4 as uuidv4 } from 'uuid';
import { 
  NodeDefinition, 
  NodeCategory, 
  NodeDataType,
  NodeParameter,
  NodePort,
  NodeStore
} from '@shared/nodeTypes';

// Helper to create node port
export const createPort = (
  type: NodeDataType,
  options: Partial<NodePort> = {}
): NodePort => {
  return {
    id: options.id || uuidv4(),
    type,
    label: options.label,
    multiple: options.multiple ?? false,
    required: options.required ?? false,
    connected: options.connected ?? false,
    ...options
  };
};

// Helper to create node parameter
export const createParameter = (
  name: string,
  type: NodeDataType,
  options: Partial<Omit<NodeParameter, 'name' | 'type'>> = {}
): Omit<NodeParameter, 'sourceNodeId' | 'sourceParameterId' | 'disabled'> => {
  return {
    id: options.id || uuidv4(),
    name,
    type,
    controlType: options.controlType || 'slider',
    value: options.value !== undefined ? options.value : options.defaultValue,
    defaultValue: options.defaultValue !== undefined ? options.defaultValue : 0,
    min: options.min,
    max: options.max,
    step: options.step,
    options: options.options,
    unit: options.unit
  };
};

// Create an instance of a node from a definition
export const createNodeInstance = (
  definition: NodeDefinition,
  position: { x: number; y: number }
): NodeStore => {
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
      disabled: false
    })),
    inputs: [...definition.inputs],
    outputs: [...definition.outputs]
  };
};

// Image Source/Input Node Definition
export const ImageSourceNode: NodeDefinition = {
  id: 'imageSource',
  name: 'Image Source',
  category: NodeCategory.Generator,
  description: 'Source image input',
  defaultColorTag: '#4287f5',
  defaultCollapsed: false,
  inputs: [],
  outputs: [
    createPort('image', { id: 'output', label: 'Output', multiple: true })
  ],
  parameters: [
    createParameter('source', 'image', {
      controlType: 'image',
      defaultValue: null
    })
  ],
  process: (node: NodeStore) => {
    // Simply pass the image through
    const sourceParam = node.parameters.find(p => p.id === 'source');
    return {
      output: sourceParam?.value || null
    };
  }
};

// Blur Filter Node Definition
export const BlurFilterNode: NodeDefinition = {
  id: 'blurFilter',
  name: 'Blur',
  category: NodeCategory.Filter,
  description: 'Applies blur to the image',
  defaultColorTag: '#42aaf5',
  defaultCollapsed: false,
  inputs: [
    createPort('image', { id: 'input', label: 'Input', required: true })
  ],
  outputs: [
    createPort('image', { id: 'output', label: 'Output', multiple: true })
  ],
  parameters: [
    createParameter('radius', 'float', {
      controlType: 'slider',
      defaultValue: 5,
      min: 0,
      max: 100,
      step: 0.1,
      unit: 'px'
    }),
    createParameter('iterations', 'float', {
      controlType: 'slider',
      defaultValue: 1,
      min: 1,
      max: 10,
      step: 1
    }),
    createParameter('mode', 'string', {
      controlType: 'dropdown',
      defaultValue: 'gaussian',
      options: ['gaussian', 'box', 'zoom', 'motion']
    }),
    createParameter('blendMode', 'string', {
      controlType: 'dropdown',
      defaultValue: 'normal',
      options: [
        'normal', 'multiply', 'screen', 'overlay', 
        'darken', 'lighten', 'color-dodge', 'color-burn',
        'hard-light', 'soft-light', 'difference', 'exclusion'
      ]
    }),
    createParameter('opacity', 'float', {
      controlType: 'slider',
      defaultValue: 100,
      min: 0,
      max: 100,
      step: 1,
      unit: '%'
    })
  ],
  process: (node: NodeStore, inputData: Record<string, any>) => {
    // Get input image
    const inputImage = inputData['input'];
    if (!inputImage) return { output: null };
    
    // Get parameters
    const radiusParam = node.parameters.find(p => p.id === 'radius');
    const iterationsParam = node.parameters.find(p => p.id === 'iterations');
    const modeParam = node.parameters.find(p => p.id === 'mode');
    
    // This would be where the actual image processing happens
    // For now, we'll just pass the input through
    return {
      output: inputImage
    };
  }
};

// Noise Generator Node Definition
export const NoiseGeneratorNode: NodeDefinition = {
  id: 'noiseGenerator',
  name: 'Noise',
  category: NodeCategory.Generator,
  description: 'Generates noise texture',
  defaultColorTag: '#f54242',
  defaultCollapsed: false,
  inputs: [],
  outputs: [
    createPort('image', { id: 'output', label: 'Output', multiple: true })
  ],
  parameters: [
    createParameter('type', 'string', {
      controlType: 'dropdown',
      defaultValue: 'perlin',
      options: ['perlin', 'simplex', 'value', 'white', 'cellular']
    }),
    createParameter('scale', 'float', {
      controlType: 'slider',
      defaultValue: 50,
      min: 1,
      max: 500,
      step: 1
    }),
    createParameter('seed', 'float', {
      controlType: 'slider',
      defaultValue: 1,
      min: 0,
      max: 1000,
      step: 1
    }),
    createParameter('octaves', 'float', {
      controlType: 'slider',
      defaultValue: 3,
      min: 1,
      max: 10,
      step: 1
    }),
    createParameter('color', 'color', {
      controlType: 'color',
      defaultValue: '#ffffff'
    })
  ],
  process: (node: NodeStore) => {
    // Get parameters
    const typeParam = node.parameters.find(p => p.id === 'type');
    const scaleParam = node.parameters.find(p => p.id === 'scale');
    const seedParam = node.parameters.find(p => p.id === 'seed');
    
    // This would generate a noise texture
    // For now, return a placeholder
    return {
      output: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    };
  }
};

// Blend Node Definition
export const BlendNode: NodeDefinition = {
  id: 'blend',
  name: 'Blend',
  category: NodeCategory.Compositing,
  description: 'Blends two images together',
  defaultColorTag: '#a142f5',
  defaultCollapsed: false,
  inputs: [
    createPort('image', { id: 'inputA', label: 'Input A', required: true }),
    createPort('image', { id: 'inputB', label: 'Input B', required: true })
  ],
  outputs: [
    createPort('image', { id: 'output', label: 'Output', multiple: true })
  ],
  parameters: [
    createParameter('blendMode', 'string', {
      controlType: 'dropdown',
      defaultValue: 'normal',
      options: [
        'normal', 'multiply', 'screen', 'overlay', 
        'darken', 'lighten', 'color-dodge', 'color-burn',
        'hard-light', 'soft-light', 'difference', 'exclusion'
      ]
    }),
    createParameter('opacity', 'float', {
      controlType: 'slider',
      defaultValue: 100,
      min: 0,
      max: 100,
      step: 1,
      unit: '%'
    }),
    createParameter('maskChannel', 'string', {
      controlType: 'dropdown',
      defaultValue: 'none',
      options: ['none', 'alpha', 'red', 'green', 'blue', 'luminance']
    })
  ],
  process: (node: NodeStore, inputData: Record<string, any>) => {
    // Get input images
    const inputImageA = inputData['inputA'];
    const inputImageB = inputData['inputB'];
    
    if (!inputImageA || !inputImageB) {
      return { output: null };
    }
    
    // Get parameters
    const blendModeParam = node.parameters.find(p => p.id === 'blendMode');
    const opacityParam = node.parameters.find(p => p.id === 'opacity');
    
    // This would be where the actual blending happens
    // For now, we'll just pass input A through
    return {
      output: inputImageA
    };
  }
};

// Output Node Definition
export const OutputNode: NodeDefinition = {
  id: 'output',
  name: 'Output',
  category: NodeCategory.Output,
  description: 'Final output image',
  defaultColorTag: '#42f578',
  defaultCollapsed: false,
  inputs: [
    createPort('image', { id: 'input', label: 'Input', required: true })
  ],
  outputs: [],
  parameters: [
    createParameter('format', 'string', {
      controlType: 'dropdown',
      defaultValue: 'png',
      options: ['png', 'jpeg', 'webp']
    }),
    createParameter('quality', 'float', {
      controlType: 'slider',
      defaultValue: 90,
      min: 1,
      max: 100,
      step: 1,
      unit: '%'
    }),
    createParameter('width', 'float', {
      controlType: 'slider',
      defaultValue: 1024,
      min: 10,
      max: 4096,
      step: 1,
      unit: 'px'
    }),
    createParameter('height', 'float', {
      controlType: 'slider',
      defaultValue: 1024,
      min: 10,
      max: 4096,
      step: 1,
      unit: 'px'
    })
  ],
  process: (node: NodeStore, inputData: Record<string, any>) => {
    // Get input image
    const inputImage = inputData['input'];
    
    if (!inputImage) {
      return {};
    }
    
    // Pass through the input to render the final result
    return {};
  }
};

// Node registry that holds all available node types
export const NodeRegistry: Record<string, NodeDefinition> = {
  imageSource: ImageSourceNode,
  blurFilter: BlurFilterNode,
  noiseGenerator: NoiseGeneratorNode,
  blend: BlendNode,
  output: OutputNode
};

// Get a node definition by type
export const getNodeDefinition = (type: string): NodeDefinition | undefined => {
  return NodeRegistry[type];
};

// Get node definitions by category
export const getNodesByCategory = (category: NodeCategory): NodeDefinition[] => {
  return Object.values(NodeRegistry).filter(node => node.category === category);
};