// Core data types for the node system
export type NodeDataType = 
  | 'image'    // Image data (full RGBA)
  | 'mask'     // Alpha channel only
  | 'float'    // Single numerical value
  | 'color'    // RGBA color
  | 'vector2'  // 2D coordinates
  | 'texture'  // Pattern/texture data
  | 'boolean'  // True/false value
  | 'string'   // Text values/enumeration
  | 'blendSettings'; // Blend mode + opacity

// Parameter input/control types
export type ControlType = 
  | 'slider'    // Range slider with min/max
  | 'dropdown'  // Select from options
  | 'toggle'    // Boolean on/off
  | 'color'     // Color picker
  | 'vector'    // X/Y coordinate control
  | 'image'     // Image selection/upload
  | 'texture';  // Texture selection/generation

// Parameter metadata
export interface NodeParameter {
  id: string;            // Unique identifier
  name: string;          // Display name 
  type: NodeDataType;    // Data type this parameter accepts/outputs
  controlType: ControlType; // UI control type
  value: any;            // Current value
  defaultValue: any;     // Default fallback value
  min?: number;          // For numerical controls
  max?: number;          // For numerical controls
  step?: number;         // For numerical controls
  options?: string[];    // For dropdown controls
  unit?: string;         // Optional unit label
  sourceNodeId?: string; // ID of node providing input to this parameter
  sourceParameterId?: string; // ID of parameter providing input
  disabled?: boolean;    // Whether control is disabled (when connected)
}

// Port definition for node connections
export interface NodePort {
  id: string;            // Unique identifier
  type: NodeDataType;    // Data type this port accepts/outputs
  label?: string;        // Optional label
  multiple?: boolean;    // Can connect to multiple targets
  required?: boolean;    // Is this connection required
  connected?: boolean;   // Is this port connected
}

// NodeStore interface
export interface NodeStore {
  id: string;
  type: string;          // Node type identifier
  label: string;         // Display name
  position: {            // Position in the canvas
    x: number;
    y: number;
  };
  enabled: boolean;      // Whether node is active
  collapsed: boolean;    // Whether UI is minimized
  colorTag?: string;     // User-selected color tag
  preview?: string;      // Preview image data URL
  parameters: NodeParameter[]; // Node parameters (settings)
  inputs: NodePort[];    // Input connection ports
  outputs: NodePort[];   // Output connection ports
  data?: any;            // Extra node-specific data
  inputConnections?: Record<string, boolean>; // Tracks which input ports are connected
  outputConnections?: Record<string, boolean>; // Tracks which output ports are connected
}

// Connection between nodes
export interface NodeConnection {
  id: string;
  sourceNodeId: string;  // Source node 
  sourcePortId: string;  // Source port or parameter
  targetNodeId: string;  // Target node
  targetPortId: string;  // Target port or parameter
  type: NodeDataType;    // Data type being transmitted
}

// Basic node categories
export enum NodeCategory {
  Generator = 'generator',
  Filter = 'filter',
  Compositing = 'compositing',
  Adjustment = 'adjustment',
  Output = 'output'
}

// Node parameter without runtime-specific fields
export type NodeParameterTemplate = Omit<NodeParameter, 'sourceNodeId' | 'sourceParameterId'>;

// Node definition (template)
export interface NodeDefinition {
  id: string;            // Type identifier
  name: string;          // Display name
  category: NodeCategory;
  description?: string;  // Help text
  defaultColorTag: string; // Default color
  defaultCollapsed: boolean; // Start collapsed?
  inputs: NodePort[];    // Default input ports
  outputs: NodePort[];   // Default output ports
  parameters: NodeParameterTemplate[]; // Parameter templates
  process?: (node: NodeStore, inputData: Record<string, any>) => Record<string, any>; // Processing function
  validate?: (node: NodeStore) => string | null; // Validation function
}

// Node registry - stores all available node types
export interface NodeRegistry {
  [key: string]: NodeDefinition;
}