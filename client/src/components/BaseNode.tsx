import React, { useState, memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeStore, NodeParameter, NodePort, NodeDataType } from '@shared/nodeTypes';
import { getNodeDefinition } from '@/lib/nodeDefinitions';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { 
  MinusIcon, 
  ChevronDownIcon, 
  LayersIcon, 
  PaletteIcon, 
  CheckIcon,
  XIcon
} from 'lucide-react';

// Color tag options
const COLOR_TAGS = {
  'gray': { bg: '#374151', text: 'text-white' },
  'blue': { bg: '#2563EB', text: 'text-white' },
  'green': { bg: '#10B981', text: 'text-white' },
  'yellow': { bg: '#F59E0B', text: 'text-black' },
  'red': { bg: '#EF4444', text: 'text-white' },
  'purple': { bg: '#8B5CF6', text: 'text-white' },
  'pink': { bg: '#EC4899', text: 'text-white' },
  'orange': { bg: '#F97316', text: 'text-white' },
  'teal': { bg: '#14B8A6', text: 'text-white' },
  'cyan': { bg: '#06B6D4', text: 'text-white' },
};

// Determine the handle color based on data type
const getTypeColor = (type: NodeDataType): string => {
  switch (type) {
    case 'image': return '#3B82F6'; // blue
    case 'mask': return '#A3A3A3';  // gray
    case 'float': return '#10B981'; // green
    case 'color': return '#F59E0B'; // yellow
    case 'vector2': return '#8B5CF6'; // purple
    case 'texture': return '#EC4899'; // pink
    case 'boolean': return '#F97316'; // orange
    case 'string': return '#14B8A6'; // teal
    case 'blendSettings': return '#06B6D4'; // cyan
    default: return '#3B82F6'; // blue default
  }
};

// Handle props
interface HandleProps extends React.HTMLAttributes<HTMLDivElement> {
  type: 'source' | 'target';
  position: Position;
  id: string;
  dataType: NodeDataType;
  label?: string;
  isConnected?: boolean;
  isConnectable?: boolean;
}

// Styled handle component
const TypedHandle: React.FC<HandleProps> = ({ 
  type, 
  position, 
  id, 
  dataType,
  label,
  isConnected,
  isConnectable,
  ...rest 
}) => {
  const color = getTypeColor(dataType);
  return (
    <div className={`handle-wrapper flex items-center gap-2 ${position === Position.Left ? 'ml-[-8px]' : 'mr-[-8px] flex-row-reverse'}`}>
      {label && (
        <span className="text-xs text-gray-400">{label}</span>
      )}
      <Handle
        type={type}
        position={position}
        id={id}
        className={`!w-4 !h-4 !rounded-full !border-2 ${isConnected ? '!border-white' : ''}`}
        style={{ 
          background: color,
          borderColor: isConnected ? 'white' : color,
        }}
        isConnectable={isConnectable}
        {...rest}
      />
    </div>
  );
};

// Parameter input (with connection handle)
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
  const isConnected = inputConnections[parameter.id] || false;
  
  // Render the appropriate control based on type
  const renderControl = () => {
    if (isConnected) {
      return (
        <div className="text-xs text-gray-500 italic">
          Connected input
        </div>
      );
    }
    
    switch (parameter.controlType) {
      case 'slider':
        return (
          <div className="flex items-center gap-2">
            <Slider
              value={[parameter.value]}
              min={parameter.min || 0}
              max={parameter.max || 100}
              step={parameter.step || 0.1}
              className="flex-1"
              onValueChange={(values) => onParameterChange(parameter.id, values[0])}
              disabled={isConnected}
            />
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-800 min-w-[40px] text-center">
              {parameter.value}{parameter.unit || ''}
            </span>
          </div>
        );
        
      case 'dropdown':
        return (
          <Select 
            value={String(parameter.value)} 
            onValueChange={(value) => onParameterChange(parameter.id, value)}
            disabled={isConnected}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder={parameter.options?.[0]} />
            </SelectTrigger>
            <SelectContent>
              {parameter.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'toggle':
        return (
          <Checkbox 
            checked={Boolean(parameter.value)}
            onCheckedChange={(checked) => onParameterChange(parameter.id, checked)}
            disabled={isConnected}
          />
        );
        
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded border border-gray-300" 
              style={{ backgroundColor: parameter.value }}
            />
            <Input 
              type="text" 
              value={parameter.value as string} 
              onChange={(e) => onParameterChange(parameter.id, e.target.value)}
              className="flex-1 h-8"
              disabled={isConnected}
            />
          </div>
        );
        
      default:
        return (
          <Input 
            type="text" 
            value={String(parameter.value)} 
            onChange={(e) => onParameterChange(parameter.id, e.target.value)}
            className="w-full h-8"
            disabled={isConnected}
          />
        );
    }
  };
  
  return (
    <div className={`parameter-wrapper mb-3 relative ${isConnected ? 'connected-param' : ''}`}
         style={{ borderColor: isConnected ? getTypeColor(parameter.type) : 'transparent' }}>
      <Label className="text-xs text-gray-500 mb-1 block">{parameter.name}</Label>
      
      {/* Connection handle */}
      <TypedHandle
        type="target"
        position={Position.Left}
        id={parameter.id}
        dataType={parameter.type}
        isConnected={isConnected}
      />
      
      {/* Parameter control */}
      <div className={`parameter-control ${isConnected ? 'opacity-50' : ''}`}>
        {renderControl()}
      </div>
    </div>
  );
};

// Base node component
export interface BaseNodeProps extends NodeProps<NodeStore> {
  onNodeToggle?: (nodeId: string, enabled: boolean) => void;
  onNodeCollapse?: (nodeId: string, collapsed: boolean) => void;
  onColorTagChange?: (nodeId: string, color: string) => void;
  onParameterChange?: (nodeId: string, parameterId: string, value: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  inputConnections?: Record<string, boolean>;
  outputConnections?: Record<string, boolean>;
}

const BaseNode = ({ 
  id,
  data,
  selected,
  onNodeToggle,
  onNodeCollapse,
  onColorTagChange,
  onParameterChange,
  onDeleteNode,
  inputConnections = {},
  outputConnections = {}
}: BaseNodeProps) => {
  // Local state if needed
  const [localCollapsed, setLocalCollapsed] = useState(data.collapsed);
  
  // Get the definition for the node type
  const definition = useMemo(() => getNodeDefinition(data.type), [data.type]);
  
  // Handle interactions
  const handleToggleEnable = (checked: boolean) => {
    if (onNodeToggle) {
      onNodeToggle(id, checked);
    }
  };
  
  const handleToggleCollapse = () => {
    const newState = !localCollapsed;
    setLocalCollapsed(newState);
    
    if (onNodeCollapse) {
      onNodeCollapse(id, newState);
    }
  };
  
  const handleColorChange = (color: string) => {
    if (onColorTagChange) {
      onColorTagChange(id, color);
    }
  };
  
  const handleParamChange = (parameterId: string, value: any) => {
    if (onParameterChange) {
      onParameterChange(id, parameterId, value);
    }
  };
  
  const handleDelete = () => {
    if (onDeleteNode) {
      onDeleteNode(id);
    }
  };
  
  // Get color tag
  const colorTag = data.colorTag || 'gray';
  const colorStyle = COLOR_TAGS[colorTag as keyof typeof COLOR_TAGS] || COLOR_TAGS.gray;
  
  return (
    <Card 
      className={`w-64 shadow-md ${selected ? 'ring-2 ring-primary' : ''} ${!data.enabled ? 'opacity-60' : ''}`}
    >
      <CardHeader 
        className={`${colorStyle.text} px-3 py-2 rounded-t-lg cursor-move flex items-center justify-between`}
        style={{ background: colorStyle.bg }}
      >
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={`enable-${id}`}
            checked={data.enabled}
            onCheckedChange={handleToggleEnable}
            className="bg-white data-[state=checked]:bg-white data-[state=checked]:text-accent border-white h-4 w-4"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="font-medium">{data.label}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:bg-black/20 rounded p-1">
              <PaletteIcon className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(COLOR_TAGS).map(([colorKey, { bg }]) => (
                <DropdownMenuItem 
                  key={colorKey} 
                  className="flex items-center gap-2"
                  onClick={() => handleColorChange(colorKey)}
                >
                  <div className="w-4 h-4 rounded-full" style={{ background: bg }} />
                  <span className="capitalize">{colorKey}</span>
                  {colorKey === colorTag && <CheckIcon className="h-3 w-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <button 
            className="hover:bg-black/20 rounded p-1" 
            onClick={handleToggleCollapse}
          >
            <MinusIcon className="h-3 w-3" />
          </button>
          
          <button 
            className="hover:bg-black/20 rounded p-1" 
            onClick={handleDelete}
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      </CardHeader>
      
      {!localCollapsed && (
        <>
          {data.parameters.length > 0 && (
            <CardContent className="p-3">
              {data.parameters.map((param) => (
                <ParameterInput
                  key={param.id}
                  parameter={param}
                  nodeId={id}
                  onParameterChange={handleParamChange}
                  inputConnections={inputConnections}
                />
              ))}
            </CardContent>
          )}
          
          {data.preview && (
            <div className="mx-3 mb-3 rounded overflow-hidden border border-gray-200">
              <img 
                src={data.preview} 
                alt="Preview" 
                className="w-full h-auto object-contain"
              />
            </div>
          )}
        </>
      )}
      
      <CardFooter className="p-3 flex flex-col">
        {/* Input handles */}
        <div className="mb-2 w-full">
          {data.inputs.map((input) => (
            <div key={input.id} className="my-1">
              <TypedHandle
                type="target"
                position={Position.Left}
                id={input.id}
                dataType={input.type}
                label={input.label}
                isConnected={inputConnections[input.id] || false}
              />
            </div>
          ))}
        </div>
        
        {/* Output handles */}
        <div className="mt-2 w-full">
          {data.outputs.map((output) => (
            <div key={output.id} className="my-1 flex justify-end">
              <TypedHandle
                type="source"
                position={Position.Right}
                id={output.id}
                dataType={output.type}
                label={output.label}
                isConnected={outputConnections[output.id] || false}
              />
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default memo(BaseNode);