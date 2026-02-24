import { DataType, NodeDefinition } from '@/types';

export const blurNode: NodeDefinition = {
  id: 'blur',
  name: 'Blur',
  category: 'processing',
  description: 'Gaussian or box blur. Softens edges and reduces detail.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'radius', label: 'Radius', type: 'float', defaultValue: 5, min: 0, max: 100, step: 0.5, unit: '%', mappable: true },
    { id: 'gaussian', label: 'Gaussian', type: 'bool', defaultValue: true },
  ],
  shaderId: 'blur',
  isGenerator: false,
  requiresBitmapCache: true,
  icon: 'Droplets',
  tags: ['blur', 'gaussian', 'smooth', 'soften'],
};

export const motionBlurNode: NodeDefinition = {
  id: 'motion-blur',
  name: 'Motion Blur',
  category: 'processing',
  description: 'Directional blur simulating motion.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'radius', label: 'Radius', type: 'float', defaultValue: 10, min: 0, max: 100, step: 0.5, unit: '%' },
    { id: 'angle', label: 'Angle', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
    { id: 'directional', label: 'Directional', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'gaussian', label: 'Gaussian', type: 'bool', defaultValue: true },
  ],
  shaderId: 'motion-blur',
  isGenerator: false,
  requiresBitmapCache: true,
  icon: 'Wind',
  tags: ['blur', 'motion', 'directional'],
};

export const sharpenNode: NodeDefinition = {
  id: 'sharpen',
  name: 'Sharpen',
  category: 'processing',
  description: 'Sharpens edges using unsharp masking.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'amount', label: 'Amount', type: 'float', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'radius', label: 'Radius', type: 'float', defaultValue: 1, min: 0.1, max: 5, step: 0.1 },
    { id: 'preserveColor', label: 'Preserve Color', type: 'bool', defaultValue: false },
  ],
  shaderId: 'sharpen',
  isGenerator: false,
  requiresBitmapCache: true,
  icon: 'Sparkles',
  tags: ['sharpen', 'unsharp', 'detail', 'enhance'],
};

export const edgeDetectorNode: NodeDefinition = {
  id: 'edge-detector',
  name: 'Edge Detector',
  category: 'processing',
  description: 'Detects edges using Sobel, Roberts, or gradient algorithms.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'formula', label: 'Formula', type: 'option', defaultValue: 0, options: [
      { label: 'Sobel', value: 0 }, { label: 'Roberts', value: 1 }, { label: 'Gradient', value: 2 },
    ]},
    { id: 'mode', label: 'Mode', type: 'option', defaultValue: 0, options: [
      { label: 'Grayscale', value: 0 }, { label: 'Channel-wise', value: 1 },
      { label: 'Min', value: 2 }, { label: 'Max', value: 3 },
    ]},
    { id: 'radius', label: 'Radius', type: 'float', defaultValue: 1, min: 0.5, max: 10, step: 0.5 },
    { id: 'amplitude', label: 'Amplitude', type: 'float', defaultValue: 1, min: 0, max: 10, step: 0.1 },
  ],
  shaderId: 'edge-detector',
  isGenerator: false,
  requiresBitmapCache: true,
  icon: 'ScanLine',
  tags: ['edge', 'sobel', 'detect', 'outline'],
};

export const highPassNode: NodeDefinition = {
  id: 'high-pass',
  name: 'High Pass',
  category: 'processing',
  description: 'Removes low-frequency features, preserves edges and detail.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'radius', label: 'Radius', type: 'float', defaultValue: 5, min: 0.5, max: 50, step: 0.5 },
    { id: 'contrast', label: 'Contrast', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'monochrome', label: 'Monochrome', type: 'bool', defaultValue: false },
  ],
  shaderId: 'high-pass',
  isGenerator: false,
  requiresBitmapCache: true,
  icon: 'Activity',
  tags: ['high-pass', 'detail', 'frequency', 'edges'],
};

export const noiseDistortionNode: NodeDefinition = {
  id: 'noise-distortion',
  name: 'Noise Distortion',
  category: 'processing',
  description: 'Natural-looking distortion using Perlin noise displacement.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'distortion', label: 'Distortion', type: 'float', defaultValue: 10, min: 0, max: 100, step: 1, unit: '%', mappable: true },
    { id: 'scale', label: 'Scale', type: 'float', defaultValue: 4, min: 0.1, max: 50, step: 0.1 },
    { id: 'roughness', label: 'Roughness', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01, mappable: true },
    { id: 'octaves', label: 'Details', type: 'int', defaultValue: 3, min: 1, max: 8 },
    { id: 'seed', label: 'Variation', type: 'int', defaultValue: 0, min: 0, max: 29999 },
  ],
  shaderId: 'noise-distortion',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Shuffle',
  tags: ['distortion', 'noise', 'warp', 'displace'],
};

export const refractionNode: NodeDefinition = {
  id: 'refraction',
  name: 'Refraction',
  category: 'processing',
  description: 'Simulates light bending through refractive materials.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
    { id: 'height', label: 'Height', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'refraction', label: 'Refraction', type: 'float', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%', mappable: true },
  ],
  shaderId: 'refraction',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Droplet',
  tags: ['refraction', 'glass', 'water', 'lens'],
};

export const medianNode: NodeDefinition = {
  id: 'median',
  name: 'Median',
  category: 'processing',
  description: 'Replaces each pixel with the median color of its neighborhood. Great for noise reduction.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'radius', label: 'Radius', type: 'int', defaultValue: 2, min: 1, max: 10 },
  ],
  shaderId: 'median',
  isGenerator: false,
  requiresBitmapCache: true,
  icon: 'CircleDot',
  tags: ['median', 'denoise', 'filter'],
};

export const maximumNode: NodeDefinition = {
  id: 'maximum',
  name: 'Maximum',
  category: 'processing',
  description: 'Morphological dilation - replaces each pixel with the brightest in its neighborhood.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'radius', label: 'Radius', type: 'int', defaultValue: 2, min: 1, max: 20 },
  ],
  shaderId: 'maximum',
  isGenerator: false,
  requiresBitmapCache: true,
  icon: 'ArrowUpCircle',
  tags: ['maximum', 'dilate', 'morphology', 'expand'],
};

export const minimumNode: NodeDefinition = {
  id: 'minimum',
  name: 'Minimum',
  category: 'processing',
  description: 'Morphological erosion - replaces each pixel with the darkest in its neighborhood.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'radius', label: 'Radius', type: 'int', defaultValue: 2, min: 1, max: 20 },
  ],
  shaderId: 'minimum',
  isGenerator: false,
  requiresBitmapCache: true,
  icon: 'ArrowDownCircle',
  tags: ['minimum', 'erode', 'morphology', 'shrink'],
};
