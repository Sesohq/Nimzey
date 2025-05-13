import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MinusIcon, LayersIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterNodeData, BlendMode } from '@/types';
import NodeControls from './NodeControls';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

const FilterNode = ({ data, selected, id }: NodeProps<FilterNodeData>) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const handleParamChange = (paramName: string, value: number | string) => {
    if (data.onParamChange) {
      data.onParamChange(id, paramName, value);
    }
  };

  const handleToggleEnabled = (checked: boolean) => {
    if (data.onToggleEnabled) {
      data.onToggleEnabled(id, checked);
    }
  };
  
  const handleBlendModeChange = (value: string) => {
    if (data.onBlendModeChange) {
      data.onBlendModeChange(id, value as BlendMode);
    }
  };
  
  const handleOpacityChange = (values: number[]) => {
    if (data.onOpacityChange) {
      data.onOpacityChange(id, values[0] / 100); // Convert percentage to 0-1 scale
    }
  };

  return (
    <Card className={`shadow-md w-[220px] bg-white ${selected ? 'ring-2 ring-primary' : ''} ${!data.enabled ? 'opacity-60' : ''}`}>
      <div 
        className="bg-accent text-white px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move"
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
          <button 
            className="hover:bg-purple-700 rounded p-1" 
            onClick={handleToggleMinimize}
          >
            <MinusIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3">
          {data.params.map((param) => (
            <div key={param.name} className="mb-2">
              <Label className="block text-xs text-gray-500 mb-1">{param.label}</Label>
              
              {param.type === 'range' && (
                <div className="flex items-center">
                  <Slider
                    value={[param.value as number]}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    className="flex-1 mr-2"
                    onValueChange={(values) => handleParamChange(param.name, values[0])}
                    disabled={!data.enabled}
                  />
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-800 font-medium">
                    {param.value}{param.unit || ''}
                  </span>
                </div>
              )}
              
              {param.type === 'select' && (
                <Select 
                  value={param.value as string} 
                  onValueChange={(value) => handleParamChange(param.name, value)}
                  disabled={!data.enabled}
                >
                  <SelectTrigger className="w-full text-sm">
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
            </div>
          ))}
        </div>
      )}

      {/* Blend Mode and Opacity Controls */}
      <div className="px-3 pb-3 pt-1">
        <Separator className="my-2" />
        
        <div className="flex items-center justify-between">
          <Popover>
            <PopoverTrigger className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors">
              <LayersIcon className="h-3 w-3" />
              <span>{data.blendMode.replace('-', ' ')}</span>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" side="right">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Blend Mode</Label>
                <Select value={data.blendMode} onValueChange={handleBlendModeChange} disabled={!data.enabled}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="normal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    
                    <SelectItem value="multiply">Multiply</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                    
                    <SelectItem value="darken">Darken</SelectItem>
                    <SelectItem value="lighten">Lighten</SelectItem>
                    
                    <SelectItem value="color-dodge">Color Dodge</SelectItem>
                    <SelectItem value="color-burn">Color Burn</SelectItem>
                    
                    <SelectItem value="hard-light">Hard Light</SelectItem>
                    <SelectItem value="soft-light">Soft Light</SelectItem>
                    
                    <SelectItem value="difference">Difference</SelectItem>
                    <SelectItem value="exclusion">Exclusion</SelectItem>
                    
                    <SelectItem value="hue">Hue</SelectItem>
                    <SelectItem value="saturation">Saturation</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="luminosity">Luminosity</SelectItem>
                  </SelectContent>
                </Select>
                
                <Label className="text-xs text-gray-500 mt-3 block">Opacity</Label>
                <div className="flex items-center">
                  <Slider
                    value={[data.opacity * 100]}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1 mr-2"
                    onValueChange={handleOpacityChange}
                    disabled={!data.enabled}
                  />
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-800 font-medium">
                    {Math.round(data.opacity * 100)}%
                  </span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="px-3 pb-2 flex justify-between relative h-6">
        {/* Default primary input handle */}
        <Handle
          type="target"
          position={Position.Left}
          id="inputA"
          className="w-9 h-9 rounded-full -ml-4 bg-primary"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
        
        {/* Additional input handles for compositing nodes */}
        {(data.filterType === 'mask' || 
          data.filterType === 'multiply' || 
          data.filterType === 'screen' || 
          data.filterType === 'mix' || 
          data.filterType === 'transform' || 
          data.filterType === 'setAlpha') && (
          <>
            {/* Secondary input from top */}
            <Handle
              type="target"
              position={Position.Top}
              id="inputB"
              className="w-9 h-9 rounded-full -mt-4 bg-purple-400"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            />
            
            {/* Tertiary input from bottom */}
            <Handle
              type="target"
              position={Position.Bottom}
              id="inputC"
              className="w-9 h-9 rounded-full -mb-4 bg-blue-400"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            />
          </>
        )}
        
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="w-9 h-9 rounded-full -mr-4 bg-accent"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>
    </Card>
  );
};

export default memo(FilterNode);
