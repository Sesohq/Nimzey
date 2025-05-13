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
  | 'blend'
  | 'motionBlur'
  | 'noiseDistortion'
  | 'refraction';

export type NodeType = 'filterNode' | 'imageNode';

export type FilterParam = {
  name: string;
  label: string;
  type: 'range' | 'select';
  min?: number;
  max?: number;
  step?: number;
  value: number | string;
  unit?: string;
  options?: string[];
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

export type BlendMode = 
  | 'normal' 
  | 'multiply' 
  | 'screen' 
  | 'overlay' 
  | 'darken' 
  | 'lighten' 
  | 'color-dodge' 
  | 'color-burn' 
  | 'hard-light' 
  | 'soft-light' 
  | 'difference' 
  | 'exclusion' 
  | 'hue' 
  | 'saturation' 
  | 'color' 
  | 'luminosity';

export type FilterNodeData = {
  label: string;
  filterType: FilterType;
  params: FilterParam[];
  enabled: boolean;
  blendMode: BlendMode;
  opacity: number;
  id?: string; // Optional ID that can be used in component props
  onParamChange?: (nodeId: string, paramName: string, value: number | string) => void;
  onToggleEnabled?: (nodeId: string, enabled: boolean) => void;
  onBlendModeChange?: (nodeId: string, blendMode: BlendMode) => void;
  onOpacityChange?: (nodeId: string, opacity: number) => void;
  onRemoveNode?: () => void; // Function to remove a node
};

export type ImageNodeData = {
  src: string | null;
  onUploadImage?: (file: File) => void;
};

export type NodeData = FilterNodeData | ImageNodeData;
