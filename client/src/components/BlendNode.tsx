import { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FilterNodeData } from '@/types';

// Extended interface to include node ID
interface BlendNodeProps extends NodeProps<FilterNodeData> {
  id?: string;
  data: FilterNodeData & {
    id?: string;
    onRemoveNode?: () => void;
  };
}
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import NodeControls from '@/components/NodeControls';
import { 
  Settings2,
  Layers,
  X
} from 'lucide-react';

export default function BlendNode({ data, selected, id }: BlendNodeProps) {
  // Use the ID from props or from data
  const nodeId = id || data.id;
  const [isMinimized, setIsMinimized] = useState(false);
  
  const handleParamChange = (paramName: string, value: number | string) => {
    if (data.onParamChange) {
      data.onParamChange(data.id as string, paramName, value);
    }
  };
  
  const handleBlendModeChange = (value: string) => {
    if (data.onBlendModeChange) {
      data.onBlendModeChange(data.id as string, value as any);
    }
  };
  
  const handleOpacityChange = (value: number) => {
    if (data.onOpacityChange) {
      data.onOpacityChange(data.id as string, value);
    }
  };
  
  const handleToggleEnabled = (checked: boolean) => {
    if (data.onToggleEnabled) {
      data.onToggleEnabled(data.id as string, checked);
    }
  };
  
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-md border border-slate-200 w-72',
      selected ? 'ring-2 ring-blue-500' : ''
    )}>
      {/* Input Handle A - Primary Input */}
      <Handle
        type="target"
        position={Position.Left}
        id="inputA"
        className="w-3 h-3 rounded-full bg-green-500 border-2 border-white left-[-6px]"
      />
      
      {/* Input Handle B - Secondary Input */}
      <Handle
        type="target"
        position={Position.Top}
        id="inputB"
        className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white top-[-6px]"
      />
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 rounded-full bg-red-500 border-2 border-white right-[-6px]"
      />
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Layers className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="font-medium text-sm text-slate-700">{data.label}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <NodeControls 
              onMinimizeNode={() => setIsMinimized(!isMinimized)} 
              onRemoveNode={data.onRemoveNode}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <Label htmlFor={`${data.id}-enabled`} className="text-xs text-slate-500">
            Enabled
          </Label>
          <Switch 
            id={`${data.id}-enabled`}
            checked={data.enabled}
            onCheckedChange={handleToggleEnabled}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>
        
        {!isMinimized && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${data.id}-blend-mode`} className="text-xs text-slate-500">
                  Blend Mode
                </Label>
                <Select
                  value={data.blendMode}
                  onValueChange={handleBlendModeChange}
                >
                  <SelectTrigger id={`${data.id}-blend-mode`} className="w-full">
                    <SelectValue placeholder="Select blend mode" />
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
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor={`${data.id}-opacity`} className="text-xs text-slate-500">
                    Opacity: {data.opacity}%
                  </Label>
                </div>
                <Slider
                  id={`${data.id}-opacity`}
                  min={0}
                  max={100}
                  step={1}
                  value={[data.opacity]}
                  onValueChange={(values) => handleOpacityChange(values[0])}
                  className="my-1"
                />
              </div>
              
              {/* Filter-specific parameters */}
              {data.params.map((param) => (
                <div key={param.name} className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor={`${data.id}-${param.name}`} className="text-xs text-slate-500">
                      {param.label}: {param.value}{param.unit || ''}
                    </Label>
                  </div>
                  {param.type === 'range' ? (
                    <Slider
                      id={`${data.id}-${param.name}`}
                      min={param.min || 0}
                      max={param.max || 100}
                      step={param.step || 1}
                      value={[Number(param.value)]}
                      onValueChange={(values) => handleParamChange(param.name, values[0])}
                      className="my-1"
                    />
                  ) : param.type === 'select' && param.options ? (
                    <Select
                      value={String(param.value)}
                      onValueChange={(value) => handleParamChange(param.name, value)}
                    >
                      <SelectTrigger id={`${data.id}-${param.name}`} className="w-full">
                        <SelectValue placeholder={`Select ${param.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {param.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              ))}
            </div>
            
            <div className="mt-4 bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-lg border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-xs text-slate-500">Input A</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                  <span className="text-xs text-slate-500">Input B</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}