import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { ImageNodeData } from '@/types';

const ImageNode = ({ data, selected }: NodeProps<ImageNodeData>) => {
  return (
    <Card className={`shadow-md w-[180px] bg-white ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="bg-blue-500 text-white px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move">
        <span>Source Image</span>
      </div>
      
      <div className="p-3">
        {data.src ? (
          <img 
            src={data.src} 
            alt="Source image" 
            className="w-full h-auto rounded mb-2 object-cover"
            style={{ maxHeight: '100px' }}
          />
        ) : (
          <div className="w-full h-[100px] bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400 text-xs">
            No image uploaded
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
