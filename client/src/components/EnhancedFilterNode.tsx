import { useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { FilterNodeData, BlendMode, NodeColorTag, FilterType } from '@/types';
import { getFilterSettings, FilterSetting } from '@/lib/filterSettings';
import { requestPreview } from '@/lib/previewBus';

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

export default function EnhancedFilterNode({ data, selected, id }: NodeProps<FilterNodeData>) {
  // Local state for settings
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [previewThumb, setPreviewThumb] = useState(data.preview || '');
  const [collapsed, setCollapsed] = useState(data.collapsed || false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Get filter settings based on filter type
  const filterSettings = getFilterSettings(data.type as string);
  
  // Update local settings when data params change
  useEffect(() => {
    if (data.params) {
      const newSettings: Record<string, any> = {};
      data.params.forEach(param => {
        newSettings[param.name] = param.value;
      });
      setSettings(newSettings);
    }
  }, [data.params]);
  
  // Update preview when it changes
  useEffect(() => {
    if (data.preview) {
      setPreviewThumb(data.preview);
    }
  }, [data.preview]);
  
  // Handle setting changes
  const handleSettingChange = (name: string, value: any) => {
    const newSettings = { ...settings, [name]: value };
    setSettings(newSettings);
    
    // Update the node data through callback
    if (data.onParamChange) {
      const paramId = data.params?.find(p => p.name === name)?.id || name;
      data.onParamChange(id, paramId, value);
      
      // Request a preview update
      if (data.onRequestNodePreview) {
        data.onRequestNodePreview(id);
      } else {
        requestPreview(id);
      }
    }
  };
  
  // Toggle collapsed state
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    if (data.onToggleCollapsed) {
      data.onToggleCollapsed(id, newCollapsedState);
    }
  };

  // Handle enabling/disabling the node
  const handleToggleEnabled = (checked: boolean) => {
    if (data.onToggleEnabled) {
      data.onToggleEnabled(id, checked);
    }
  };

  // Handle blend mode changes
  const handleChangeBlendMode = (blendMode: BlendMode) => {
    if (data.onChangeBlendMode) {
      data.onChangeBlendMode(id, blendMode);
    }
  };

  // Handle opacity changes
  const handleChangeOpacity = (value: number) => {
    if (data.onChangeOpacity) {
      data.onChangeOpacity(id, value);
    }
  };

  // Handle color tag changes
  const handleChangeColorTag = (color: NodeColorTag) => {
    if (data.onChangeColorTag) {
      data.onChangeColorTag(id, color);
    }
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
                left: -17,
                top: 10,
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
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">image</Badge>
            </div>
          </div>
          
          {/* Image Preview */}
          {previewThumb && (
            <div className="mb-3">
              <div className="relative border border-gray-200 rounded overflow-hidden" style={{ height: '100px' }}>
                <img 
                  src={previewThumb} 
                  alt={`${data.label} preview`}
                  className="w-full h-full object-cover"
                  data-node-preview-id={id}
                />
              </div>
            </div>
          )}
          
          {/* Filter Settings UI */}
          {filterSettings.map(setting => (
            <div className="mb-3" key={setting.name}>
              <Label className="text-xs text-gray-400 mb-1 block">{setting.label}</Label>
              
              {/* For sliders (range inputs) */}
              {setting.type === 'range' && (
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[settings[setting.name] ?? setting.defaultValue]}
                    min={setting.min}
                    max={setting.max}
                    step={setting.step}
                    className="flex-1 accent-primary"
                    onValueChange={(value) => handleSettingChange(setting.name, value[0])}
                    disabled={!data.enabled}
                  />
                  <Input
                    type="number"
                    min={setting.min}
                    max={setting.max}
                    value={settings[setting.name] ?? setting.defaultValue}
                    onChange={(e) => handleSettingChange(setting.name, Number(e.target.value))}
                    className="w-16 h-8 bg-gray-700 text-white text-xs p-1 rounded"
                    disabled={!data.enabled}
                  />
                </div>
              )}
              
              {/* For dropdown selects */}
              {setting.type === 'select' && (
                <Select 
                  value={String(settings[setting.name] ?? setting.defaultValue)}
                  onValueChange={(value) => handleSettingChange(setting.name, value)}
                  disabled={!data.enabled}
                >
                  <SelectTrigger className="w-full bg-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {setting.options?.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
          
          {/* Node connection handles */}
          <div className="px-3 pb-2 flex justify-between relative h-8">
            {/* Output handle - right side */}
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
        </div>
      )}
    </Card>
  );
}