import { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FilterNodeData } from '@/types';
import { cn } from '@/lib/utils';
import NodeControls from './NodeControls';
import { Badge } from '@/components/ui/badge';
import { ViewIcon } from 'lucide-react';

const ResultNode = ({ data, selected, id }: NodeProps<FilterNodeData>) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showLargePreview, setShowLargePreview] = useState(false);
  
  // Update preview image when data changes
  useEffect(() => {
    console.log("ResultNode: Preview data updated", data.preview ? "has preview" : "no preview");
    if (data.preview) {
      setPreviewImage(data.preview);
    }
  }, [data.preview]);
  
  // Log when the component mounts or updates
  useEffect(() => {
    console.log("ResultNode rendered. Has preview:", !!previewImage);
  }, [previewImage]);
  
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-md border border-slate-200 w-72',
      selected ? 'ring-2 ring-blue-500' : ''
    )}>
      {/* Input Handle - Takes the processed image as input */}
      <div className="absolute left-0 top-[50%] flex items-center">
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="w-9 h-9 rounded-full -ml-4 bg-amber-400"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
        
        {/* Small visual indicator for input */}
        <div className="absolute top-[50%] left-[-10px] transform -translate-y-1/2 w-5 h-5 rounded-full opacity-40 flex items-center justify-center pointer-events-none border-2 border-dashed border-amber-400">
          <div className="text-[8px] font-bold text-amber-600">IN</div>
        </div>
        
        <Badge variant="outline" className="ml-6 text-[10px] bg-white shadow-sm">
          Source
        </Badge>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-green-500 mr-2 flex items-center justify-center">
              <ViewIcon className="w-3 h-3 text-white" />
            </div>
            <h3 className="font-medium text-sm text-slate-700">Result</h3>
          </div>
          <div className="flex items-center space-x-1">
            <NodeControls 
              onMinimizeNode={() => setIsMinimized(!isMinimized)}
              onRemoveNode={data.onRemoveNode}
            />
          </div>
        </div>
        
        {/* Result Preview Area */}
        <div 
          className="bg-gray-100 rounded border border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden"
          style={{ height: '130px' }}
          onClick={() => setShowLargePreview(!showLargePreview)}
        >
          {previewImage ? (
            <img 
              src={previewImage} 
              alt="Result preview" 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-xs text-gray-500 p-2 text-center">
              Connect a node to view the result
            </div>
          )}
        </div>
        
        {/* Large preview modal */}
        {showLargePreview && previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowLargePreview(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-3xl max-h-[80vh] overflow-auto p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Final Result</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={(e) => {
                  e.stopPropagation();
                  setShowLargePreview(false);
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <img 
                src={previewImage} 
                alt="Final result (large)" 
                className="max-w-full" 
              />
              
              <div className="mt-3 text-center">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    
                    // Create a temporary link and trigger download
                    const link = document.createElement('a');
                    link.href = previewImage;
                    link.download = 'filter-result.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  Download Result
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!isMinimized && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              This node displays the final processed image.
              <div className="mt-1">
                <span className="font-semibold">Tip:</span> Click the image to see a larger preview or download the result.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ResultNode);