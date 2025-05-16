import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { OutputNodeData } from '@/types';
import { CheckCircle } from 'lucide-react';

const OutputNode = ({ data, selected }: NodeProps<OutputNodeData>) => {
  return (
    <Card className={`shadow-md w-[180px] bg-white ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="bg-green-600 text-white px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move">
        <span>Final Output</span>
        {data.isActive && (
          <CheckCircle className="h-4 w-4 text-white" />
        )}
      </div>
      
      <div className="p-3">
        {data.preview ? (
          <img 
            src={data.preview} 
            alt="Output preview" 
            className="w-full h-auto rounded mb-2 object-cover"
            style={{ maxHeight: '100px' }}
          />
        ) : (
          <div className="w-full h-[100px] bg-gray-100 rounded mb-2 flex flex-col items-center justify-center text-gray-400 text-xs">
            <span>No Input Connected</span>
          </div>
        )}
        <div className="text-xs text-center text-gray-500 mt-1">
          {data.isActive ? 
            "Active Output" : 
            "Connect to set as output"
          }
        </div>
      </div>
      
      <div className="px-3 pb-2 flex justify-start relative h-6">
        <Handle
          id="in"
          type="target"
          position={Position.Left}
          style={{ 
            left: -17, 
            top: 18, 
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

export default memo(OutputNode);