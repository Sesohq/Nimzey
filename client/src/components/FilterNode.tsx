import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, MinusIcon, Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterNodeData, BlendMode, NodeColorTag } from '@/types';
import NodeControls from './NodeControls';

// Get proper border color based on the node's color tag
const getBorderForColorTag = (colorTag: NodeColorTag): string => {
  switch (colorTag) {
    case 'red': return 'border-red-500';
    case 'orange': return 'border-orange-500';
    case 'yellow': return 'border-yellow-500';
    case 'green': return 'border-green-500';
    case 'blue': return 'border-blue-500';
    case 'purple': return 'border-purple-500';
    case 'pink': return 'border-pink-500';
    default: return 'border-gray-700';
  }
};

// Get proper header background color based on the node's color tag
const getHeaderColorForTag = (colorTag: NodeColorTag): string => {
  switch (colorTag) {
    case 'red': return 'bg-red-900';
    case 'orange': return 'bg-orange-900';
    case 'yellow': return 'bg-yellow-900';
    case 'green': return 'bg-green-900';
    case 'blue': return 'bg-blue-900';
    case 'purple': return 'bg-purple-900';
    case 'pink': return 'bg-pink-900';
    default: return 'bg-neutral-800';
  }
};

// Get a prefix for filter node labels
const getNodeLabelPrefix = (filterType: string): string => {
  return '//';
};

// List of available blend modes
const blendModes: BlendMode[] = [
  'normal', 'multiply', 'screen', 'overlay', 
  'darken', 'lighten', 'color-dodge', 'color-burn', 
  'hard-light', 'soft-light', 'difference', 'exclusion'
];

const FilterNode = ({ data, selected, id }: NodeProps<FilterNodeData>) => {
  const [collapsed, setCollapsed] = useState(data.collapsed || false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    if (data.onToggleCollapsed) {
      data.onToggleCollapsed(id, newCollapsedState);
    }
  };

  const handleParamChange = (paramId: string, value: number | string | boolean) => {
    if (data.onParamChange) {
      data.onParamChange(id, paramId, value);
    }
  };

  const handleToggleEnabled = (checked: boolean) => {
    if (data.onToggleEnabled) {
      data.onToggleEnabled(id, checked);
    }
  };

  const handleChangeBlendMode = (blendMode: BlendMode) => {
    if (data.onChangeBlendMode) {
      data.onChangeBlendMode(id, blendMode);
    }
  };

  const handleChangeOpacity = (value: number) => {
    if (data.onChangeOpacity) {
      data.onChangeOpacity(id, value);
    }
  };

  const handleChangeColorTag = (color: NodeColorTag) => {
    if (data.onChangeColorTag) {
      data.onChangeColorTag(id, color);
    }
  };

  // For disconnecting parameter links
  const handleDisconnectParam = (paramId: string) => {
    if (data.onDisconnectParam) {
      data.onDisconnectParam(id, paramId);
    }
  };
  
  // Handle starting to edit a parameter value
  const handleStartEditing = (paramId: string, value: number | string | boolean) => {
    if (!data.enabled || data.params.find(p => p.id === paramId)?.isConnected) return;
    
    // Only allow editing numeric or string values
    if (typeof value === 'boolean') return;
    
    setEditingParam(paramId);
    setEditingValue(String(value));
  };
  
  // Handle finishing the edit and updating the value
  const handleFinishEditing = () => {
    if (editingParam && editingValue !== '') {
      const param = data.params.find(p => p.id === editingParam);
      if (param) {
        // Convert value based on parameter type
        let parsedValue: number | string | boolean;
        
        if (param.paramType === 'float') {
          parsedValue = parseFloat(editingValue);
        } else if (param.paramType === 'integer') {
          parsedValue = parseInt(editingValue, 10);
        } else {
          parsedValue = editingValue;
        }
        
        // Clamp the value if min/max are defined
        if (typeof parsedValue === 'number' && !isNaN(parsedValue)) {
          if (param.min !== undefined) parsedValue = Math.max(param.min, parsedValue);
          if (param.max !== undefined) parsedValue = Math.min(param.max, parsedValue);
        }
        
        handleParamChange(editingParam, parsedValue);
      }
    }
    setEditingParam(null);
  };

  return (
    <Card
      className={`min-w-[280px] border-2 relative ${
        selected ? 'border-yellow-400' : getBorderForColorTag(data.colorTag)
      } ${!data.enabled ? 'opacity-50' : ''}`}
      onClick={e => e.stopPropagation()}
    >
      {/* Header with node controls - this part is draggable */}
      <div className={`px-3 py-2 ${data.colorTag ? getHeaderColorForTag(data.colorTag) : 'bg-neutral-800'} flex items-center justify-between rounded-t-sm cursor-move`}>
        <div className="flex items-center">
          <Checkbox 
            id={`node-${id}-enabled`}
            checked={data.enabled}
            onCheckedChange={handleToggleEnabled}
            className="mr-2 h-3 w-3 data-[state=checked]:bg-orange-500 data-[state=checked]:text-orange-500"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          />
          <div className="text-white text-xs font-mono font-medium">
            {getNodeLabelPrefix(data.filterType)} {data.label}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            className="p-1 text-neutral-400 hover:text-white focus:outline-none"
            onClick={handleToggleCollapse}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          
          <button
            className="p-1 text-neutral-400 hover:text-white focus:outline-none"
            onClick={() => setShowSettings(!showSettings)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Settings size={14} />
          </button>
          
          <NodeControls 
            onRemoveNode={data.onRemoveNode ? () => data.onRemoveNode?.(id) : undefined}
            onMinimizeNode={data.onToggleCollapsed ? () => data.onToggleCollapsed(id, !collapsed) : undefined}
          />
        </div>
      </div>
      
      {/* Prevent React Flow from dragging when interacting with content below */}
      <div onPointerDown={e => e.stopPropagation()}>
        {/* Node settings panel */}
        {showSettings && (
          <div className="p-3 border-t border-gray-800 bg-black">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="block text-xs text-gray-500 mb-1">Blend Mode</Label>
                <Select 
                  value={data.blendMode || 'normal'} 
                  onValueChange={(value) => handleChangeBlendMode(value as BlendMode)}
                >
                  <SelectTrigger className="w-full text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {blendModes.map(mode => (
                      <SelectItem key={mode} value={mode}>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="block text-xs text-gray-500 mb-1">Color Tag</Label>
                <Select 
                  value={data.colorTag || 'default'} 
                  onValueChange={(value) => handleChangeColorTag(value as NodeColorTag)}
                >
                  <SelectTrigger className="w-full text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="pink">Pink</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-2">
              <Label className="block text-xs text-gray-500 mb-1">Opacity {data.opacity || 100}%</Label>
              <Slider
                value={[data.opacity || 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(values) => handleChangeOpacity(values[0])}
                disabled={!data.enabled}
              />
            </div>
          </div>
        )}
        
        {/* Parameter connection handle on left side */}
        <Handle
          id="param-sourceImage"
          type="target"
          position={Position.Left}
          style={{ 
            left: -17, // 3px further to the left
            top: 25, // Positioned to line up with the image preview
            width: 8, 
            height: 8, 
            background: '#777777',
            borderRadius: '50%',
            border: '2px solid #333',
            zIndex: 10
          }}
        />
        
        {/* Image preview or parameters based on collapsed state */}
        {!collapsed && (
          <div className={`p-3 ${showSettings ? 'border-t border-gray-800' : ''} bg-black overflow-hidden`}>
            {/* Image preview for source node */}
            {data.preview && (
              <div 
                className="w-full h-[80px] rounded-md overflow-hidden mb-3 bg-neutral-900 flex items-center justify-center"
                style={{ 
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <img 
                  src={data.preview} 
                  alt={data.label} 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            
            {/* Filter parameters */}
            {data.params.map((param) => (
              <div key={param.id || param.name} className="mb-3">
                {/* Parameter header with label, value and connection dot */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {/* Parameter input handle */}
                    <Handle
                      id={`param-${param.id || param.name}`}
                      type="target"
                      position={Position.Left}
                      style={{ 
                        left: -17, // 3px to the left
                        top: 14, // 2px down
                        width: 8, 
                        height: 8, 
                        background: param.isConnected ? '#ff5555' : '#777777',
                        borderRadius: '50%',
                        border: '2px solid #333',
                        zIndex: 10
                      }}
                    />
                    
                    <div className="mr-1">
                      <div className="text-xs font-medium text-gray-300 flex items-center">
                        {param.label}
                        {param.isConnected && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button 
                                  className="ml-1 text-red-400 hover:text-red-500" 
                                  onClick={() => handleDisconnectParam(param.id || param.name)}
                                >
                                  <MinusIcon size={10} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Disconnect parameter</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Badge 
                      variant="outline" 
                      className="text-[9px] px-1 py-0 h-4"
                    >
                      {param.paramType}
                    </Badge>
                  </div>
                </div>
                
                {/* Parameter slider - using native HTML input for better control */}
                {param.controlType === 'range' && (
                  <div className="flex items-center mt-1">
                    <div className="flex-1 mr-2">
                      <input
                        type="range"
                        value={param.value as number}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        onChange={(e) => handleParamChange(param.id || param.name, parseFloat(e.target.value))}
                        disabled={!data.enabled || param.isConnected}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    {editingParam === (param.id || param.name) ? (
                      <Input
                        type={param.paramType === 'float' || param.paramType === 'integer' ? 'number' : 'text'}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={handleFinishEditing}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleFinishEditing();
                          } else if (e.key === 'Escape') {
                            setEditingParam(null);
                          }
                        }}
                        min={param.min}
                        max={param.max}
                        step={param.step || (param.paramType === 'integer' ? 1 : 0.1)}
                        className="text-xs w-16 h-6 px-1 py-0"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-800 font-medium cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          if (typeof param.value !== 'boolean') {
                            handleStartEditing(param.id || param.name, param.value);
                          }
                        }}
                        title="Click to edit value directly"
                      >
                        {param.value}{param.unit || ''}
                      </span>
                    )}
                  </div>
                )}
                
                {param.controlType === 'select' && (
                  <Select 
                    value={param.value as string} 
                    onValueChange={(value) => handleParamChange(param.id || param.name, value)}
                    disabled={!data.enabled || param.isConnected}
                  >
                    <SelectTrigger className="w-full text-sm mt-1">
                      <SelectValue placeholder={param.options?.[0]} />
                    </SelectTrigger>
                    <SelectContent>
                      {param.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {param.controlType === 'checkbox' && (
                  <Checkbox 
                    checked={param.value as boolean}
                    onCheckedChange={(checked) => handleParamChange(param.id || param.name, Boolean(checked))}
                    disabled={!data.enabled || param.isConnected}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Main node connection handles */}
        <div className="px-3 pb-2 flex justify-between relative h-8">
          {/* Input handle (hidden, as we use the Source Image parameter input instead) */}
          <Handle
            id="node-input"
            type="target"
            position={Position.Left}
            className="w-6 h-6 rounded-full -ml-3 bg-blue-600 opacity-0" /* Made invisible */
            style={{ top: 16, transform: 'translateY(-50%)' }}
          />
          
          {/* Single output handle - centered on the right edge */}
          <Handle
            id="node-output"
            type="source"
            position={Position.Right}
            style={{ 
              right: -17, // 3px to the left
              top: 18, // 2px down
              width: 8, 
              height: 8, 
              background: '#777777',
              borderRadius: '50%',
              border: '2px solid #333',
              zIndex: 10
            }}
          />
        </div>
      </div>
    </Card>
  );
};

export default FilterNode;