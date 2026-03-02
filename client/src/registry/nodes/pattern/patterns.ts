import { DataType, NodeDefinition } from '@/types';

export const checkerNode: NodeDefinition = {
  id: 'checker',
  name: 'Checker',
  category: 'generator',
  description: 'Checkerboard pattern with configurable colors and repeat.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false, hdr: true },
  ],
  parameters: [
    { id: 'color1', label: 'Color 1', type: 'color', defaultValue: '#000000' },
    { id: 'color2', label: 'Color 2', type: 'color', defaultValue: '#ffffff' },
    { id: 'repeatH', label: 'Repeat H', type: 'int', defaultValue: 4, min: 1, max: 100 },
    { id: 'repeatV', label: 'Repeat V', type: 'int', defaultValue: 4, min: 1, max: 100 },
    { id: 'inclined', label: 'Inclined (45°)', type: 'bool', defaultValue: false },
  ],
  shaderId: 'checker',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Grid3x3',
  tags: ['checker', 'checkerboard', 'pattern', 'grid'],
};

export const bricksNode: NodeDefinition = {
  id: 'bricks',
  name: 'Bricks',
  category: 'generator',
  description: 'Brick wall pattern with configurable bond, mortar, and bevel.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'bond', label: 'Bond', type: 'option', defaultValue: 0, options: [
      { label: 'Running', value: 0 }, { label: 'Running 1/3', value: 1 },
      { label: 'Stack', value: 2 }, { label: 'English', value: 3 },
      { label: 'Herringbone', value: 4 },
    ]},
    { id: 'brickColor', label: 'Brick Color', type: 'color', defaultValue: '#b55a30' },
    { id: 'mortarColor', label: 'Mortar Color', type: 'color', defaultValue: '#c8c8c8' },
    { id: 'repeatH', label: 'Repeat H', type: 'int', defaultValue: 4, min: 1, max: 50 },
    { id: 'repeatV', label: 'Repeat V', type: 'int', defaultValue: 8, min: 1, max: 50 },
    { id: 'mortarWidth', label: 'Mortar Width', type: 'float', defaultValue: 5, min: 0, max: 50, step: 1, unit: '%', mappable: true },
    { id: 'bevelWidth', label: 'Bevel Width', type: 'float', defaultValue: 10, min: 0, max: 50, step: 1, unit: '%', mappable: true },
    { id: 'corners', label: 'Corners', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'chaos', label: 'Chaos', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'seed', label: 'Variation', type: 'int', defaultValue: 0, min: 0, max: 29999 },
  ],
  shaderId: 'bricks',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'LayoutGrid',
  tags: ['bricks', 'wall', 'pattern', 'masonry'],
};

export const tilesNode: NodeDefinition = {
  id: 'tiles',
  name: 'Tiles',
  category: 'generator',
  description: 'Square tile grid with mortar and bevel. Great for bathroom tiles, grids, halftone.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'tileColor', label: 'Tile Color', type: 'color', defaultValue: '#ffffff' },
    { id: 'mortarColor', label: 'Mortar Color', type: 'color', defaultValue: '#808080' },
    { id: 'repeatH', label: 'Repeat H', type: 'int', defaultValue: 8, min: 1, max: 100 },
    { id: 'repeatV', label: 'Repeat V', type: 'int', defaultValue: 8, min: 1, max: 100 },
    { id: 'rowShift', label: 'Row Shift', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'mortarWidth', label: 'Mortar Width', type: 'float', defaultValue: 5, min: 0, max: 50, step: 1, unit: '%', mappable: true },
    { id: 'bevelWidth', label: 'Bevel Width', type: 'float', defaultValue: 10, min: 0, max: 50, step: 1, unit: '%', mappable: true },
    { id: 'corners', label: 'Corners', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'chaos', label: 'Chaos', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'seed', label: 'Variation', type: 'int', defaultValue: 0, min: 0, max: 29999 },
  ],
  shaderId: 'tiles',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'LayoutGrid',
  tags: ['tiles', 'grid', 'pattern', 'mosaic'],
};

export const ellipseNode: NodeDefinition = {
  id: 'ellipse',
  name: 'Ellipse',
  category: 'generator',
  description: 'Generates an ellipse or circle shape with optional bevel.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'color', label: 'Color', type: 'color', defaultValue: '#ffffff' },
    { id: 'background', label: 'Background', type: 'color', defaultValue: '#000000' },
    { id: 'radiusX', label: 'Radius X', type: 'float', defaultValue: 0.4, min: 0, max: 1, step: 0.01 },
    { id: 'radiusY', label: 'Radius Y', type: 'float', defaultValue: 0.4, min: 0, max: 1, step: 0.01 },
    { id: 'centerX', label: 'Center X', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    { id: 'centerY', label: 'Center Y', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    { id: 'bevelWidth', label: 'Bevel Width', type: 'float', defaultValue: 0, min: 0, max: 50, step: 1, unit: '%' },
    { id: 'rotation', label: 'Rotation', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
  ],
  shaderId: 'ellipse',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Circle',
  tags: ['ellipse', 'circle', 'shape', 'oval'],
};

export const polygonNode: NodeDefinition = {
  id: 'polygon',
  name: 'Polygon',
  category: 'generator',
  description: 'Regular polygon (triangle, pentagon, hexagon, etc.) with bevel.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'color', label: 'Color', type: 'color', defaultValue: '#ffffff' },
    { id: 'background', label: 'Background', type: 'color', defaultValue: '#000000' },
    { id: 'vertices', label: 'Vertices', type: 'int', defaultValue: 6, min: 3, max: 32 },
    { id: 'radius', label: 'Radius', type: 'float', defaultValue: 0.4, min: 0, max: 0.5, step: 0.01 },
    { id: 'centerX', label: 'Center X', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    { id: 'centerY', label: 'Center Y', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    { id: 'bevelWidth', label: 'Bevel Width', type: 'float', defaultValue: 0, min: 0, max: 50, step: 1, unit: '%' },
    { id: 'rotation', label: 'Rotation', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
  ],
  shaderId: 'polygon',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Hexagon',
  tags: ['polygon', 'shape', 'hexagon', 'triangle', 'pentagon'],
};

export const rectangleNode: NodeDefinition = {
  id: 'rectangle',
  name: 'Rectangle',
  category: 'generator',
  description: 'Rectangle or rounded rectangle shape.',
  inputs: [],
  outputs: [
    { id: 'out', label: 'Output', dataType: DataType.Map, required: false },
  ],
  parameters: [
    { id: 'color', label: 'Color', type: 'color', defaultValue: '#ffffff' },
    { id: 'background', label: 'Background', type: 'color', defaultValue: '#000000' },
    { id: 'width', label: 'Width', type: 'float', defaultValue: 0.6, min: 0, max: 1, step: 0.01 },
    { id: 'height', label: 'Height', type: 'float', defaultValue: 0.4, min: 0, max: 1, step: 0.01 },
    { id: 'centerX', label: 'Center X', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    { id: 'centerY', label: 'Center Y', type: 'float', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    { id: 'corners', label: 'Corner Radius', type: 'float', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
    { id: 'bevelWidth', label: 'Bevel Width', type: 'float', defaultValue: 0, min: 0, max: 50, step: 1, unit: '%' },
    { id: 'rotation', label: 'Rotation', type: 'angle', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
  ],
  shaderId: 'rectangle',
  isGenerator: true,
  requiresBitmapCache: false,
  icon: 'Square',
  tags: ['rectangle', 'square', 'shape', 'box'],
};
