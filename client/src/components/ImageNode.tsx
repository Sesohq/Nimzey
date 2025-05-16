import { memo, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { ImageNodeData } from '@/types';
import { Upload, Plus } from 'lucide-react';

interface ExtendedNodeProps extends NodeProps<ImageNodeData> {
  onUploadImage?: (file: File) => void;
}

const ImageNode = ({ data, selected, id, onUploadImage }: ExtendedNodeProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine if this is the main source image node (starting with 'source-') or an additional image node
  const isSourceNode = id.startsWith('source-');
  const nodeLabel = isSourceNode ? "Source Image" : "Image";
  
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
    <Card className={`shadow-md w-[180px] ${isSourceNode ? 'bg-white' : 'bg-blue-50'} ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className={`${isSourceNode ? 'bg-blue-500' : 'bg-blue-400'} text-white px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move`}>
        <span>{nodeLabel}</span>
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
          id="node-output"
          type="source"
          position={Position.Right}
          style={{ 
            right: -17,
            bottom: 0,
            top: 'auto',
            width: 8, 
            height: 8, 
            background: '#777777',
            borderRadius: '50%',
            border: '2px solid #333',
            zIndex: 10
          }}
        />
      </div>
    </Card>
  );
};

export default memo(ImageNode);
