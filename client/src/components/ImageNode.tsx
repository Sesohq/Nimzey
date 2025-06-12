import { memo, useRef, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { ImageNodeData, NodeColorTag } from '@/types';
import { Upload, Plus, Settings, ChevronDown, ChevronUp, Layers, TagIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import NodeControls from './NodeControls';

interface ExtendedNodeProps extends NodeProps<ImageNodeData> {
  onUploadImage?: (file: File) => void;
}

// Color tag backgrounds
const colorTagBg: Record<NodeColorTag, string> = {
  default: 'bg-gray-600',
  red: 'bg-red-600',
  orange: 'bg-orange-600',
  yellow: 'bg-yellow-500',
  green: 'bg-green-600',
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  pink: 'bg-pink-600'
};

const ImageNode = ({ data, selected, onUploadImage }: ExtendedNodeProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState(data.collapsed || false);
  const [showSettings, setShowSettings] = useState(false);
  
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

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed(!collapsed);
  };

  const handleToggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings(!showSettings);
  };

  const handleChangeColorTag = (colorTag: NodeColorTag) => {
    // Color tag change would need to be implemented in the parent component
    console.log('Color tag changed:', colorTag);
  };

  return (
    <Card className={`shadow-md w-[220px] bg-white ${selected ? 'ring-2 ring-primary' : ''}`}>
      {/* Header */}
      <div className={`${colorTagBg[(data.colorTag as NodeColorTag) || 'default']} text-white px-3 py-2 rounded-t-md text-sm font-medium flex items-center justify-between cursor-move`}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>Source Image</span>
          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-white/20 text-white border-white/30">
            utility
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggleSettings}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <Settings className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Node Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggleCollapse}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{collapsed ? 'Expand' : 'Collapse'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Node settings panel */}
      {showSettings && (
        <div className="p-3 border-b border-gray-200">
          <div>
            <Label className="block text-xs text-gray-500 mb-1">Color Tag</Label>
            <Select 
              value={(data.colorTag as NodeColorTag) || 'default'} 
              onValueChange={(value) => {
                handleChangeColorTag(value as NodeColorTag);
              }}
            >
              <SelectTrigger className="w-full text-xs h-8" onClick={(e) => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="yellow">Yellow</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="pink">Pink</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {!collapsed && (
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
                style={{ maxHeight: '120px' }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                <Upload className="w-6 h-6 text-white" />
                <span className="text-white text-xs ml-1">Change image</span>
              </div>
            </div>
          ) : (
            <div 
              className="w-full h-[120px] bg-gray-100 rounded mb-2 flex flex-col items-center justify-center text-gray-400 text-xs cursor-pointer hover:bg-gray-200 transition-colors"
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
      )}
      
      <div className="px-3 pb-2 flex justify-end relative h-6">
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 rounded-full -mr-1 bg-gray-600"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>
    </Card>
  );
};

export default memo(ImageNode);
