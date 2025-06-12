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
    <div className={`bg-gray-800 border border-gray-700 rounded-lg shadow-lg w-[200px] ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="bg-gray-700 text-white px-3 py-2 rounded-t-lg text-sm font-medium flex items-center justify-between cursor-move">
        <span>Image</span>
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
            className="w-full h-[100px] bg-gray-600 rounded mb-2 flex flex-col items-center justify-center text-gray-300 text-xs cursor-pointer hover:bg-gray-500 transition-colors"
            onClick={handleClick}
          >
            <Plus className="h-6 w-6 mb-1" />
            <span>Click to upload image</span>
            <span className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, etc.</span>
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
      
      <div className="px-3 pb-2 flex justify-end relative h-6">
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 rounded-full -mr-1.5 bg-blue-500 border-2 border-gray-800"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>
    </div>
  );
};

export default memo(ImageNode);
