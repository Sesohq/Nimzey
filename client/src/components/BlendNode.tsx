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
    foreground: false,
    background: false,
    opacity: false
  });
  
  // Check for connected edges when the component mounts or edges change
  useEffect(() => {
    const checkConnections = () => {
      const edges = getEdges();
      const hasForeground = edges.some(edge => edge.target === nodeId && edge.targetHandle === 'foreground');
      const hasBackground = edges.some(edge => edge.target === nodeId && edge.targetHandle === 'background');
      const hasOpacity = edges.some(edge => edge.target === nodeId && edge.targetHandle === 'opacity');
      
      setConnectedInputs({
        foreground: hasForeground,
        background: hasBackground,
        opacity: hasOpacity
      });
    };
    
    checkConnections();
    
    // We could add a subscription to edge changes here if needed
  }, [nodeId, getEdges]);
  
  // No preview image management needed
  
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
      {/* Three inputs on the left side, stacked vertically */}
      
      {/* Foreground input (top) */}
      <div className="absolute left-0 top-[25%] flex items-center">
        <Handle
          type="target"
          position={Position.Left}
          id="foreground"
          className="w-3 h-3 rounded-full -ml-1.5 bg-amber-400"
        />
        <Badge variant="outline" className="ml-2 text-[10px] bg-white shadow-sm">
          Foreground
        </Badge>
      </div>
      
      {/* Background input (middle) */}
      <div className="absolute left-0 top-[50%] flex items-center">
        <Handle
          type="target"
          position={Position.Left}
          id="background"
          className="w-3 h-3 rounded-full -ml-1.5 bg-amber-400"
        />
        <Badge variant="outline" className="ml-2 text-[10px] bg-white shadow-sm">
          Background
        </Badge>
      </div>
      
      {/* Opacity/Mask input (bottom) */}
      <div className="absolute left-0 top-[75%] flex items-center">
        <Handle
          type="target"
          position={Position.Left}
          id="opacity"
          className="w-3 h-3 rounded-full -ml-1.5 bg-amber-400"
        />
        <Badge variant="outline" className="ml-2 text-[10px] bg-white shadow-sm">
          Opacity
        </Badge>
      </div>
      
      {/* Output Handle - Combined Result (right side) */}
      <div className="absolute right-0 top-[50%] flex items-center">
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="w-9 h-9 rounded-full -mr-4 bg-accent"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
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
              
              {/* Filter parameters removed as requested, leaving only blend mode */}
            </div>
            
            <div className="mt-4 bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-lg border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-1",
                      connectedInputs.foreground ? "bg-blue-500" : "bg-gray-300"
                    )}></div>
                    <span className="text-[10px] text-slate-500">Foreground</span>
                  </div>
                  <div className="flex items-center">
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-1",
                      connectedInputs.background ? "bg-blue-500" : "bg-gray-300"
                    )}></div>
                    <span className="text-[10px] text-slate-500">Background</span>
                  </div>
                  <div className="flex items-center">
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-1",
                      connectedInputs.opacity ? "bg-blue-500" : "bg-gray-300"
                    )}></div>
                    <span className="text-[10px] text-slate-500">Opacity</span>
                  </div>
                </div>
              </div>
              {(!connectedInputs.foreground || !connectedInputs.background) && (
                <div className="text-xs text-amber-600 p-1 mt-2 bg-amber-50 rounded border border-amber-100">
                  {!connectedInputs.foreground && !connectedInputs.background ? (
                    "Connect foreground and background inputs for blending"
                  ) : !connectedInputs.foreground ? (
                    "Missing foreground input"
                  ) : (
                    "Missing background input"
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}