import { DataType, NodeDefinition } from '@/types';

export const threeColorGradientNode: NodeDefinition = {
  id: 'gradient-3-color',
  name: '3-Color Gradient',
  category: 'generator',
  description: 'Linear gradient with 3 color stops.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'color1', label: 'Color 1', type: 'color', defaultValue: '#000000' },
    { id: 'color2', label: 'Color 2', type: 'color', defaultValue: '#808080' },
    { id: 'color3', label: 'Color 3', type: 'color', defaultValue: '#ffffff' },
    { id: 'pos1', label: 'Position 1', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'pos2', label: 'Position 2', type: 'float', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'pos3', label: 'Position 3', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'angle', label: 'Angle', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
    { id: 'repeat', label: 'Repeat', type: 'int', defaultValue: 1, min: 1, max: 20 },
  ],
  shaderId: 'gradient-3-color',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Palette',
  tags: ['gradient', 'linear', 'color', 'ramp'],
};

export const fiveColorGradientNode: NodeDefinition = {
  id: 'gradient-5-color',
  name: '5-Color Gradient',
  category: 'generator',
  description: 'Linear gradient with 5 color stops for complex color ramps.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'color1', label: 'Color 1', type: 'color', defaultValue: '#000000' },
    { id: 'color2', label: 'Color 2', type: 'color', defaultValue: '#404040' },
    { id: 'color3', label: 'Color 3', type: 'color', defaultValue: '#808080' },
    { id: 'color4', label: 'Color 4', type: 'color', defaultValue: '#c0c0c0' },
    { id: 'color5', label: 'Color 5', type: 'color', defaultValue: '#ffffff' },
    { id: 'pos1', label: 'Position 1', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'pos2', label: 'Position 2', type: 'float', defaultValue: 25, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'pos3', label: 'Position 3', type: 'float', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'pos4', label: 'Position 4', type: 'float', defaultValue: 75, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'pos5', label: 'Position 5', type: 'float', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'angle', label: 'Angle', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
    { id: 'repeat', label: 'Repeat', type: 'int', defaultValue: 1, min: 1, max: 20 },
  ],
  shaderId: 'gradient-5-color',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Palette',
  tags: ['gradient', 'linear', 'color', 'ramp'],
};

export const profileGradientNode: NodeDefinition = {
  id: 'gradient-profile',
  name: 'Profile Gradient',
  category: 'generator',
  description: 'Two-color gradient with a profile curve controlling the transition.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'color1', label: 'Color 1', type: 'color', defaultValue: '#000000' },
    { id: 'color2', label: 'Color 2', type: 'color', defaultValue: '#ffffff' },
    { id: 'offset', label: 'Offset', type: 'float', defaultValue: 0, min: -100, max: 100, step: 1, unit: '%' },
    { id: 'angle', label: 'Angle', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
    { id: 'repeat', label: 'Repeat', type: 'int', defaultValue: 1, min: 1, max: 20 },
    { id: 'mirror', label: 'Mirror', type: 'bool', defaultValue: false },
  ],
  shaderId: 'gradient-profile',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Palette',
  tags: ['gradient', 'profile', 'transition'],
};

export const freeGradientNode: NodeDefinition = {
  id: 'gradient-free',
  name: 'Free Gradient',
  category: 'generator',
  description: 'Linear, radial, or angular gradient with free start/end positions.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'color1', label: 'Color 1', type: 'color', defaultValue: '#000000' },
    { id: 'color2', label: 'Color 2', type: 'color', defaultValue: '#ffffff' },
    { id: 'type', label: 'Type', type: 'option', defaultValue: 0, options: [
      { label: 'Linear', value: 0 }, { label: 'Radial', value: 1 }, { label: 'Angular', value: 2 },
    ]},
    { id: 'startX', label: 'Start X', type: 'float', defaultValue: 0, min: -1, max: 2, step: 0.01 },
    { id: 'startY', label: 'Start Y', type: 'float', defaultValue: 0.5, min: -1, max: 2, step: 0.01 },
    { id: 'endX', label: 'End X', type: 'float', defaultValue: 1, min: -1, max: 2, step: 0.01 },
    { id: 'endY', label: 'End Y', type: 'float', defaultValue: 0.5, min: -1, max: 2, step: 0.01 },
    { id: 'continuation', label: 'Continuation', type: 'option', defaultValue: 0, options: [
      { label: 'Flat', value: 0 }, { label: 'Repeat', value: 1 },
      { label: 'Mirror', value: 2 }, { label: 'Relative Repeat', value: 3 },
    ]},
  ],
  shaderId: 'gradient-free',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Palette',
  tags: ['gradient', 'free', 'linear', 'radial', 'angular'],
};

export const elevationGradientNode: NodeDefinition = {
  id: 'gradient-elevation',
  name: 'Elevation Gradient',
  category: 'generator',
  description: 'Applies a color gradient based on a grayscale elevation map.',
  inputs: [
    { id: 'elevation', label: 'Elevation', dataType: DataType.Map, required: true, hdr: true },
    { id: 'gradient', label: 'Gradient', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'flip', label: 'Flip', type: 'bool', defaultValue: false },
    { id: 'repeat', label: 'Repeat', type: 'int', defaultValue: 1, min: 1, max: 20 },
  ],
  shaderId: 'gradient-elevation',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'Mountain',
  tags: ['gradient', 'elevation', 'height', 'terrain'],
};

export const spectrumNode: NodeDefinition = {
  id: 'spectrum',
  name: 'Spectrum',
  category: 'generator',
  description: 'Full-spectrum hue gradient (all hues at full saturation).',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'angle', label: 'Angle', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
    { id: 'repeat', label: 'Repeat', type: 'int', defaultValue: 1, min: 1, max: 20 },
  ],
  shaderId: 'spectrum',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Rainbow',
  tags: ['spectrum', 'rainbow', 'hue', 'color'],
};
