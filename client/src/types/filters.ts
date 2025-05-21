/**
 * Types related to filters and nodes in the application
 */

export type FilterType = 
  | 'brightness' 
  | 'contrast' 
  | 'grayscale' 
  | 'invert'
  | 'sepia'
  | 'noise'
  | 'blur'
  | 'sharpen'
  | 'hue-rotate'
  | 'saturate'
  | 'output'
  | 'image';

export type FilterParamType = 'range' | 'select' | 'color' | 'checkbox';

export interface FilterParam {
  id: string;
  name: string;
  type: FilterParamType;
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

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

export type NodeColorTag = 
  | 'default'
  | 'red'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'teal';

export interface FilterDef {
  type: FilterType;
  label: string;
  description: string;
  category: string;
  params: FilterParam[];
}

export interface ImageNodeData {
  label: string;
  type: 'imageNode';
  src: string | null;
  preview: string | null;
  width?: number;
  height?: number;
}

export interface FilterNodeData {
  label: string;
  type: FilterType;
  filter?: FilterDef;
  params?: FilterParam[];
  enabled: boolean;
  preview?: string | null;
  blendMode: BlendMode;
  opacity: number;
  colorTag: NodeColorTag;
}

export interface OutputNodeData {
  label: string;
  type: 'output';
  preview?: string | null;
}