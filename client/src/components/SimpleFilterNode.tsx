import { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FilterNodeData } from '@/types';
import { getFilterSettings } from '@/filters';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function SimpleFilterNode({ id, data }: NodeProps<FilterNodeData>) {
  const [settings, setSettings] = useState<Record<string, any>>(data.settings || {});
  const [collapsed, setCollapsed] = useState(data.collapsed || false);
  
  // Get filter settings based on the filter type
  const filterSettings = getFilterSettings(data.filterType || '');
  
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

  return (
    <div className="bg-gray-800 rounded-md shadow-lg w-60">
      {/* Node header */}
      <div className="bg-gray-700 px-3 py-2 rounded-t-md text-white">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{data.label}</span>
          <button 
            className="hover:bg-gray-600 rounded p-1" 
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '▼' : '▲'}
          </button>
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
          <div className="mb-3 bg-gray-900 rounded-md overflow-hidden" style={{ height: '120px' }}>
            {data.preview ? (
              <img 
                src={data.preview} 
                alt={`${data.label} preview`}
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
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
                    className="flex-1"
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
}