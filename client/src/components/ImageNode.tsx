import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { ImageNodeData } from '@/types';
import { Upload, Plus } from 'lucide-react';

interface ExtendedNodeProps extends NodeProps<ImageNodeData> {
  onUploadImage?: (file: File) => void;
}

const ImageNode = ({ data, selected, onUploadImage }: ExtendedNodeProps) => {
  // Use the uploadImage function from either props or data
  const uploadFunc = onUploadImage || data.onUploadImage;
  
  // Open file picker directly
  const handleClick = () => {
    // Create a temporary file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    // Set up the file change handler
    fileInput.onchange = (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0 && uploadFunc) {
        uploadFunc(files[0]);
      }
    };
    
    // Trigger the file selection dialog
    fileInput.click();
  };

  return (
    <Card className={`shadow-md w-[180px] bg-white ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="bg-blue-500 text-white px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move">
        <span>Source Image</span>
      </div>
      
      <div className="p-3">
        {data.src ? (
          <div 
            className="relative group cursor-pointer"
            onClick={handleClick}
          >
            <img 
              src={data.src} 
              alt="Source image" 
              className="w-full h-auto rounded mb-2 object-cover"
              style={{ maxHeight: '100px' }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
              <Upload className="w-6 h-6 text-white" />
              <span className="text-white text-xs ml-1">Change image</span>
            </div>
          </div>
        ) : (
          <div 
            className="w-full h-[100px] bg-gray-100 rounded mb-2 flex flex-col items-center justify-center text-gray-400 text-xs cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={handleClick}
          >
            <Plus className="h-6 w-6 mb-1" />
            <span>Click to upload image</span>
          </div>
        )}
      </div>
      
      <div className="px-3 pb-2 flex justify-end relative h-6">
        <Handle
          type="source"
          position={Position.Right}
          className="w-9 h-9 rounded-full -mr-4 bg-accent"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>
    </Card>
  );
};

export default memo(ImageNode);
