import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MinusIcon } from 'lucide-react';
import { FilterNodeData } from '@/types';
import NodeControls from './NodeControls';

const FilterNode = ({ data, selected, id }: NodeProps<FilterNodeData>) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const handleParamChange = (paramName: string, value: number | string) => {
    if (data.onParamChange) {
      data.onParamChange(id, paramName, value);
    }
  };

  return (
    <Card className={`shadow-md w-[220px] bg-white ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div 
        className="bg-accent text-white px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move"
      >
        <span>{data.label}</span>
        <div className="flex space-x-1">
          <button 
            className="hover:bg-purple-700 rounded p-1" 
            onClick={handleToggleMinimize}
          >
            <MinusIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3">
          {data.params.map((param) => (
            <div key={param.name} className="mb-2">
              <Label className="block text-xs text-gray-500 mb-1">{param.label}</Label>
              
              {param.type === 'range' && (
                <div className="flex items-center">
                  <Slider
                    value={[param.value as number]}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    className="flex-1 mr-2"
                    onValueChange={(values) => handleParamChange(param.name, values[0])}
                  />
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    {param.value}{param.unit || ''}
                  </span>
                </div>
              )}
              
              {param.type === 'select' && (
                <Select 
                  value={param.value as string} 
                  onValueChange={(value) => handleParamChange(param.name, value)}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder={param.options?.[0]} />
                  </SelectTrigger>
                  <SelectContent>
                    {param.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="px-3 pb-2 flex justify-between relative">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-primary left-[-8px]"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-accent right-[-8px]"
        />
      </div>
    </Card>
  );
};

export default memo(FilterNode);
