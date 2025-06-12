import React, { memo, useRef, useState, useEffect } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { ImageIcon, XIcon, Layers, Plus } from 'lucide-react';
import { FilterNodeData, BlendMode } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface ImageFilterNodeProps extends NodeProps<FilterNodeData> {
  id: string;
}

const ImageFilterNode = memo(({ data, id, selected = false }: ImageFilterNodeProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for immediate preview feedback
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Sync local state with node data
  useEffect(() => {
    if (data.preview) {
      setImagePreview(data.preview);
    } else if (data.params) {
      const imageParam = data.params.find(p => p.id === 'image-data');
      if (imageParam && typeof imageParam.value === 'string' && imageParam.value !== '') {
        setImagePreview(imageParam.value);
      } else {
        setImagePreview(null);
      }
    } else {
      setImagePreview(null);
    }
  }, [data.preview, data.params]);
  
  // Open file picker when node is clicked
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent React Flow from capturing the click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle the selected file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Verify file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive"
        });
        return;
      }
      
      // Use our global uploadNodeImage function
      if (window.uploadNodeImage) {
        // Call the global function which properly updates the params array
        window.uploadNodeImage(id, file);
        
        // Show immediate local preview (this will actually get updated properly by our useEffect)
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            setImagePreview(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Upload error",
          description: "Image upload handler is not available",
          variant: "destructive"
        });
      }
    }
  };
  
  // Function to clear the image
  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    
    // Use global function if available for consistent behavior
    if (window.uploadNodeImage) {
      // Create an empty 1x1 transparent PNG
      const emptyImage = new Blob([new Uint8Array(0)], { type: 'image/png' });
      const emptyFile = new File([emptyImage], 'empty.png', { type: 'image/png' });
      window.uploadNodeImage(id, emptyFile);
    } else if (data.onParamChange) {
      // Fallback to direct param change
      data.onParamChange(id, 'image-data', '');
    }
  };

  // Handle blend mode change
  const handleBlendModeChange = (value: string) => {
    if (data.onChangeBlendMode) {
      data.onChangeBlendMode(id, value as BlendMode);
    }
  };

  // Handle opacity change
  const handleOpacityChange = (value: number[]) => {
    if (data.onChangeOpacity) {
      data.onChangeOpacity(id, value[0]);
    }
  };

  return (
    <Card className={`shadow-md w-64 bg-card ${selected ? 'ring-2 ring-primary' : ''}`}>
      {/* Header bar matching other nodes */}
      <div className="bg-gray-600 text-white px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move">
        <div className="flex items-center">
          <ImageIcon size={16} className="mr-2" />
          <span>{data.label}</span>
        </div>
        {imagePreview && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-white/20"
            onClick={handleClearImage}
            title="Clear image"
          >
            <XIcon size={14} className="text-white hover:text-red-300" />
          </Button>
        )}
      </div>
      
      {/* Main content area */}
      <div className="p-3">
        {/* Blend mode selector */}
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
          <Layers size={14} className="text-gray-500" />
          <span>Blend:</span>
          <Select
            defaultValue={data.blendMode}
            onValueChange={handleBlendModeChange}
          >
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue placeholder="Blend Mode" />
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
            </SelectContent>
          </Select>
        </div>
        
        {/* Opacity slider */}
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
          <span>Opacity:</span>
          <div className="flex-1">
            <Slider
              defaultValue={[data.opacity]}
              max={100}
              step={1}
              className="h-2"
              onValueChange={handleOpacityChange}
            />
          </div>
          <span className="w-8 text-right">{data.opacity}%</span>
        </div>
        
        {/* Clickable image area */}
        <div 
          className="cursor-pointer relative rounded-md overflow-hidden"
          onClick={handleClick}
        >
          {imagePreview ? (
            <div className="rounded-md overflow-hidden bg-gray-200 border border-gray-300">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-32 object-contain"
              />
              <div className="text-center py-1 text-xs text-gray-600 bg-gray-200/80">
                Click to change image
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 bg-gray-200 rounded-md border border-dashed border-gray-400">
              <div className="flex items-center mb-1">
                <Plus size={16} className="text-gray-500 mr-1" />
                <span className="text-gray-600 text-sm">Click to upload</span>
              </div>
              <span className="text-gray-600 text-xs mt-1">JPG, PNG, GIF, etc.</span>
            </div>
          )}
          
          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
      
      {/* Input connection point */}
      <Handle
        type="target"
        position={Position.Left}
        id="node-input"
        className="w-3 h-3 rounded-full -ml-1.5 bg-gray-400 border-2 border-gray-200"
      />
      
      {/* Output connection point */}
      <Handle
        type="source"
        position={Position.Right}
        id="node-output"
        className="w-3 h-3 rounded-full -mr-1.5 bg-purple-500 border-2 border-gray-200"
      />
    </Card>
  );
});

export default ImageFilterNode;