import React, { useCallback, useMemo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  NodeStore, 
  NodeParameter,
  NodeDataType, 
  NodePort
} from '@shared/nodeTypes';
import { getTypeColor } from '../lib/nodeEngine';

// Helper for getting type color
const getTypeColorClass = (type: NodeDataType): string => {
  switch (type) {
    case 'image':
      return 'bg-blue-500';
    case 'mask':
      return 'bg-purple-500';
    case 'float':
      return 'bg-green-500';
    case 'color':
      return 'bg-yellow-500';
    case 'vector2':
      return 'bg-orange-500';
    case 'texture':
      return 'bg-indigo-500';
    case 'boolean':
      return 'bg-red-500';
    case 'string':
      return 'bg-gray-500';
    case 'blendSettings':
      return 'bg-pink-500';
    default:
      return 'bg-gray-400';
  }
};

// Handle component for input/output ports
interface HandleProps extends React.HTMLAttributes<HTMLDivElement> {
  type: 'source' | 'target';
  position: Position;
  id: string;
  dataType: NodeDataType;
  label?: string;
  isConnected?: boolean;
  isConnectable?: boolean;
}

const TypedHandle: React.FC<HandleProps> = ({ 
  type, 
  position, 
  id, 
  dataType, 
  label, 
  isConnected, 
  isConnectable = true
}) => {
  const colorClass = getTypeColorClass(dataType);
  const bgClass = isConnected ? colorClass : 'bg-white hover:bg-gray-200';
  const borderClass = isConnected ? `border-2 border-white` : `border-2 ${colorClass}`;
  
  return (
    <div className="group relative">
      <Handle
        type={type}
        position={position}
        id={id}
        isConnectable={isConnectable}
        className={`w-3 h-3 rounded-full ${bgClass} ${borderClass} transition-all`}
        style={{ zIndex: 1 }}
      />
      {label && (
        <span 
          className={`
            absolute ${type === 'source' ? 'right-3' : 'left-3'} top-0
            opacity-0 group-hover:opacity-100 transition-opacity 
            text-xs bg-gray-800 text-white px-1 rounded whitespace-nowrap
          `}
          style={{ transform: 'translateY(-50%)' }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

// Parameter input component for node settings
interface ParameterInputProps {
  parameter: NodeParameter;
  nodeId: string;
  onParameterChange: (parameterId: string, value: any) => void;
  inputConnections: Record<string, boolean>;
}

const ParameterInput: React.FC<ParameterInputProps> = ({ 
  parameter, 
  nodeId, 
  onParameterChange,
  inputConnections 
}) => {
  const isConnected = inputConnections[parameter.id];
  
  const handleChange = (value: any) => {
    if (!isConnected) {
      onParameterChange(parameter.id, value);
    }
  };
  
  // Render different control types based on parameter controlType
  switch (parameter.controlType) {
    case 'slider':
      return (
        <div className="flex items-center w-full gap-2">
          <input
            type="range"
            min={parameter.min || 0}
            max={parameter.max || 100}
            step={parameter.step || 1}
            value={parameter.value}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            disabled={isConnected}
            className={`flex-1 h-1.5 bg-gray-200 rounded-full appearance-none ${
              isConnected ? 'opacity-50' : ''
            }`}
          />
          <span className="text-xs font-mono min-w-[30px] text-right">
            {parameter.value}
            {parameter.unit && <span className="text-gray-500">{parameter.unit}</span>}
          </span>
        </div>
      );
      
    case 'dropdown':
      return (
        <select
          value={parameter.value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isConnected}
          className={`w-full text-xs border rounded px-1 py-1 ${
            isConnected ? 'opacity-50 bg-gray-100' : 'bg-white'
          }`}
        >
          {parameter.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
      
    case 'toggle':
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={parameter.value === true}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={isConnected}
            className={isConnected ? 'opacity-50' : ''}
          />
          <span className="text-xs">{parameter.value ? 'On' : 'Off'}</span>
        </label>
      );
      
    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={parameter.value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isConnected}
            className={`w-6 h-6 rounded border ${isConnected ? 'opacity-50' : ''}`}
          />
          <span className="text-xs font-mono">{parameter.value}</span>
        </div>
      );
      
    case 'vector':
      const vectorValue = parameter.value || { x: 0, y: 0 };
      return (
        <div className="grid grid-cols-2 gap-1">
          <div className="flex items-center gap-1">
            <span className="text-xs">X:</span>
            <input
              type="number"
              value={vectorValue.x}
              onChange={(e) => handleChange({ ...vectorValue, x: parseFloat(e.target.value) })}
              disabled={isConnected}
              className={`w-full text-xs p-1 border rounded ${isConnected ? 'opacity-50 bg-gray-100' : ''}`}
              step={parameter.step || 1}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs">Y:</span>
            <input
              type="number"
              value={vectorValue.y}
              onChange={(e) => handleChange({ ...vectorValue, y: parseFloat(e.target.value) })}
              disabled={isConnected}
              className={`w-full text-xs p-1 border rounded ${isConnected ? 'opacity-50 bg-gray-100' : ''}`}
              step={parameter.step || 1}
            />
          </div>
        </div>
      );
      
    case 'image':
      return (
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              // Open file picker and update parameter
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    handleChange(event.target?.result);
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
            disabled={isConnected}
            className={`text-xs px-2 py-1 bg-gray-100 rounded border ${
              isConnected ? 'opacity-50' : 'hover:bg-gray-200'
            }`}
          >
            {parameter.value ? 'Change Image' : 'Select Image'}
          </button>
          {parameter.value && (
            <div className="h-12 bg-gray-100 rounded overflow-hidden">
              <img
                src={parameter.value}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
      );
      
    default:
      return (
        <input
          type="text"
          value={parameter.value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isConnected}
          className={`w-full text-xs p-1 border rounded ${
            isConnected ? 'opacity-50 bg-gray-100' : ''
          }`}
        />
      );
  }
};

// Props for BaseNode component
export interface BaseNodeProps extends NodeProps<NodeStore> {
  onNodeToggle?: (nodeId: string, enabled: boolean) => void;
  onNodeCollapse?: (nodeId: string, collapsed: boolean) => void;
  onColorTagChange?: (nodeId: string, color: string) => void;
  onParameterChange?: (nodeId: string, parameterId: string, value: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  inputConnections?: Record<string, boolean>;
  outputConnections?: Record<string, boolean>;
}

// Main BaseNode component
const BaseNode: React.FC<BaseNodeProps> = ({
  id,
  data,
  selected,
  onNodeToggle,
  onNodeCollapse,
  onColorTagChange,
  onParameterChange,
  onDeleteNode
}) => {
  const { 
    label, 
    enabled, 
    collapsed, 
    colorTag, 
    parameters, 
    inputs, 
    outputs,
    type: nodeType,
    inputConnections = {},
    outputConnections = {}
  } = data;
  
  const handleToggle = useCallback(() => {
    if (onNodeToggle) {
      onNodeToggle(id, !enabled);
    }
  }, [id, enabled, onNodeToggle]);
  
  const handleCollapse = useCallback(() => {
    if (onNodeCollapse) {
      onNodeCollapse(id, !collapsed);
    }
  }, [id, collapsed, onNodeCollapse]);
  
  const handleColorChange = useCallback((color: string) => {
    if (onColorTagChange) {
      onColorTagChange(id, color);
    }
  }, [id, onColorTagChange]);
  
  const handleParameterChange = useCallback((parameterId: string, value: any) => {
    if (onParameterChange) {
      onParameterChange(id, parameterId, value);
    }
  }, [id, onParameterChange]);
  
  const handleDelete = useCallback(() => {
    if (onDeleteNode) {
      onDeleteNode(id);
    }
  }, [id, onDeleteNode]);
  
  // Available color tags
  const colorOptions = [
    { color: 'blue', class: 'bg-blue-500' },
    { color: 'green', class: 'bg-green-500' },
    { color: 'red', class: 'bg-red-500' },
    { color: 'yellow', class: 'bg-yellow-500' },
    { color: 'purple', class: 'bg-purple-500' },
    { color: 'indigo', class: 'bg-indigo-500' },
    { color: 'pink', class: 'bg-pink-500' },
    { color: 'gray', class: 'bg-gray-500' },
  ];
  
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Determine header color
  const headerColor = useMemo(() => {
    if (colorTag) {
      const option = colorOptions.find(opt => opt.color === colorTag);
      if (option) return option.class;
    }
    
    // Default color based on node type
    switch (nodeType.split('-')[0]) {
      case 'generator': return 'bg-blue-500';
      case 'filter': return 'bg-green-500';
      case 'compositing': return 'bg-orange-500';
      case 'adjustment': return 'bg-yellow-500';
      case 'output': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  }, [colorTag, nodeType, colorOptions]);
  
  return (
    <div 
      className={`
        rounded-md overflow-hidden shadow-md min-w-[200px] max-w-[280px] bg-white border
        ${selected ? 'ring-2 ring-blue-400' : ''}
        ${!enabled ? 'opacity-60' : ''}
      `}
    >
      {/* Header */}
      <div className={`${headerColor} text-white p-2 flex items-center justify-between`}>
        <span className="text-xs font-medium truncate flex-1">{label}</span>
        
        <div className="flex items-center space-x-1">
          {/* Toggle enabled */}
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-white/20 rounded text-white"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-3.5 w-3.5 ${enabled ? 'opacity-100' : 'opacity-50'}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={enabled 
                  ? "M5 13l4 4L19 7" 
                  : "M6 18L18 6M6 6l12 12"
                } 
              />
            </svg>
          </button>
          
          {/* Toggle collapsed */}
          <button
            onClick={handleCollapse}
            className="p-1 hover:bg-white/20 rounded text-white"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3.5 w-3.5"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={collapsed 
                  ? "M19 9l-7 7-7-7" 
                  : "M5 15l7-7 7 7"
                } 
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Color tag selector */}
      <div className="p-1 bg-gray-100 flex justify-between items-center">
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`w-4 h-4 rounded-full border ${colorTag ? colorOptions.find(c => c.color === colorTag)?.class : 'bg-gray-300'}`}
          />
          
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded border p-1 z-10">
              <div className="flex flex-wrap gap-1 w-24">
                {colorOptions.map((option) => (
                  <button
                    key={option.color}
                    className={`w-5 h-5 rounded-full ${option.class}`}
                    onClick={() => {
                      handleColorChange(option.color);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
                <button
                  className="w-5 h-5 rounded-full bg-gray-200 text-xs flex items-center justify-center"
                  onClick={() => {
                    handleColorChange('');
                    setShowColorPicker(false);
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Delete button */}
        <button 
          onClick={handleDelete}
          className="text-xs text-red-600 hover:text-red-700 font-medium px-1"
        >
          Delete
        </button>
      </div>
      
      {/* Node content */}
      {!collapsed && (
        <div className="p-2">
          {/* Parameters */}
          {parameters.length > 0 && (
            <div className="space-y-2">
              {parameters.map(param => (
                <div key={param.id} className="flex items-start">
                  {/* Parameter input connection */}
                  <div className="pt-1 pr-1">
                    <TypedHandle
                      type="target"
                      position={Position.Left}
                      id={param.id}
                      dataType={param.type}
                      isConnected={!!inputConnections[param.id]}
                    />
                  </div>
                  
                  {/* Parameter content */}
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      {param.name}
                    </label>
                    <ParameterInput
                      parameter={param}
                      nodeId={id}
                      onParameterChange={handleParameterChange}
                      inputConnections={inputConnections}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Additional node-specific content could go here */}
        </div>
      )}
      
      {/* Input ports */}
      {inputs.map(input => (
        <TypedHandle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          dataType={input.type}
          label={input.label}
          isConnected={!!inputConnections[input.id]}
          style={{
            top: collapsed ? '50%' : `${inputs.indexOf(input) * 20 + 40}px`,
            transform: collapsed ? 'translateY(-50%)' : 'none',
          }}
        />
      ))}
      
      {/* Output ports */}
      {outputs.map(output => (
        <TypedHandle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          dataType={output.type}
          label={output.label}
          isConnected={!!outputConnections[output.id]}
          style={{
            top: collapsed ? '50%' : `${outputs.indexOf(output) * 20 + 40}px`,
            transform: collapsed ? 'translateY(-50%)' : 'none',
          }}
        />
      ))}
    </div>
  );
};

export default BaseNode;