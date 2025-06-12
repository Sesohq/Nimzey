import { memo, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { ImageNodeData } from '@/types';
import { Upload, Plus } from 'lucide-react';

interface ExtendedNodeProps extends NodeProps<ImageNodeData> {
  onUploadImage?: (file: File) => void;
}

const ImageNode = ({ data, selected, onUploadImage }: ExtendedNodeProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    // Only trigger file input if onUploadImage is provided
    if (onUploadImage && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onUploadImage) {
      onUploadImage(files[0]);
      // Reset the input value so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <Card className={`shadow-md w-[180px] bg-card ${selected ? 'ring-2 ring-primary' : ''}`}>
      {/* Header bar matching other nodes */}
      <div className="bg-gray-600 text-white px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move">
        <span>Source Image</span>
      </div>
      
      {/* Main content area */}
      <div className="p-3">
        {data.src ? (
          <div 
            className="relative group cursor-pointer"
            onClick={handleClick}
          >
            <img 
              src={data.src} 
              alt="Source image" 
              className="w-full h-auto rounded mb-2 object-cover border border-gray-200"
              style={{ maxHeight: '100px' }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
              <Upload className="w-4 h-4 text-white" />
              <span className="text-white text-xs ml-1">Change</span>
            </div>
          </div>
        ) : (
          <div 
            className="w-full h-[100px] bg-gray-50 border border-gray-200 rounded mb-2 flex flex-col items-center justify-center text-gray-500 text-xs cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={handleClick}
          >
            <Plus className="h-6 w-6 mb-1" />
            <span>Click to upload</span>
          </div>
        )}
        
        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      
      {/* Handle positioned at the bottom */}
      <div className="px-3 pb-2 flex justify-end relative h-6">
        <Handle
          type="source"
          position={Position.Right}
          className="w-9 h-9 rounded-full -mr-4 bg-accent border-2 border-gray-200"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>
    </Card>
  );
};

export default memo(ImageNode);
