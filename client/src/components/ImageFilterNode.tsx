import React, { memo, useRef, useState, useEffect } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { ImageIcon, XIcon } from 'lucide-react';
import { FilterNodeData } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface ImageFilterNodeProps extends NodeProps<FilterNodeData> {
  id: string;
}

const ImageFilterNode = memo(({ data, id }: ImageFilterNodeProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for immediate preview feedback
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Sync local state with node data
  useEffect(() => {
    if (data.preview) {
      setImagePreview(data.preview);
    } else {
      const imageParam = data.params.find(p => p.id === 'image-data');
      if (imageParam && typeof imageParam.value === 'string' && imageParam.value !== '') {
        setImagePreview(imageParam.value);
      } else {
        setImagePreview(null);
      }
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
    if (files && files.length > 0 && data.onParamChange) {
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
      
      // Create FileReader to convert the file to a data URL
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const imageDataUrl = event.target.result as string;
          
          // Show immediate local preview
          setImagePreview(imageDataUrl);
          
          // Update the parameter value
          if (data.onParamChange) {
            data.onParamChange(id, 'image-data', imageDataUrl);
          }
          
          toast({
            title: "Image uploaded",
            description: "Image has been successfully loaded",
            variant: "default"
          });
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Could not read the image file",
          variant: "destructive"
        });
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // Function to clear the image
  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    if (data.onParamChange) {
      data.onParamChange(id, 'image-data', '');
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-md p-2 w-64 shadow-md">
      {/* Node header */}
      <div className="flex justify-between items-center mb-2 text-gray-200">
        <div className="flex items-center">
          <ImageIcon size={16} className="mr-2 text-purple-500" />
          <span>{data.label}</span>
        </div>
        {imagePreview && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-red-900/30"
            onClick={handleClearImage}
            title="Clear image"
          >
            <XIcon size={14} className="text-gray-400 hover:text-red-400" />
          </Button>
        )}
      </div>
      
      {/* Clickable image area */}
      <div 
        className="cursor-pointer relative rounded-md overflow-hidden"
        onClick={handleClick}
      >
        {imagePreview ? (
          <div className="rounded-md overflow-hidden bg-gray-800">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full h-32 object-contain"
            />
            <div className="text-center py-1 text-xs text-gray-400 bg-gray-800/80">
              Click to change image
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 bg-gray-800 rounded-md border border-dashed border-gray-600">
            <ImageIcon size={32} className="text-gray-600 mb-2" />
            <span className="text-gray-500 text-sm">Click to upload image</span>
            <span className="text-gray-500 text-xs mt-1">JPG, PNG, GIF, etc.</span>
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
      
      {/* Output connection point */}
      <Handle
        type="source"
        position={Position.Right}
        id="node-output"
        style={{ 
          right: -8,
          width: 8, 
          height: 8, 
          background: '#A855F7', // Purple to match the icon
          borderRadius: '50%',
          border: '2px solid #333',
          zIndex: 10
        }}
      />
    </div>
  );
});

export default ImageFilterNode;