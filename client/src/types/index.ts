import { Node } from 'reactflow';

export type FilterType = 
  | 'blur' 
  | 'sharpen' 
  | 'grayscale' 
  | 'invert' 
  | 'noise' 
  | 'dither' 
  | 'texture' 
  | 'extrude' 
  | 'wave' 
  | 'pixelate'
  | 'findEdges'
  | 'glow'
  | 'halftone'
  | 'image'
  | 'perlinNoise'
  | 'checkerboard'
  | 'mask';

export type NodeType = 'filterNode' | 'imageNode' | 'outputNode' | 'generatorNode';

export type ParamType = 'float' | 'integer' | 'color' | 'image' | 'mask' | 'texture' | 'boolean' | 'vector2' | 'option';

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

export type Filter = {
  name: string;
  type: FilterType;
  params: FilterParam[];
};

export type FilterCategory = {
  name: string;
  filters: Filter[];
};

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';

export type NodeColorTag = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export type FilterNodeData = {
  label: string;
  filter?: {
    type: FilterType;
    params: FilterParam[];
  };
  filterType?: FilterType; // For backward compatibility
  params?: FilterParam[]; // For backward compatibility
  enabled: boolean;
  preview?: string | null; // Preview image data URL
  colorTag: NodeColorTag;
  blendMode: BlendMode;
  opacity: number; // 0-100
  collapsed?: boolean;
  imageUrl?: string; // For image filter nodes that have an embedded image
  width?: number; // Image width
  height?: number; // Image height
  // Parameter connections
  paramConnections?: {
    [paramId: string]: {
      sourceNodeId: string;
      sourceParamId: string;
    }
  };
  // Callbacks
  onParamChange?: (nodeId: string, paramId: string, value: number | string | boolean) => void;
  onToggleEnabled?: (nodeId: string, enabled: boolean) => void;
  onChangeBlendMode?: (nodeId: string, blendMode: BlendMode) => void;
  onChangeOpacity?: (nodeId: string, opacity: number) => void;
  onChangeColorTag?: (nodeId: string, color: NodeColorTag) => void;
  onToggleCollapsed?: (nodeId: string, collapsed: boolean) => void;
  onConnectParam?: (nodeId: string, paramId: string, sourceNodeId: string, sourceParamId: string) => void;
  onDisconnectParam?: (nodeId: string, paramId: string) => void;
};

export type ImageNodeData = {
  label?: string; // Adding label for UI consistency
  src: string | null;
  imageUrl?: string; // URL for the image source
  preview?: string | null; // Preview of the image for UI
  width?: number; // Image width
  height?: number; // Image height
  enabled?: boolean; // Whether the node is enabled
  onUploadImage?: (file: File) => void;
  texturePixels?: ImageData; // Field for storing preloaded image data
  colorTag?: NodeColorTag; // Color tag for organization
  collapsed?: boolean; // Whether the node is collapsed
};

export type OutputNodeData = {
  preview: string | null;
  isActive: boolean;
};

export type NodeData = FilterNodeData | ImageNodeData | OutputNodeData;

// Global declarations
declare global {
  interface Window {
    uploadNodeImage?: (nodeId: string, file: File) => void;
  }
}
