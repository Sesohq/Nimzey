import { Handle, Position, NodeProps } from 'reactflow';
import { OutputNodeData } from '@/types';
import { cn } from '@/lib/utils';

const OutputNode = ({ data, selected }: NodeProps<OutputNodeData>) => {
  const { preview, isActive } = data;

  return (
    <div 
      className={cn(
        "flex flex-col items-center min-w-[160px] bg-black border-2 rounded-md overflow-hidden",
        selected ? "border-yellow-400" : isActive ? "border-green-500" : "border-neutral-700"
      )}
    >
      {/* Input handle (left side) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-gray-400"
        style={{ left: -17 }}
      />
      
      {/* Node Header */}
      <div className={cn(
        "w-full px-3 py-2 text-center font-mono",
        isActive ? "bg-green-800" : "bg-neutral-800"
      )}>
        <div className="flex items-center justify-center space-x-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isActive ? "bg-green-400" : "bg-neutral-400"
          )} />
          <div className="text-sm text-white font-medium">
            // OUTPUT
          </div>
        </div>
      </div>
      
      {/* Preview */}
      <div className="w-full h-[100px] bg-neutral-900 flex items-center justify-center">
        {preview ? (
          <img 
            src={preview} 
            alt="Output preview" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-neutral-500 text-xs uppercase text-center">
            {isActive ? "Connect a filter" : "Inactive"}
          </div>
        )}
      </div>
      
      {/* Status indicator */}
      <div className="w-full px-3 py-1 text-[10px] bg-neutral-800 text-neutral-400">
        {isActive ? (
          <div className="flex items-center justify-center space-x-1">
            <span className="text-green-400">●</span>
            <span>ACTIVE</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-1">
            <span className="text-neutral-500">○</span>
            <span>INACTIVE</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputNode;