import { memo, useState, useMemo, useEffect } from 'react';
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
import { getFilterCategory, categoryColors } from '@/lib/filterCategories';

const FilterNode = ({ data, selected, id }: NodeProps<FilterNodeData>) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showLargePreview, setShowLargePreview] = useState(false);
  
  // Determine the filter category and get the appropriate color
  const category = useMemo(() => getFilterCategory(data.filterType), [data.filterType]);
  const categoryStyle = useMemo(() => categoryColors[category as keyof typeof categoryColors], [category]);
  
  const handleToggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const handleParamChange = (paramName: string, value: number | string) => {
    if (data.onParamChange) {
      data.onParamChange(id, paramName, value);
    }
  };
  
  // Log when the component renders to check if preview data is available
  // Display more detailed debugging to track preview data
  console.log(`FilterNode [${id}] (${data.filterType}) rendering, preview:`,  
    data.preview ? `valid: ${data.preview.startsWith('data:image/')} length: ${data.preview.length}` : 'missing');

  // Use a different useEffect to create a direct preview if needed
  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string | null>(null);

  // Immediate access to preview from passed props
  useEffect(() => {
    if (data.preview && data.preview.startsWith('data:image/')) {
      console.log(`Using provided preview for ${id} (${data.filterType})`);
      setInternalPreviewUrl(data.preview);
    } else {
      // Missing or invalid preview
      console.log(`No valid preview found for ${id} (${data.filterType})`);
      
      // Reset our internal preview if the external one is no longer valid
      if (internalPreviewUrl) {
        setInternalPreviewUrl(null);
      }
    }
  }, [data.preview, id, data.filterType, internalPreviewUrl]);

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
        className={`${categoryStyle.color} ${categoryStyle.textColor} px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move`}
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
          {/* Node Preview Area */}
          <div 
            className="mb-3 bg-gray-100 rounded border border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden"
            style={{ height: '80px' }}
            onClick={() => setShowLargePreview(!showLargePreview)}
          >
            {internalPreviewUrl ? (
              <>
                <img 
                  src={internalPreviewUrl} 
                  alt={`${data.filterType} preview`}
                  className="max-w-full max-h-full object-contain"
                  onLoad={() => console.log(`Preview image loaded successfully for ${id} (${data.filterType})`)}
                  onError={(e) => console.error(`Preview image failed to load for ${id} (${data.filterType})`, e)}
                />
              </>
            ) : (
              <div className="text-xs text-gray-500 p-2 text-center flex flex-col items-center justify-center h-full">
                {/* Show loading animation */}
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2"></div>
                <div>Preview generating...</div>
                <div className="text-[10px] mt-1 text-gray-400">
                  {data.filterType} filter
                </div>
              </div>
            )}
          </div>
          
          {/* Large preview modal */}
          {showLargePreview && internalPreviewUrl && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowLargePreview(false)}>
              <div className="bg-white rounded-lg shadow-xl max-w-2xl max-h-[80vh] overflow-auto p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{data.label} Preview</h3>
                  <button className="text-gray-500 hover:text-gray-700" onClick={(e) => { e.stopPropagation(); setShowLargePreview(false); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <img 
                  src={internalPreviewUrl} 
                  alt={`${data.filterType} preview (large)`}
                  className="max-w-full" 
                  onLoad={() => console.log(`Large preview image loaded for ${id}`)}
                  onError={(e) => console.error(`Large preview image failed to load for ${id}`, e)}
                />
              </div>
            </div>
          )}
        
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
        {/* Input handle - support multiple connections */}
        <Handle
          type="target"
          position={Position.Left}
          id="dynamic-input"
          className="w-9 h-9 rounded-full -ml-4 bg-amber-400"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
        
        {/* Small visual indicator showing that this handle accepts multiple connections */}
        <div className="absolute top-[50%] left-[-10px] transform -translate-y-1/2 w-5 h-5 rounded-full opacity-40 flex items-center justify-center pointer-events-none border-2 border-dashed border-amber-400">
          <div className="text-[8px] font-bold text-amber-600">∞</div>
        </div>
        
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
