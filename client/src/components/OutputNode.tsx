import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { OutputNodeData } from '@/types';

const OutputNode = ({ data, selected }: NodeProps<OutputNodeData>) => {
  const { preview, isActive } = data;
  
  return (
    <Card className={`shadow-md w-[160px] min-h-[120px] bg-black border-2 ${selected ? 'border-primary' : 'border-gray-700'} rounded-md overflow-hidden`}>
      {/* Input handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="input" 
        style={{ 
          left: -17,
          top: 20,
          width: 8,
          height: 8,
          background: '#777777',
          borderRadius: '50%',
          border: '2px solid #333',
        }} 
      />
      
      {/* Node Header */}
      <div className="w-full px-3 py-2 bg-gray-800 font-mono border-b border-gray-700">
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          <div className="text-sm text-white font-medium">// OUTPUT</div>
        </div>
      </div>
      
      {/* Preview or empty state */}
      <div className="flex items-center justify-center p-4" style={{ minHeight: '80px' }}>
        {preview ? (
          <img src={preview} alt="Output preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-neutral-500 text-xs text-center">
            {isActive ? "Connect a filter" : "Inactive"}
          </div>
        )}
      </div>
    </Card>
  );
};

export default memo(OutputNode);