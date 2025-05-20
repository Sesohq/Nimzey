/**
 * WebGLPreviewPanel.tsx
 * 
 * WebGL-accelerated preview panel for the filter graph.
 * Provides high-performance rendering using the GPU with adaptive quality.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { FilterNodeData, ImageNodeData } from '@/types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Download, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import WebGLFilterCanvas from './WebGLFilterCanvas';

interface WebGLPreviewPanelProps {
  width: number;
  selectedNode: Node<FilterNodeData | ImageNodeData> | null;
  nodePreview: string | null;
  processedImage?: string | null;
  processedImages?: Record<string, string>;
  nodes: Node[];
  edges: Edge[];
  onExportImage: (format?: string) => void;
  isProcessing?: boolean;
  qualityLevel?: 'preview' | 'draft' | 'full'; 
  onQualityChange?: (quality: 'preview' | 'draft' | 'full') => void;
}

const WebGLPreviewPanel: React.FC<WebGLPreviewPanelProps> = ({
  width,
  selectedNode,
  nodePreview,
  processedImage,
  processedImages,
  nodes,
  edges,
  onExportImage,
  isProcessing = false,
  qualityLevel = 'draft',
  onQualityChange
}) => {
  const [expanded, setExpanded] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(width);
  const [canvasHeight, setCanvasHeight] = useState(width);
  const [exportFormat, setExportFormat] = useState<string>('png');
  const [hoverPosition, setHoverPosition] = useState<{ x: number, y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [localProcessing, setLocalProcessing] = useState(false);
  const [localNodePreview, setLocalNodePreview] = useState<string | null>(null);
  
  // Calculate the preview container size
  useEffect(() => {
    const calculateSize = () => {
      // Default aspect ratio if no nodes exist
      let aspectRatio = 1;
      
      // Find an image node to determine aspect ratio
      const imageNode = nodes.find(node => node.type === 'imageNode');
      if (imageNode && imageNode.data) {
        const imageData = imageNode.data as any;
        if (imageData.width && imageData.height) {
          aspectRatio = imageData.width / imageData.height;
        }
      }
      
      // Calculate height based on width and aspect ratio
      const calculatedHeight = width / aspectRatio;
      
      // Update canvas dimensions
      setCanvasWidth(expanded ? window.innerWidth * 0.8 : width);
      setCanvasHeight(expanded ? window.innerWidth * 0.8 / aspectRatio : calculatedHeight);
    };
    
    calculateSize();
    
    // Add resize listener for expanded mode
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, [width, expanded, nodes]);
  
  // Handle external node preview
  useEffect(() => {
    setLocalNodePreview(nodePreview);
  }, [nodePreview]);
  
  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  // Handle mouse move for position tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewContainerRef.current) return;
    
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    
    setHoverPosition({ x, y });
  };
  
  // Handle preview generated callback
  const handlePreviewGenerated = (dataUrl: string | null) => {
    if (selectedNode) {
      setLocalNodePreview(dataUrl);
    }
  };
  
  // Handle processing state change
  const handleProcessingStateChange = (processing: boolean) => {
    setLocalProcessing(processing);
  };
  
  // Handle export click
  const handleExportClick = () => {
    onExportImage(exportFormat);
  };
  
  // Handle quality change
  const handleQualityChange = (quality: string) => {
    if (quality === 'preview' || quality === 'draft' || quality === 'full') {
      if (onQualityChange) {
        onQualityChange(quality);
      }
    }
  };
  
  // Determine which image to display
  const displayPreview = selectedNode ? localNodePreview : null;
  
  return (
    <div 
      className={`relative bg-slate-800 rounded-lg overflow-hidden transition-all duration-300 ${
        expanded ? 'fixed inset-0 z-50 m-8 flex flex-col' : ''
      }`}
      style={{ width: expanded ? 'auto' : `${width}px` }}
      ref={previewContainerRef}
    >
      {/* Header with controls */}
      <div className="flex justify-between items-center p-3 bg-slate-700">
        <div className="text-white font-medium">
          {selectedNode ? `Preview: ${selectedNode.data.label || 'Node'}` : 'Output Preview'}
        </div>
        <div className="flex items-center space-x-2">
          {/* Quality selector */}
          <Select value={qualityLevel} onValueChange={handleQualityChange}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue placeholder="Quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preview">Preview</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="full">Full</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Zoom controls */}
          <Button variant="ghost" onClick={handleZoomOut} className="h-8 w-8 p-0">
            <ZoomOut className="h-4 w-4 text-white" />
          </Button>
          <div className="text-white text-xs">{Math.round(zoom * 100)}%</div>
          <Button variant="ghost" onClick={handleZoomIn} className="h-8 w-8 p-0">
            <ZoomIn className="h-4 w-4 text-white" />
          </Button>
          
          {/* Expand/collapse button */}
          <Button 
            variant="ghost" 
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? 
              <Minimize2 className="h-4 w-4 text-white" /> : 
              <Maximize2 className="h-4 w-4 text-white" />
            }
          </Button>
        </div>
      </div>
      
      {/* Preview content */}
      <div 
        className="relative flex justify-center items-center bg-slate-900 overflow-hidden"
        style={{ 
          height: expanded ? 'calc(100% - 106px)' : `${canvasHeight}px`,
        }}
      >
        {/* WebGL canvas */}
        <div 
          className="relative transition-transform origin-center"
          style={{ 
            transform: `scale(${zoom})`,
            width: canvasWidth, 
            height: canvasHeight
          }}
        >
          <WebGLFilterCanvas
            nodes={nodes}
            edges={edges}
            width={canvasWidth}
            height={canvasHeight}
            selectedNodeId={selectedNode?.id || null}
            onPreviewGenerated={handlePreviewGenerated}
            onProcessingStateChange={handleProcessingStateChange}
            qualityLevel={qualityLevel}
          />
          
          {/* Fallback image preview (if needed) */}
          {displayPreview && (
            <img 
              src={displayPreview} 
              alt="Node preview"
              className="absolute inset-0 w-full h-full object-contain opacity-0"
              style={{ opacity: localProcessing ? 0 : 0 }} // Only show if WebGL fails
            />
          )}
        </div>
        
        {/* Loading overlay */}
        {(isProcessing || localProcessing) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="flex flex-col items-center">
              <LoadingSpinner size="lg" />
              <div className="text-white mt-2">Processing...</div>
            </div>
          </div>
        )}
        
        {/* Mouse position info overlay (only in expanded mode) */}
        {expanded && hoverPosition && (
          <div 
            className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white p-1 text-xs rounded"
          >
            {hoverPosition.x}, {hoverPosition.y}
          </div>
        )}
      </div>
      
      {/* Footer with export controls */}
      <div className="flex justify-between items-center p-3 bg-slate-700">
        <div className="text-white text-xs">
          {selectedNode ? 'Node Preview' : 'Processed Output'}
        </div>
        <div className="flex items-center space-x-2">
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={handleExportClick} className="h-8 text-sm py-0">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WebGLPreviewPanel;