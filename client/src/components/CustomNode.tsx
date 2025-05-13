import { memo, useState, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MinusIcon, LayersIcon, StarIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomNodeData, BlendMode } from '@/types';
import NodeControls from './NodeControls';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CustomNode = ({ data, selected, id }: NodeProps<CustomNodeData>) => {
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Visual theme for custom nodes - gold/premium look
  const customNodeStyle = {
    color: 'bg-amber-700',
    textColor: 'text-amber-50',
    borderColor: 'border-amber-600',
    iconColor: 'text-amber-300'
  };
  
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
        className={`${customNodeStyle.color} ${customNodeStyle.textColor} px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move`}
      >
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={`enable-${id}`}
            checked={data.enabled}
            onCheckedChange={handleToggleEnabled}
            className="bg-white data-[state=checked]:bg-white data-[state=checked]:text-accent border-white h-4 w-4"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="flex items-center">
            <StarIcon className={`h-3.5 w-3.5 mr-1 ${customNodeStyle.iconColor}`} />
            {data.name}
          </span>
        </div>
        <div className="flex space-x-1">
          <button 
            className="hover:bg-amber-800 rounded p-1" 
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors">
                    <LayersIcon className="h-3 w-3" />
                    <span>{data.blendMode.replace('-', ' ')}</span>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Blend Mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
        {/* Unlimited connection input area - covers left and top sides */}
        <div 
          className="absolute top-0 left-0 w-full h-full" 
          style={{ 
            clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)',
            zIndex: 1 
          }}
        >
          <Handle
            type="target"
            position={Position.Left}
            id="dynamic-input"
            className="w-full h-full bg-transparent"
            style={{ 
              top: 0, 
              left: 0, 
              transform: 'none',
              opacity: 0 // Invisible but functional
            }}
          />
        </div>
        
        {/* Visual indicator for the connection area - golden glow effect */}
        <div className="absolute top-0 left-0 w-12 h-12 rounded-tl-full pointer-events-none opacity-30 bg-gradient-to-br from-amber-300 via-amber-500 to-transparent" />
        
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="w-9 h-9 rounded-full -mr-4 bg-amber-500"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>
    </Card>
  );
};

export default memo(CustomNode);