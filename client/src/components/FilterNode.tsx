import { memo, useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Handle, Position, NodeProps } from 'reactflow';
import { throttle } from 'lodash';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { CustomSlider } from '@/components/ui/custom-slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, MinusIcon, TagIcon, Layers, Paintbrush } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterNodeData, BlendMode, NodeColorTag, FilterParam } from '@/types';
import NodeControls from './NodeControls';

// Color tag backgrounds
const colorTagBg: Record<NodeColorTag, string> = {
  default: 'bg-gray-600',
  red: 'bg-red-600',
  orange: 'bg-orange-600',
  yellow: 'bg-yellow-500',
  green: 'bg-green-600',
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  pink: 'bg-pink-600'
};

// Blend mode labels
const blendModeLabels: Record<BlendMode, string> = {
  'normal': 'Normal',
  'multiply': 'Multiply',
  'screen': 'Screen',
  'overlay': 'Overlay',
  'darken': 'Darken',
  'lighten': 'Lighten',
  'color-dodge': 'Color Dodge',
  'color-burn': 'Color Burn',
  'hard-light': 'Hard Light',
  'soft-light': 'Soft Light',
  'difference': 'Difference',
  'exclusion': 'Exclusion'
};

// EditableValue component for consistent display and editing of parameter values
const EditableValue = ({ 
  value,
  unit,
  paramId,
  isEditing,
  editValue,
  onStartEdit,
  onChangeEdit,
  onFinishEdit,
  onCancelEdit,
  disabled
}: {
  value: number | string,
  unit?: string,
  paramId: string,
  isEditing: boolean,
  editValue: string,
  onStartEdit: (id: string, value: number | string | boolean) => void,
  onChangeEdit: (value: string) => void,
  onFinishEdit: () => void,
  onCancelEdit: () => void,
  disabled?: boolean
}) => {
  if (isEditing) {
    return (
      <Input
        type="text"
        value={editValue}
        onChange={(e) => onChangeEdit(e.target.value)}
        onBlur={onFinishEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onFinishEdit();
          } else if (e.key === 'Escape') {
            onCancelEdit();
          }
        }}
        className="text-xs w-14 h-6 px-1 py-0"
        autoFocus
      />
    );
  }
  
  return (
    <span 
      className={`text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-800 font-medium 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200'}`}
      onClick={() => {
        if (!disabled && typeof value !== 'boolean') {
          onStartEdit(paramId, value);
        }
      }}
      title={disabled ? "Parameter is disabled or connected" : "Click to edit value"}
    >
      {value}{unit || ''}
    </span>
  );
};

const FilterNode = ({ data, selected, id }: NodeProps<FilterNodeData>) => {
  // Add local state for the preview thumbnail - fallback to data.preview
  const [previewThumb, setPreviewThumb] = useState(data.preview || '');
  
  // Also update local state if data.preview changes (for initial load)
  useEffect(() => {
    if (data.preview) {
      setPreviewThumb(data.preview);
    }
  }, [data.preview]);
  
  // Function to directly request a preview update via custom event
  const requestPreviewUpdate = useCallback(() => {
    console.log('Requesting direct preview update for node:', id);
    
    // Dispatch the request event directly
    const requestEvent = new CustomEvent('request-node-preview', {
      detail: { nodeId: id }
    });
    window.dispatchEvent(requestEvent);
    
    // Also request a preview through the callback if available
    // (belt-and-suspenders approach to ensure preview updates)
    if (data.onRequestNodePreview) {
      data.onRequestNodePreview(id);
    }
  }, [id, data.onRequestNodePreview]);
  
  // Make the function globally available for debugging
  useEffect(() => {
    if (!(window as any).requestPreviewForNode) {
      (window as any).requestPreviewForNode = function(nodeId: string) {
        console.log('Global: Requesting preview for node:', nodeId);
        const event = new CustomEvent('request-node-preview', { 
          detail: { nodeId } 
        });
        window.dispatchEvent(event);
      };
    }
  }, []);
  
  // Subscribe to preview updates for this node using custom DOM events
  useEffect(() => {
    const handlePreviewUpdate = (e: any) => {
      if (e.detail && e.detail.nodeId === id && e.detail.preview) {
        console.log('Node', id, 'received preview update via DOM event');
        setPreviewThumb(e.detail.preview);
        
        // Also update in the node data if callback is provided
        if (data.onUpdatePreview) {
          data.onUpdatePreview(id, e.detail.preview);
        }
      }
    };
    
    // Add event listener for our custom event
    window.addEventListener('node-preview-updated', handlePreviewUpdate);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('node-preview-updated', handlePreviewUpdate);
    };
  }, [id, data.onUpdatePreview]);
  
  // Create throttled version of the parameter change handler for slider interactions
  const throttledParamChange = useMemo(() => {
    return throttle((paramId: string, value: number | string | boolean) => {
      if (data.onParamChange) {
        // First, update the parameter value
        data.onParamChange(id, paramId, value);
        
        // Request preview update using our direct DOM event system
        requestPreviewUpdate();
        
        // Also use the callback if available (for backward compatibility)
        if (data.onRequestNodePreview) {
          data.onRequestNodePreview(id);
        }
      }
    }, 30, { leading: true, trailing: true }); // Even faster throttle for better responsiveness
  }, [id, data.onParamChange, data.onRequestNodePreview, requestPreviewUpdate]);
  
  const [collapsed, setCollapsed] = useState(data.collapsed || false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Create handle references for connection lines to work properly
  const handleRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      className={`shadow-md w-[280px] bg-card ${selected ? 'ring-2 ring-primary' : ''} 
        ${!data.enabled ? 'opacity-60' : ''}`}
    >
      <div 
        className={`${colorTagBg[data.colorTag || 'default']} text-white px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move`}
      >
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={`enable-${id}`}
            checked={data.enabled}
            onCheckedChange={handleToggleEnabled}
            className="bg-white data-[state=checked]:bg-white data-[state=checked]:text-accent border-white h-4 w-4"
            onClick={(e) => e.stopPropagation()}
          />
          <span>{data.label}</span>
        </div>
        <div className="flex space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="hover:bg-white/20 rounded p-1" 
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Layers className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Node Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="hover:bg-white/20 rounded p-1" 
                  onClick={handleToggleCollapse}
                >
                  {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{collapsed ? 'Expand' : 'Collapse'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Node settings panel */}
      {showSettings && (
        <div className="p-3 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="block text-xs text-gray-500 mb-1">Blend Mode</Label>
              <Select 
                value={data.blendMode || 'normal'} 
                onValueChange={(value) => handleChangeBlendMode(value as BlendMode)}
                disabled={!data.enabled}
              >
                <SelectTrigger className="w-full text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(blendModeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
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

      {!collapsed && (
        <div className="p-3">
          {/* Source Image parameter */}
          <div className="mb-4 relative">
            <Handle
              id="param-sourceImage"
              type="target"
              position={Position.Left}
              style={{ 
                left: -17, // 3px to the right
                top: 10, // 2px down
                width: 8, 
                height: 8,
                background: '#777777',
                borderRadius: '50%',
                border: '2px solid #333',
                zIndex: 10
              }}
            />
            
            <div className="flex justify-between items-center">
              <Label className="block text-xs text-gray-600 font-medium">Source Image</Label>
              <Badge 
                variant="outline" 
                className="text-[9px] px-1 py-0 h-4"
              >
                image
              </Badge>
            </div>
          </div>
          
          {/* Image Preview - Using local state for more reliable updates */}
          {previewThumb && (
            <div className="mb-3">
              <div className="relative border border-gray-200 rounded overflow-hidden" style={{ height: '100px' }}>
                <img 
                  src={previewThumb} 
                  alt={`${data.label} preview`}
                  className="w-full h-full object-cover"
                  data-node-preview-id={id}  // Add data attribute for direct DOM manipulation
                />
              </div>
            </div>
          )}
          
          {/* Parameters with connection handles */}
          {data.params.map((param) => (
            <div key={param.id || param.name} className="mb-4 relative">
              {/* Parameter connection handle */}
              <Handle
                id={`param-${param.id || param.name}`}
                type="target"
                position={Position.Left}
                style={{ 
                  left: -17, // 3px to the right
                  top: 10, // 2px down
                  width: 8, 
                  height: 8, 
                  background: param.isConnected ? '#ff5555' : '#777777',
                  borderRadius: '50%',
                  border: '2px solid #333',
                  zIndex: 10
                }}
              />
              
              <div className="flex justify-between items-center">
                <Label className="block text-xs text-gray-600 font-medium">{param.label}</Label>
                <div className="flex items-center">
                  {param.isConnected && (
                    <button 
                      className="text-xs text-red-500 hover:text-red-700 mr-1 px-1 border border-red-500 rounded"
                      onClick={() => handleDisconnectParam(param.id || param.name)}
                      title="Disconnect parameter"
                    >
                      ×
                    </button>
                  )}
                  <Badge 
                    variant="outline" 
                    className="text-[9px] px-1 py-0 h-4"
                  >
                    {param.paramType}
                  </Badge>
                </div>
              </div>
              
              {/* Parameter connection indicators removed */}
              
              {param.controlType === 'range' && (
                <div className="flex items-center mt-1">
                  <CustomSlider
                    value={[param.value as number]}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    color="warning"
                    size="md"
                    className="flex-1 mr-2"
                    onValueChange={(values) => {
                      // Update node data immediately so the thumb moves
                      handleParamChange(param.id || param.name, values[0]);
                      // Use throttled processing for WebGL rendering
                      throttledParamChange(param.id || param.name, values[0]);
                      // Also directly request a preview update immediately
                      requestPreviewUpdate();
                    }}
                    disabled={!data.enabled || param.isConnected}
                  />
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
        
        {/* Single output handle - bottom right corner */}
        <Handle
          id="node-output"
          type="source"
          position={Position.Right}
          style={{ 
            right: -17,
            bottom: 0,
            top: 'auto',
            width: 8, 
            height: 8, 
            background: '#777777',
            borderRadius: '50%',
            border: '2px solid #333',
            zIndex: 10
          }}
        />
      </div>
    </Card>
  );
};

export default memo(FilterNode);
