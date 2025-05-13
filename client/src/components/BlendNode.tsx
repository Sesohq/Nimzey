import { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { FilterNodeData } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import NodeControls from '@/components/NodeControls';
import { 
  Layers,
  MoveHorizontal,
  ArrowDown
} from 'lucide-react';

export default function BlendNode({ data, selected, id }: NodeProps<FilterNodeData>) {
  // Access the node ID from props
  const nodeId = id;
  const [isMinimized, setIsMinimized] = useState(false);
  const { getEdges } = useReactFlow();
  
  // State to track connected inputs
  const [connectedInputs, setConnectedInputs] = useState({
    inputA: false,
    inputB: false
  });
  
  // Check for connected edges when the component mounts or edges change
  useEffect(() => {
    const checkConnections = () => {
      const edges = getEdges();
      const hasInputA = edges.some(edge => edge.target === nodeId && edge.targetHandle === 'inputA');
      const hasInputB = edges.some(edge => edge.target === nodeId && edge.targetHandle === 'inputB');
      
      setConnectedInputs({
        inputA: hasInputA,
        inputB: hasInputB
      });
    };
    
    checkConnections();
    
    // We could add a subscription to edge changes here if needed
  }, [nodeId, getEdges]);
  
  const handleParamChange = (paramName: string, value: number | string) => {
    if (data.onParamChange) {
      data.onParamChange(nodeId, paramName, value);
    }
  };
  
  const handleBlendModeChange = (value: string) => {
    // Log the change for debugging
    console.log(`Changing blend mode for node ${nodeId} to:`, value);
    
    if (data.onBlendModeChange) {
      data.onBlendModeChange(nodeId, value as any);
    } else {
      console.error(`Missing onBlendModeChange handler for node ${nodeId}`);
    }
  };
  
  const handleOpacityChange = (value: number) => {
    // Log the change for debugging
    console.log(`Changing opacity for node ${nodeId} to:`, value);
    
    if (data.onOpacityChange) {
      data.onOpacityChange(nodeId, value);
    } else {
      console.error(`Missing onOpacityChange handler for node ${nodeId}`);
    }
  };
  
  const handleToggleEnabled = (checked: boolean) => {
    if (data.onToggleEnabled) {
      data.onToggleEnabled(nodeId, checked);
    }
  };
  
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-md border border-slate-200 w-72',
      selected ? 'ring-2 ring-blue-500' : ''
    )}>
      {/* Input Handle A - Base/Background Layer Input (left side) */}
      <div className="absolute left-[-30px] top-[50%] translate-y-[-50%] flex items-center">
        <Badge variant={connectedInputs.inputA ? "default" : "outline"} className="mr-1 bg-green-100 text-green-800 hover:bg-green-200 text-[10px]">
          Base
        </Badge>
        <Handle
          type="target"
          position={Position.Left}
          id="inputA"
          className={cn(
            "w-4 h-4 rounded-full border-2 border-white left-[-6px]",
            connectedInputs.inputA ? "bg-green-500" : "bg-green-200"
          )}
        />
      </div>
      
      {/* Input Handle B - Blend/Foreground Layer Input (top) */}
      <div className="absolute top-[-30px] left-[50%] translate-x-[-50%] flex flex-col items-center">
        <Badge variant={connectedInputs.inputB ? "default" : "outline"} className="mb-1 bg-blue-100 text-blue-800 hover:bg-blue-200 text-[10px]">
          Blend
        </Badge>
        <Handle
          type="target"
          position={Position.Top}
          id="inputB"
          className={cn(
            "w-4 h-4 rounded-full border-2 border-white top-[-6px]",
            connectedInputs.inputB ? "bg-blue-500" : "bg-blue-200"
          )}
        />
      </div>
      
      {/* Output Handle - Combined Result (right side) */}
      <div className="absolute right-[-30px] top-[50%] translate-y-[-50%] flex items-center">
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white right-[-6px]"
        />
        <Badge variant="default" className="ml-1 bg-purple-100 text-purple-800 hover:bg-purple-200 text-[10px]">
          Result
        </Badge>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
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
          <Label htmlFor={`${nodeId}-enabled`} className="text-xs text-slate-500">
            Enabled
          </Label>
          <Switch 
            id={`${nodeId}-enabled`}
            checked={data.enabled}
            onCheckedChange={handleToggleEnabled}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>
        
        {!isMinimized && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${nodeId}-blend-mode`} className="text-xs text-slate-500">
                  Blend Mode
                </Label>
                <Select
                  value={data.blendMode || "normal"}
                  onValueChange={handleBlendModeChange}
                  defaultValue="normal"
                >
                  <SelectTrigger id={`${nodeId}-blend-mode`} className="w-full bg-white">
                    <SelectValue placeholder="Select blend mode" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-white z-50 shadow-xl border border-gray-200 max-h-[320px]">
                    <div className="p-1 border-b text-xs font-medium text-gray-500">Normal</div>
                    <SelectItem value="normal">Normal</SelectItem>
                    
                    <div className="p-1 border-b text-xs font-medium text-gray-500 mt-1">Darken</div>
                    <SelectItem value="multiply">Multiply</SelectItem>
                    <SelectItem value="darken">Darken</SelectItem>
                    <SelectItem value="color-burn">Color Burn</SelectItem>
                    <SelectItem value="linear-burn">Linear Burn</SelectItem>
                    
                    <div className="p-1 border-b text-xs font-medium text-gray-500 mt-1">Lighten</div>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="lighten">Lighten</SelectItem>
                    <SelectItem value="color-dodge">Color Dodge</SelectItem>
                    <SelectItem value="linear-dodge">Linear Dodge (Add)</SelectItem>
                    
                    <div className="p-1 border-b text-xs font-medium text-gray-500 mt-1">Contrast</div>
                    <SelectItem value="overlay">Overlay</SelectItem>
                    <SelectItem value="hard-light">Hard Light</SelectItem>
                    <SelectItem value="soft-light">Soft Light</SelectItem>
                    <SelectItem value="vivid-light">Vivid Light</SelectItem>
                    <SelectItem value="linear-light">Linear Light</SelectItem>
                    
                    <div className="p-1 border-b text-xs font-medium text-gray-500 mt-1">Comparative</div>
                    <SelectItem value="difference">Difference</SelectItem>
                    <SelectItem value="exclusion">Exclusion</SelectItem>
                    <SelectItem value="subtract">Subtract</SelectItem>
                    <SelectItem value="divide">Divide</SelectItem>
                    
                    <div className="p-1 border-b text-xs font-medium text-gray-500 mt-1">HSY Component</div>
                    <SelectItem value="hue">Hue</SelectItem>
                    <SelectItem value="saturation">Saturation</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="luminosity">Luminosity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor={`${nodeId}-opacity`} className="text-xs text-slate-500">
                    Opacity: {data.opacity}%
                  </Label>
                </div>
                <Slider
                  id={`${nodeId}-opacity`}
                  min={0}
                  max={100}
                  step={1}
                  value={[data.opacity || 100]}
                  onValueChange={(values) => handleOpacityChange(values[0])}
                  className="my-1 bg-opacity-100"
                  aria-label="Opacity"
                />
              </div>
              
              {/* Filter-specific parameters */}
              {data.params.map((param) => (
                <div key={param.name} className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor={`${nodeId}-${param.name}`} className="text-xs text-slate-500">
                      {param.label}: {param.value}{param.unit || ''}
                    </Label>
                  </div>
                  {param.type === 'range' ? (
                    <Slider
                      id={`${nodeId}-${param.name}`}
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
                      <SelectTrigger id={`${nodeId}-${param.name}`} className="w-full">
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
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between px-2 py-1 rounded bg-white shadow-sm border border-slate-100">
                  <div className="flex items-center">
                    <div className={cn(
                      "w-3 h-3 rounded-full mr-2",
                      connectedInputs.inputA ? "bg-green-500" : "bg-green-200"
                    )}></div>
                    <span className="text-xs text-slate-500">Base Layer (Left)</span>
                  </div>
                  <MoveHorizontal className="w-3 h-3 text-slate-400" />
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded bg-white shadow-sm border border-slate-100">
                  <div className="flex items-center">
                    <div className={cn(
                      "w-3 h-3 rounded-full mr-2",
                      connectedInputs.inputB ? "bg-blue-500" : "bg-blue-200"
                    )}></div>
                    <span className="text-xs text-slate-500">Blend Layer (Top)</span>
                  </div>
                  <ArrowDown className="w-3 h-3 text-slate-400" />
                </div>
                {(!connectedInputs.inputA || !connectedInputs.inputB) && (
                  <div className="text-xs text-amber-600 p-1 bg-amber-50 rounded border border-amber-100">
                    {!connectedInputs.inputA && !connectedInputs.inputB ? (
                      "Connect both inputs to enable blending"
                    ) : !connectedInputs.inputA ? (
                      "Missing base layer input (left)"
                    ) : (
                      "Missing blend layer input (top)"
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}