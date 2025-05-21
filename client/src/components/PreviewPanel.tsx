import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Node, Edge } from 'reactflow';
import { FilterNodeData, ImageNodeData } from '@/types';
import { Download, Maximize2, Minimize2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PreviewPanelProps {
  width: number;
  selectedNode: Node<FilterNodeData | ImageNodeData> | null;
  nodePreview: string | null;
  processedImage: string | null;
  processedImages?: Record<string, string>; // Add processedImages map
  onExportImage: (format?: string) => void;
  nodes: Node[];
  edges: Edge[];
  isProcessing?: boolean;
}

export default function PreviewPanel({ 
  width, 
  selectedNode, 
  nodePreview, 
  processedImage,
  processedImages = {},
  onExportImage,
  nodes,
  edges,
  isProcessing = false
}: PreviewPanelProps) {
  const [previewSize, setPreviewSize] = useState<'default' | 'large'>('default');
  const [exportFormat, setExportFormat] = useState('png');
  
  // Toggle between default and large preview
  const togglePreviewSize = () => {
    setPreviewSize(previewSize === 'default' ? 'large' : 'default');
  };
  
  // Handle export button click
  const handleExport = () => {
    onExportImage(exportFormat);
  };
  
  // Get the display image
  const displayImage = processedImage || nodePreview;
  
  // Determine if we should show loading state
  const showLoading = isProcessing || !displayImage;
  
  // Get node info to display
  const nodeInfo = selectedNode 
    ? `${selectedNode.data.label || 'Node'} (${selectedNode.id})`
    : 'Final Output';
  
  return (
    <div className="h-full border-l border-gray-800 bg-gray-900 text-white overflow-hidden" style={{ width: `${width}px` }}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Preview</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePreviewSize}
          >
            {previewSize === 'default' ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Main preview area */}
        <div className={`relative overflow-hidden ${
          previewSize === 'large' ? 'flex-grow' : 'h-64'
        }`}>
          {showLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              {isProcessing ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  <span>Processing...</span>
                </>
              ) : (
                <span className="text-gray-500">No preview available</span>
              )}
            </div>
          ) : (
            <img 
              src={displayImage || ''} 
              alt="Preview" 
              className="w-full h-full object-contain bg-gray-800" 
            />
          )}
          
          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
            {nodeInfo}
          </div>
        </div>
        
        {/* Export controls - only show when there's a processed image */}
        {processedImage && (
          <div className="mt-4 space-y-4">
            <h3 className="text-sm font-medium">Export Options</h3>
            <div className="flex gap-2">
              <Select
                value={exportFormat}
                onValueChange={setExportFormat}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpg">JPEG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}