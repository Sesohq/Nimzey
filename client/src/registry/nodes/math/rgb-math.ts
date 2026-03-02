import { DataType, NodeDefinition } from '@/types';

function mathNode(id: string, name: string, description: string, icon: string, tags: string[], extraParams: NodeDefinition['parameters'] = []): NodeDefinition {
  return {
    id,
    name,
    category: 'math',
    description,
    inputs: [
      { id: 'a', label: 'Source A', dataType: DataType.Map, required: true, hdr: true },
      { id: 'b', label: 'Source B', dataType: DataType.Map, required: true, hdr: true },
    ],
    outputs: [
      { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
    ],
    parameters: extraParams,
    shaderId: id,
    isGenerator: false,
    requiresBitmapCache: false,
    icon,
    tags,
  };
}

function unaryMathNode(id: string, name: string, description: string, icon: string, tags: string[], extraParams: NodeDefinition['parameters'] = []): NodeDefinition {
  return {
    id,
    name,
    category: 'math',
    description,
    inputs: [
      { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
    ],
    outputs: [
      { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
    ],
    parameters: extraParams,
    shaderId: id,
    isGenerator: false,
    requiresBitmapCache: false,
    icon,
    tags,
  };
}

// Arithmetic
export const addNode = mathNode('math-add', 'Add', 'Adds two images per-channel: A + B.', 'Plus', ['add', 'sum', 'plus']);
export const subtractNode = mathNode('math-subtract', 'Subtract', 'Subtracts per-channel: A - B.', 'Minus', ['subtract', 'minus', 'difference']);
export const multiplyNode = mathNode('math-multiply', 'Multiply', 'Multiplies per-channel: A * B.', 'X', ['multiply', 'times', 'product']);
export const divideNode: NodeDefinition = {
  ...mathNode('math-divide', 'Divide', 'Divides per-channel: A / B. Returns error color on division by zero.', 'Divide', ['divide', 'quotient']),
  inputs: [
    { id: 'dividend', label: 'Dividend', dataType: DataType.Map, required: true, hdr: true },
    { id: 'divisor', label: 'Divisor', dataType: DataType.Map, required: true, hdr: true },
    { id: 'error', label: 'Error', dataType: DataType.Map, required: false, hdr: true },
  ],
};
export const moduloNode: NodeDefinition = {
  ...mathNode('math-modulo', 'Modulo', 'Modulo per-channel: A % B.', 'Percent', ['modulo', 'remainder', 'mod']),
  inputs: [
    { id: 'dividend', label: 'Dividend', dataType: DataType.Map, required: true, hdr: true },
    { id: 'divisor', label: 'Divisor', dataType: DataType.Map, required: true, hdr: true },
    { id: 'error', label: 'Error', dataType: DataType.Map, required: false, hdr: true },
  ],
};

// Unary
export const negateNode = unaryMathNode('math-negate', 'Negate', 'Negates per-channel: -A.', 'Minus', ['negate', 'flip', 'negative']);
export const absNode = unaryMathNode('math-abs', 'Abs', 'Absolute value per-channel: |A|.', 'ArrowUpDown', ['abs', 'absolute']);

// Power / Root / Log
export const powerNode: NodeDefinition = {
  ...mathNode('math-power', 'Power', 'Raises base to exponent per-channel: Base^Exp.', 'Zap', ['power', 'exponent', 'pow']),
  inputs: [
    { id: 'base', label: 'Base', dataType: DataType.Map, required: true, hdr: true },
    { id: 'exponent', label: 'Exponent', dataType: DataType.Map, required: true, hdr: true },
    { id: 'error', label: 'Error', dataType: DataType.Map, required: false, hdr: true },
  ],
};

// Comparison / Selection
export const minNode = mathNode('math-min', 'Min', 'Minimum of two images per-channel.', 'ArrowDown', ['min', 'minimum', 'darker']);
export const maxNode = mathNode('math-max', 'Max', 'Maximum of two images per-channel.', 'ArrowUp', ['max', 'maximum', 'lighter']);

export const lerpNode: NodeDefinition = {
  id: 'math-lerp',
  name: 'Lerp',
  category: 'blender',
  description: 'Linear interpolation between A and B: mix(A, B, factor).',
  inputs: [
    { id: 'a', label: 'Source A', dataType: DataType.Map, required: true, hdr: true },
    { id: 'b', label: 'Source B', dataType: DataType.Map, required: true, hdr: true },
    { id: 'factor', label: 'Factor', dataType: DataType.Map, required: false },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'factor', label: 'Factor', type: 'float', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%', mappable: true },
  ],
  shaderId: 'math-lerp',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'GitBranch',
  tags: ['lerp', 'interpolate', 'mix', 'blend'],
};

export const ifNode: NodeDefinition = {
  id: 'math-if',
  name: 'If',
  category: 'math',
  description: 'Conditional select: if A op B then Then else Else, per-channel.',
  inputs: [
    { id: 'a', label: 'Source A', dataType: DataType.Map, required: true, hdr: true },
    { id: 'b', label: 'Source B', dataType: DataType.Map, required: true, hdr: true },
    { id: 'then', label: 'Then', dataType: DataType.Map, required: true, hdr: true },
    { id: 'else', label: 'Else', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'operation', label: 'Operation', type: 'option', defaultValue: 0, options: [
      { label: 'A < B', value: 0 }, { label: 'A > B', value: 1 },
      { label: 'A <= B', value: 2 }, { label: 'A >= B', value: 3 },
      { label: 'A == B', value: 4 }, { label: 'A != B', value: 5 },
    ]},
  ],
  shaderId: 'math-if',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'GitBranch',
  tags: ['if', 'conditional', 'compare', 'select'],
};

export const remapRangeNode: NodeDefinition = {
  id: 'math-remap-range',
  name: 'Remap Range',
  category: 'math',
  description: 'Linear remapping from source range to output range.',
  inputs: [
    { id: 'source', label: 'Source', dataType: DataType.Map, required: true, hdr: true },
  ],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'srcMin', label: 'Source Min', type: 'float', defaultValue: 0, min: -10, max: 10, step: 0.01 },
    { id: 'srcMax', label: 'Source Max', type: 'float', defaultValue: 1, min: -10, max: 10, step: 0.01 },
    { id: 'outMin', label: 'Output Min', type: 'float', defaultValue: 0, min: -10, max: 10, step: 0.01 },
    { id: 'outMax', label: 'Output Max', type: 'float', defaultValue: 1, min: -10, max: 10, step: 0.01 },
    { id: 'clamp', label: 'Clamp', type: 'bool', defaultValue: true },
  ],
  shaderId: 'math-remap-range',
  isGenerator: false,
  requiresBitmapCache: false,
  icon: 'ArrowLeftRight',
  tags: ['remap', 'range', 'normalize', 'map'],
};

// Rounding
export const floorNode = unaryMathNode('math-floor', 'Floor', 'Rounds down per-channel.', 'ArrowDown', ['floor', 'round-down']);
export const ceilNode = unaryMathNode('math-ceil', 'Ceil', 'Rounds up per-channel.', 'ArrowUp', ['ceil', 'round-up']);
export const roundNode = unaryMathNode('math-round', 'Round', 'Rounds to nearest per-channel.', 'Circle', ['round', 'nearest']);

// Trigonometric
function trigNode(id: string, name: string, func: string): NodeDefinition {
  return {
    ...unaryMathNode(id, name, `${func} per-channel.`, 'Calculator', [func.toLowerCase(), 'trig']),
    parameters: [
      { id: 'units', label: 'Units', type: 'option', defaultValue: 0, options: [
        { label: 'Degrees', value: 0 }, { label: 'Radians', value: 1 }, { label: 'Rotations', value: 2 },
      ]},
    ],
  };
}

export const sineNode = trigNode('math-sine', 'Sine', 'sin(x)');
export const cosineNode = trigNode('math-cosine', 'Cosine', 'cos(x)');
export const tangentNode = trigNode('math-tangent', 'Tangent', 'tan(x)');
export const arcsineNode = trigNode('math-arcsine', 'ArcSine', 'asin(x)');
export const arccosineNode = trigNode('math-arccosine', 'ArcCosine', 'acos(x)');
export const arctangentNode = trigNode('math-arctangent', 'ArcTangent', 'atan(x)');
