// ============================================================================
// Nimzey Core Type System
// Filter Forge-class node-based image editor
// ============================================================================

import { Node, Edge } from 'reactflow';

// ---------------------------------------------------------------------------
// Data Types - The three fundamental types that flow through connections
// ---------------------------------------------------------------------------

export enum DataType {
  /** RGBA image data (green connections) */
  Map = 'map',
  /** 1D transfer function curves (blue connections) */
  Curve = 'curve',
  /** Scalar numeric values (gray connections, universally connectable) */
  Numeric = 'numeric',
}

/** Visual colors for each data type in the UI */
export const DATA_TYPE_COLORS: Record<DataType, string> = {
  [DataType.Map]: '#22c55e',     // green-500
  [DataType.Curve]: '#3b82f6',   // blue-500
  [DataType.Numeric]: '#9ca3af', // gray-400
};

// ---------------------------------------------------------------------------
// Port Definitions - Typed inputs and outputs on nodes
// ---------------------------------------------------------------------------

export interface PortDefinition {
  id: string;
  label: string;
  dataType: DataType;
  required: boolean;
  /** Default value when unconnected. Maps default to transparent black, Numerics to 0, Curves to identity. */
  defaultValue?: number | number[] | string | null;
  /** If true, this port supports HDR values (float range beyond 0-1) */
  hdr?: boolean;
}

// ---------------------------------------------------------------------------
// Parameter Definitions - User-editable controls on nodes
// ---------------------------------------------------------------------------

export type ParameterType =
  | 'float'
  | 'int'
  | 'bool'
  | 'color'
  | 'hdrColor'
  | 'option'
  | 'angle'
  | 'curve'
  | 'vec2';

export interface ParameterDefinition {
  id: string;
  label: string;
  type: ParameterType;
  defaultValue: number | string | boolean | number[];
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
  unit?: string;
  /**
   * If true, this parameter can accept a Map input for per-pixel variation.
   * When connected, the parameter value becomes spatially varying.
   */
  mappable?: boolean;
  /** Group label for organizing parameters in the UI */
  group?: string;
}

// ---------------------------------------------------------------------------
// Node Definition - Declarative definition of a node type
// ---------------------------------------------------------------------------

export type NodeCategory =
  | 'noise'
  | 'gradient'
  | 'pattern'
  | 'processing'
  | 'adjustment'
  | 'channel'
  | 'math'
  | 'transform'
  | 'curve-generator'
  | 'curve-operation'
  | 'external'
  | 'control'
  | 'advanced'
  | 'special';

export const NODE_CATEGORY_LABELS: Record<NodeCategory, string> = {
  noise: 'Noise Generators',
  gradient: 'Gradients',
  pattern: 'Patterns',
  processing: 'Processing',
  adjustment: 'Adjustments',
  channel: 'Channels',
  math: 'RGB Math',
  transform: 'Transforms',
  'curve-generator': 'Curve Generators',
  'curve-operation': 'Curve Operations',
  external: 'External',
  control: 'Controls',
  advanced: 'Advanced',
  special: 'Special',
};

export const NODE_CATEGORY_ICONS: Record<NodeCategory, string> = {
  noise: 'Waves',
  gradient: 'Palette',
  pattern: 'Grid3x3',
  processing: 'Layers',
  adjustment: 'SlidersHorizontal',
  channel: 'SplitSquareHorizontal',
  math: 'Calculator',
  transform: 'Move',
  'curve-generator': 'Spline',
  'curve-operation': 'GitBranch',
  external: 'Image',
  control: 'Settings',
  advanced: 'Cpu',
  special: 'Star',
};

export interface NodeDefinition {
  /** Unique identifier, e.g. 'perlin-noise', 'blend', 'brightness-contrast' */
  id: string;
  /** Display name */
  name: string;
  /** Category for palette organization */
  category: NodeCategory;
  /** Short description for tooltip/help */
  description: string;
  /** Typed input ports */
  inputs: PortDefinition[];
  /** Typed output ports */
  outputs: PortDefinition[];
  /** User-editable parameters */
  parameters: ParameterDefinition[];
  /** Key into shader library (matches ShaderDefinition.id) */
  shaderId: string;
  /** True = generates content without required Map input (Texture class) */
  isGenerator: boolean;
  /** True = needs neighborhood sampling (blur, edge detect, etc.) - prevents shader fusion */
  requiresBitmapCache: boolean;
  /** Lucide icon name for the palette */
  icon?: string;
  /** Keywords for search */
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Graph State Types - Runtime node/edge instances
// ---------------------------------------------------------------------------

export interface GraphNode {
  id: string;
  /** References a NodeDefinition.id in the registry */
  definitionId: string;
  position: { x: number; y: number };
  /** Current parameter values, keyed by ParameterDefinition.id */
  parameters: Record<string, number | string | boolean | number[]>;
  enabled: boolean;
  collapsed: boolean;
  /** Color tag for visual organization */
  colorTag: NodeColorTag;
  /** Cached preview image data URL */
  preview?: string | null;
  /** For image/external nodes: loaded image URL */
  imageUrl?: string;
  /** Image dimensions if applicable */
  width?: number;
  height?: number;
}

export interface GraphEdge {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  dataType: DataType;
}

// ---------------------------------------------------------------------------
// Blend Modes - All 19 Filter Forge modes
// ---------------------------------------------------------------------------

export type BlendMode =
  | 'normal'
  | 'darken'
  | 'multiply'
  | 'color-burn'
  | 'linear-burn'
  | 'lighten'
  | 'screen'
  | 'color-dodge'
  | 'linear-dodge'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'vivid-light'
  | 'linear-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export const BLEND_MODE_LABELS: Record<BlendMode, string> = {
  'normal': 'Normal',
  'darken': 'Darken',
  'multiply': 'Multiply',
  'color-burn': 'Color Burn',
  'linear-burn': 'Linear Burn',
  'lighten': 'Lighten',
  'screen': 'Screen',
  'color-dodge': 'Color Dodge',
  'linear-dodge': 'Linear Dodge',
  'overlay': 'Overlay',
  'soft-light': 'Soft Light',
  'hard-light': 'Hard Light',
  'vivid-light': 'Vivid Light',
  'linear-light': 'Linear Light',
  'difference': 'Difference',
  'exclusion': 'Exclusion',
  'hue': 'Hue',
  'saturation': 'Saturation',
  'color': 'Color',
  'luminosity': 'Luminosity',
};

// ---------------------------------------------------------------------------
// UI Types
// ---------------------------------------------------------------------------

export type NodeColorTag = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export const NODE_COLOR_TAG_COLORS: Record<NodeColorTag, string> = {
  default: '#374151',   // gray-700
  red: '#ef4444',       // red-500
  orange: '#f97316',    // orange-500
  yellow: '#eab308',    // yellow-500
  green: '#22c55e',     // green-500
  blue: '#3b82f6',      // blue-500
  purple: '#a855f7',    // purple-500
  pink: '#ec4899',      // pink-500
};

export type QualityLevel = 'preview' | 'draft' | 'full';

// ---------------------------------------------------------------------------
// Render Pipeline Types
// ---------------------------------------------------------------------------

export interface UniformDefinition {
  name: string;
  type: 'float' | 'int' | 'bool' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'sampler2D';
}

export interface PassDefinition {
  /** Fragment shader GLSL for this pass */
  glsl: string;
  /** Extra uniforms needed only for this pass */
  uniforms?: UniformDefinition[];
  /** Description for debugging */
  label?: string;
}

export interface ExecutionStep {
  /** Unique step ID */
  id: string;
  /** Shader program cache key */
  programId: string;
  /** GLSL fragment source */
  fragmentSource: string;
  /** Input texture references (from texture pool) */
  inputTextures: string[];
  /** Output texture reference (into texture pool) */
  outputTexture: string;
  /** Uniform values to set */
  uniforms: Record<string, number | number[] | boolean | string>;
  /** Viewport dimensions */
  viewport: { width: number; height: number };
  /** Source node ID for debugging */
  sourceNodeId?: string;
}

export type ExecutionPlan = ExecutionStep[];

// ---------------------------------------------------------------------------
// Managed Texture (for TexturePool)
// ---------------------------------------------------------------------------

export interface ManagedTexture {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
  format: 'uint8' | 'float16' | 'float32';
  inUse: boolean;
}

// ---------------------------------------------------------------------------
// Curve Types
// ---------------------------------------------------------------------------

export interface CurvePoint {
  x: number;
  y: number;
  /** Bezier control point for the left handle */
  handleLeft?: { x: number; y: number };
  /** Bezier control point for the right handle */
  handleRight?: { x: number; y: number };
}

export interface CurveData {
  points: CurvePoint[];
  interpolation: 'linear' | 'bezier' | 'step';
  /** Computed lookup table (256 or 1024 entries) */
  lut?: Float32Array;
}

// ---------------------------------------------------------------------------
// Legacy Compatibility Types (will be removed after migration)
// ---------------------------------------------------------------------------

/** @deprecated Use NodeDefinition instead */
export type FilterType =
  | 'blur' | 'sharpen' | 'grayscale' | 'invert' | 'noise' | 'dither'
  | 'texture' | 'extrude' | 'wave' | 'pixelate' | 'findEdges' | 'glow'
  | 'halftone' | 'image' | 'perlinNoise' | 'checkerboard' | 'mask'
  | 'gradientOverlay';

/** @deprecated Use ParameterType instead */
export type ParamType = 'float' | 'integer' | 'color' | 'image' | 'mask' | 'texture' | 'boolean' | 'vector2' | 'option';

/** @deprecated Use ParameterDefinition instead */
export type FilterParam = {
  id: string;
  name: string;
  label: string;
  controlType: 'range' | 'select' | 'color' | 'checkbox' | 'hidden';
  paramType: ParamType;
  min?: number;
  max?: number;
  step?: number;
  value: number | string | boolean;
  unit?: string;
  options?: string[];
  isConnected?: boolean;
  sourceNodeId?: string;
  sourceParamId?: string;
};

/** @deprecated Use NodeDefinition instead */
export type Filter = {
  name: string;
  type: FilterType;
  params: FilterParam[];
};

/** @deprecated */
export type FilterCategory = {
  name: string;
  filters: Filter[];
};

/** @deprecated Use NimzeyNodeData instead */
export type FilterNodeData = {
  label: string;
  filter?: { type: FilterType; params: FilterParam[] };
  filterType?: FilterType;
  params?: FilterParam[];
  enabled: boolean;
  preview?: string | null;
  colorTag: NodeColorTag;
  blendMode: BlendMode;
  opacity: number;
  collapsed?: boolean;
  imageUrl?: string;
  width?: number;
  height?: number;
  paramConnections?: { [paramId: string]: { sourceNodeId: string; sourceParamId: string } };
  onParamChange?: (nodeId: string, paramId: string, value: number | string | boolean) => void;
  onToggleEnabled?: (nodeId: string, enabled: boolean) => void;
  onChangeBlendMode?: (nodeId: string, blendMode: BlendMode) => void;
  onChangeOpacity?: (nodeId: string, opacity: number) => void;
  onChangeColorTag?: (nodeId: string, color: NodeColorTag) => void;
  onToggleCollapsed?: (nodeId: string, collapsed: boolean) => void;
  onConnectParam?: (nodeId: string, paramId: string, sourceNodeId: string, sourceParamId: string) => void;
  onDisconnectParam?: (nodeId: string, paramId: string) => void;
};

/** @deprecated */
export type ImageNodeData = {
  label?: string;
  src: string | null;
  imageUrl?: string;
  preview?: string | null;
  width?: number;
  height?: number;
  enabled?: boolean;
  onUploadImage?: (file: File) => void;
  texturePixels?: ImageData;
};

/** @deprecated */
export type OutputNodeData = {
  preview: string | null;
  isActive: boolean;
};

/** @deprecated */
export type NodeData = FilterNodeData | ImageNodeData | OutputNodeData;

// New unified node data for ReactFlow
export interface NimzeyNodeData {
  /** References a NodeDefinition.id */
  definitionId: string;
  /** Current parameter values */
  parameters: Record<string, number | string | boolean | number[]>;
  enabled: boolean;
  collapsed: boolean;
  colorTag: NodeColorTag;
  /** Preview image data URL */
  preview?: string | null;
  /** For image/external nodes: loaded image URL */
  imageUrl?: string;
  /** Image dimensions if applicable */
  width?: number;
  height?: number;
}

// Global declarations
declare global {
  interface Window {
    uploadNodeImage?: (nodeId: string, file: File) => void;
  }
}
