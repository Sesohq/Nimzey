import { useState, useEffect, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FilterNodeData, BlendMode, NodeColorTag } from '@/types';
import { getFilterSettings } from '@/lib/filters';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

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

const FilterNode = ({ id, data }: NodeProps<FilterNodeData>) => {
  const [settings, setSettings] = useState<Record<string, any>>(data.settings || {});
  const [collapsed, setCollapsed] = useState(data.collapsed || false);
  
  // Get filter settings based on the filter type
  const filterSettings = getFilterSettings(data.filter?.type || data.filterType || '');
  
  // Update local settings when data.settings changes
  useEffect(() => {
    if (data.settings) {
      setSettings(data.settings);
    }
  }, [data.settings]);
  
  const handleSettingChange = (name: string, value: any) => {
    const newSettings = { ...settings, [name]: value };
    setSettings(newSettings);
    
    // This is important - it communicates the setting change to the parent
    if (data.onSettingsChange) {
      data.onSettingsChange(id, newSettings);
    }
  };
  
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    if (data.onToggleCollapsed) {
      data.onToggleCollapsed(id, newCollapsedState);
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
  
  const handleChangeColorTag = (color: NodeColorTag) => {
    if (data.onChangeColorTag) {
      data.onChangeColorTag(id, color);
    }
  };

  return (
    <div className="bg-node-bg rounded-md shadow-lg w-60">
      {/* Node header */}
      <div 
        className={`${colorTagBg[data.colorTag || 'default']} px-3 py-2 rounded-t-md text-white`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`enable-${id}`}
              checked={data.enabled}
              onCheckedChange={handleToggleEnabled}
              className="bg-white data-[state=checked]:bg-white data-[state=checked]:text-accent border-white h-4 w-4"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="font-medium text-sm">{data.label}</span>
          </div>
          <div className="flex space-x-1">
            <button 
              className="hover:bg-white/20 rounded p-1" 
              onClick={(e) => {
                e.stopPropagation();
                // Toggle settings if we implement them
              }}
            >
              <Layers className="h-3 w-3" />
            </button>
            
            <button 
              className="hover:bg-white/20 rounded p-1" 
              onClick={handleToggleCollapse}
            >
              {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
      
      {!collapsed && (
        <div className="p-3">
          {/* Input handle */}
          <Handle
            type="target"
            position={Position.Left}
            style={{ background: '#555' }}
          />
          
          {/* Output handle */}
          <Handle
            type="source"
            position={Position.Right}
            style={{ background: '#555' }}
          />
          
          {/* Preview image */}
          <div className="mb-3 bg-gray-800 rounded-md overflow-hidden" style={{ height: '120px' }}>
            {data.preview ? (
              <img 
                src={data.preview} 
                alt={`${data.label} preview`}
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <span className="text-gray-500">No preview</span>
              </div>
            )}
          </div>
          
          {/* Filter settings controls */}
          {filterSettings.map(setting => (
            <div className="mb-3" key={setting.name}>
              <label className="text-xs text-gray-400 mb-1 block">{setting.label}</label>
              
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
                  />
                  <Input
                    type="number"
                    min={setting.min}
                    max={setting.max}
                    value={settings[setting.name] ?? setting.defaultValue}
                    onChange={(e) => handleSettingChange(setting.name, Number(e.target.value))}
                    className="w-12 bg-gray-700 text-white text-xs p-1 rounded"
                  />
                </div>
              )}
              
              {/* For dropdown selects */}
              {setting.type === 'select' && (
                <Select 
                  value={String(settings[setting.name] ?? setting.defaultValue)}
                  onValueChange={(value) => handleSettingChange(setting.name, value)}
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
        </div>
      )}
    </div>
  );
};

export default memo(FilterNode);