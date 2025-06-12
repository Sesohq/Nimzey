import { memo, useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Handle, Position, NodeProps } from 'reactflow';
import { throttle } from 'lodash';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { CustomSlider } from '@/components/ui/custom-slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Layers, Zap } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterNodeData, BlendMode, NodeColorTag, FilterParam } from '@/types';
import CanvasPreview from './CanvasPreview';
import { ColorPicker } from './ColorPicker';

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
      title={disabled ? "Parameter is disabled" : "Click to edit value"}
    >
      {value}{unit || ''}
    </span>
  );
};

interface GeneratorNodeProps extends NodeProps<FilterNodeData> {
  generateNodePreview?: (nodeId: string) => void;
}

const GeneratorNode = ({ data, selected, id, generateNodePreview }: GeneratorNodeProps) => {
  // State for the fast preview system
  const [showFastPreview, setShowFastPreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Create throttled version of the preview generator
  const throttledPreview = useMemo(() => {
    return throttle(() => {
      // Trigger the thumbnail generation
      if (generateNodePreview) {
        generateNodePreview(id);
      }
    }, 100, { leading: false, trailing: true });
  }, [id, generateNodePreview]);
  
  // Create throttled version of the parameter change handler for slider interactions
  const throttledParamChange = useMemo(() => {
    return throttle((paramId: string, value: number | string | boolean) => {
      if (data.onParamChange) {
        data.onParamChange(id, paramId, value);
        // Also schedule a thumbnail update
        throttledPreview();
      }
    }, 100, { leading: true, trailing: true });
  }, [id, data.onParamChange, throttledPreview]);
  
  // Handler for when fast preview is generated
  const handleFastPreviewGenerated = useCallback((dataUrl: string) => {
    setPreviewImageUrl(dataUrl);
  }, []);
  
  const [collapsed, setCollapsed] = useState(data.collapsed || false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const colorPickerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    if (data.onToggleCollapsed) {
      data.onToggleCollapsed(id, newCollapsedState);
    }
  };

  const handleParamChange = (paramId: string, value: number | string | boolean) => {
    // Show fast preview while user is interacting with sliders
    setShowFastPreview(true);
    
    if (data.onParamChange) {
      data.onParamChange(id, paramId, value);
      
      // Hide fast preview and trigger normal preview after interaction stops
      setTimeout(() => {
        setShowFastPreview(false);
        throttledPreview();
      }, 500);
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
  
  // Handle starting to edit a parameter value
  const handleStartEditing = (paramId: string, value: number | string | boolean) => {
    if (!data.enabled) return;
    
    // Only allow editing numeric or string values
    if (typeof value === 'boolean') return;
    
    setEditingParam(paramId);
    setEditingValue(String(value));
  };
  
  // Handle finishing the edit and updating the value
  const handleFinishEditing = () => {
    if (editingParam && editingValue !== '') {
      const param = data.params?.find(p => p.id === editingParam);
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
          <Zap className="h-3 w-3" />
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
                <p>Generator Settings</p>
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
              <Label className="block text-xs text-gray-500 mb-1">Color Tag</Label>
              <Select 
                value={data.colorTag || 'default'} 
                onValueChange={(value) => {
                  console.log('Color tag changed:', value);
                  handleChangeColorTag(value as NodeColorTag);
                }}
              >
                <SelectTrigger className="w-full text-xs h-8" onClick={(e) => e.stopPropagation()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
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
        </div>
      )}

      {!collapsed && (
        <div className="p-3">
          {/* Generator output preview */}
          {data.preview && (
            <div className="mb-3">
              <div className="relative border border-gray-200 rounded overflow-hidden" style={{ height: '100px' }}>
                <img 
                  src={data.preview} 
                  alt={`${data.label} generated texture`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          {/* Parameters */}
          {(data.params || []).map((param) => (
            <div key={param.id || param.name} className="mb-4 relative">
              
              <div className="flex justify-between items-center">
                <Label className="block text-xs text-gray-600 font-medium">{param.label}</Label>
                <div className="flex items-center">
                  <Badge 
                    variant="outline" 
                    className="text-[9px] px-1 py-0 h-4"
                  >
                    {param.paramType}
                  </Badge>
                </div>
              </div>
              
              {param.controlType === 'range' && (
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <EditableValue
                      value={typeof param.value === 'number' || typeof param.value === 'string' ? param.value : (param.value ? 1 : 0)}
                      unit={param.unit}
                      paramId={param.id || param.name}
                      isEditing={editingParam === (param.id || param.name)}
                      editValue={editingValue}
                      onStartEdit={handleStartEditing}
                      onChangeEdit={setEditingValue}
                      onFinishEdit={handleFinishEditing}
                      onCancelEdit={() => setEditingParam(null)}
                      disabled={!data.enabled}
                    />
                  </div>
                  <CustomSlider
                    value={[Number(param.value)]}
                    min={param.min || 0}
                    max={param.max || 100}
                    step={param.step || (param.paramType === 'integer' ? 1 : 0.1)}
                    onValueChange={(values) => handleParamChange(param.id || param.name, values[0])}
                    disabled={!data.enabled}
                  />
                </div>
              )}
              
              {param.controlType === 'select' && (
                <Select 
                  value={String(param.value || param.options?.[0] || '')} 
                  onValueChange={(value) => {
                    console.log('Select value changed:', value, 'for param:', param.id || param.name);
                    handleParamChange(param.id || param.name, value);
                  }}
                  disabled={!data.enabled}
                >
                  <SelectTrigger className="w-full text-sm mt-1" onClick={(e) => e.stopPropagation()}>
                    <SelectValue placeholder={param.options?.[0]} />
                  </SelectTrigger>
                  <SelectContent className="z-50">
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
                  disabled={!data.enabled}
                  className="mt-1"
                />
              )}
              
              {param.controlType === 'color' && (
                <div className="mt-1">
                  <div className="flex items-center space-x-2">
                    <button
                      ref={(el) => colorPickerRefs.current[param.id || param.name] = el}
                      className="w-12 h-8 border border-gray-300 rounded cursor-pointer hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: param.value as string }}
                      onClick={() => setActiveColorPicker(param.id || param.name)}
                      disabled={!data.enabled}
                    />
                    <Input
                      type="text"
                      value={param.value as string}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleParamChange(param.id || param.name, value);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        // Validate and format the hex color on blur
                        if (/^#[0-9A-F]{6}$/i.test(value) || /^#[0-9A-F]{3}$/i.test(value)) {
                          // Valid hex color
                          if (value.length === 4) {
                            // Convert 3-digit hex to 6-digit
                            const fullHex = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
                            handleParamChange(param.id || param.name, fullHex);
                          }
                        } else if (!value.startsWith('#')) {
                          // Add # if missing
                          const withHash = '#' + value;
                          if (/^#[0-9A-F]{6}$/i.test(withHash) || /^#[0-9A-F]{3}$/i.test(withHash)) {
                            handleParamChange(param.id || param.name, withHash);
                          }
                        }
                      }}
                      disabled={!data.enabled}
                      className="flex-1 text-xs font-mono"
                      placeholder="#ffffff"
                    />
                  </div>
                  
                  {/* Color Picker Popup */}
                  {activeColorPicker === (param.id || param.name) && (
                    <ColorPicker
                      color={param.value as string}
                      onChange={(color) => {
                        console.log('Color picker changed:', param.id || param.name, 'to', color);
                        handleParamChange(param.id || param.name, color);
                      }}
                      onClose={() => setActiveColorPicker(null)}
                      isOpen={true}
                      triggerRef={{ current: colorPickerRefs.current[param.id || param.name] }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Single output handle - bottom right corner */}
      <div className="px-3 pb-2 flex justify-end relative h-8">
        <Handle
          id="generator-output"
          type="source"
          position={Position.Right}
          style={{ 
            right: -17,
            bottom: 0,
            top: 'auto',
            width: 8, 
            height: 8, 
            background: '#4ade80',
            borderRadius: '50%',
            border: '2px solid #333',
            zIndex: 10
          }}
        />
      </div>
    </Card>
  );
};

export default memo(GeneratorNode);