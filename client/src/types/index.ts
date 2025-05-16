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
  | 'halftone';

export type NodeType = 'filterNode' | 'imageNode' | 'outputNode';

export type ParamType = 'float' | 'integer' | 'color' | 'image' | 'mask' | 'texture' | 'boolean' | 'vector2' | 'option';

export type FilterParam = {
  id: string;
  name: string;
  label: string;
  controlType: 'range' | 'select' | 'color' | 'checkbox';
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
  filterType: FilterType;
  params: FilterParam[];
  enabled: boolean;
  preview?: string | null; // Preview image data URL
  colorTag: NodeColorTag;
  blendMode: BlendMode;
  opacity: number; // 0-100
  collapsed?: boolean;
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
  src: string | null;
  onUploadImage?: (file: File) => void;
};

export type OutputNodeData = {
  /** thumbnail of this node's output */
  preview?: string | null;
  /** only one outputNode may be "live" at a time */
  isActive: boolean;
};

export type NodeData = FilterNodeData | ImageNodeData | OutputNodeData;
