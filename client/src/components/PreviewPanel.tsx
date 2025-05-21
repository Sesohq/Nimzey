import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Node, Edge } from 'reactflow';
import { FilterNodeData, ImageNodeData } from '@/types';
import { Maximize2, Minimize2, ExternalLink, X, Settings } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import PreviewQualityControl from './PreviewQualityControl';

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
  qualityLevel?: 'preview' | 'draft' | 'full';
  onQualityChange?: (quality: 'preview' | 'draft' | 'full') => void;
}

export default function PreviewPanel({ 
  width: initialWidth, 
  selectedNode, 
  nodePreview,
  processedImage,
  processedImages = {},
  onExportImage,
  nodes,
  edges,
  isProcessing = false,
  qualityLevel = 'draft',
  onQualityChange
}: PreviewPanelProps) {
  const [exportFormat, setExportFormat] = useState('png');
  const [width, setWidth] = useState(initialWidth);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDetached, setIsDetached] = useState(false);
  const [detachedPosition, setDetachedPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [dockArea, setDockArea] = useState(false); // Track if panel is in docking area
  const detachedWindowRef = useRef<Window | null>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  
  // Reference to the docked panel container
  const mainPanelRef = useRef<HTMLDivElement>(null);

  // Get all upstream nodes from a given node
  const getUpstreamNodes = (nodeId: string): Node[] => {
    const result: Node[] = [];
    const sourceEdges = edges.filter(edge => edge.target === nodeId);
    
    for (const edge of sourceEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode) {
        result.push(sourceNode);
        // Recursively get all upstream nodes
        const upstreamNodes = getUpstreamNodes(sourceNode.id);
        result.push(...upstreamNodes);
      }
    }
    
    return result;
  };

  // Get the filter chain (selected node and all upstream nodes)
  const getFilterChain = (node: Node<FilterNodeData | ImageNodeData>) => {
    const isSourceNode = node.type === 'imageNode';
    const nodeChain = [...getUpstreamNodes(node.id), node];
    
    return (
      <div className="space-y-4">
        {nodeChain.map((chainNode) => {
          const isChainNodeSource = chainNode.type === 'imageNode';
          const nodeLabel = isChainNodeSource 
            ? 'Source Image' 
            : (chainNode.data as FilterNodeData).label;
          
          const isEnabled = isChainNodeSource 
            ? true 
            : (chainNode.data as FilterNodeData).enabled;
          
          // Get the preview image for this node if available
          const nodePreviewImg = isChainNodeSource 
            ? (chainNode.data as ImageNodeData).src 
            : processedImages[chainNode.id];
            
          return (
            <div key={chainNode.id} className="space-y-1">
              <div className="flex items-center text-sm">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    isChainNodeSource 
                      ? 'bg-blue-500' 
                      : isEnabled 
                        ? 'bg-accent' 
                        : 'bg-gray-600'
                  } mr-2`}
                />
                <span className={`${!isEnabled ? 'line-through text-gray-500' : ''}`}>
                  {nodeLabel}
                </span>
              </div>
              {nodePreviewImg && (
                <div className="relative w-full h-24 bg-gray-900 rounded overflow-hidden">
                  <img 
                    src={nodePreviewImg} 
                    alt={nodeLabel}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Toggle fullscreen state
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };
  
  // Handle mouse down event on the detached panel header
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - detachedPosition.x,
      y: e.clientY - detachedPosition.y
    });
  };
  
  // Handle mouse move event for dragging the detached panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && isDetached) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Check if panel is near the right edge of the screen (docking area)
        const isNearRightEdge = window.innerWidth - newX - width < 20;
        setDockArea(isNearRightEdge);
        
        setDetachedPosition({
          x: newX,
          y: newY
        });
      }
      
      if (isResizing && !isDetached) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 150 && newWidth < window.innerWidth * 0.5) {
          setWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      
      // If panel is in docking area when released, dock it
      if (dockArea) {
        setIsDetached(false);
        setWidth(initialWidth);
      }
      
      setDockArea(false);
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isDetached, dragStart, detachedPosition, initialWidth, dockArea, width]);

  // Get the display image based on selection state
  const getDisplayImage = () => {
    // Show loading spinner when processing is in progress
    if (isProcessing) {
      return (
        <div className={`w-full flex flex-col items-center justify-center gap-3 ${isFullscreen ? 'h-[80vh]' : 'h-[300px]'}`}>
          <LoadingSpinner size="lg" />
          <div className="text-sm text-gray-300">Processing filters...</div>
        </div>
      );
    }
    
    // If a node is selected, show its preview
    if (nodePreview) {
      return (
        <img 
          src={nodePreview} 
          alt="Preview" 
          className={`${isFullscreen ? 'max-h-[80vh] max-w-full' : 'w-full h-full'} object-cover`} 
        />
      );
    }
    
    // If no node is selected but final image is processed, show that
    if (processedImage) {
      return (
        <img 
          src={processedImage} 
          alt="Final result" 
          className={`${isFullscreen ? 'max-h-[80vh] max-w-full' : 'w-full h-full'} object-cover`} 
        />
      );
    }
    
    // Otherwise show a placeholder
    return <div className="text-gray-500 text-center">No image available</div>;
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-8">
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute top-4 right-4" 
          onClick={toggleFullscreen}
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
        <div className="max-w-6xl max-h-full">
          {getDisplayImage()}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Docking indicator - only shown when dragging near edge */}
      {isDetached && dockArea && (
        <div 
          className="fixed right-0 top-0 w-[3px] h-screen bg-blue-500 z-50 pointer-events-none opacity-50" 
        />
      )}
      
      {/* Semi-transparent overlay over the docking area */}
      {isDetached && dockArea && (
        <div 
          className="fixed right-0 top-0 h-screen z-30 border-l-2 border-blue-500 bg-blue-500 bg-opacity-10"
          style={{ 
            width: '100px', 
            pointerEvents: 'none',
            opacity: dockArea ? 0.8 : 0.4
          }}
        >
          <div className="flex h-full items-center justify-center">
            <div className="text-blue-500 text-xs font-medium rotate-90 transform">
              DOCK HERE
            </div>
          </div>
        </div>
      )}

      <div 
        ref={mainPanelRef}
        className={`bg-black text-white flex flex-col relative 
          ${isDetached ? 'fixed z-40 shadow-xl rounded-lg overflow-visible border border-gray-700' : 'fixed right-0 top-0 h-screen overflow-visible border-l border-gray-700 flex'} 
          ${dockArea ? 'ring-2 ring-blue-500' : ''}`}
        style={{ 
          width: `${width}px`,
          ...(isDetached ? { 
            top: `${detachedPosition.y}px`, 
            left: `${detachedPosition.x}px`,
            height: 'auto',
            maxHeight: '80vh',
            transition: dockArea ? 'box-shadow 0.2s ease' : 'none',
            boxShadow: dockArea ? '0 0 0 4px rgba(59, 130, 246, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
          } : {
            boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.2)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          })
        }}
      >
        {/* Draggable header for the detached window */}
        <div 
          className={`p-3 flex justify-between items-center border-b border-gray-700 ${isDetached ? 'cursor-move' : ''}`}
          onMouseDown={isDetached ? handleMouseDown : undefined}
        >
          <div className="flex items-center">
            <div className="w-6 h-6 flex items-center justify-center mr-2 bg-black rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-lg">Preview</span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Add quality control here */}
            {onQualityChange && (
              <PreviewQualityControl className="mr-2" />
            )}
            
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Fullscreen">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                if (isDetached) {
                  // Reset to initial state when docking
                  setIsDetached(false);
                  setWidth(initialWidth);
                  setDetachedPosition({ x: 100, y: 100 });
                } else {
                  setIsDetached(true);
                }
              }} 
              title={isDetached ? "Dock" : "Detach"}
            >
              {isDetached ? <X className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Main preview section */}
        <div className="p-3 flex-shrink-0">
          <div className="text-xs text-white font-mono mb-1 flex items-center">
            <span className="text-gray-400 mr-1">//</span> 
            Selected Node: <span className="ml-1 text-yellow-400">{selectedNode ? 
              (selectedNode.type === 'imageNode' ? 'Source Image' : (selectedNode.data as FilterNodeData).label) 
              : 'None'}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-md overflow-hidden h-[300px] flex items-center justify-center">
            {getDisplayImage()}
          </div>
        </div>
        
        {/* Resize handle - only visible when not detached */}
        {!isDetached && (
          <div 
            ref={resizeHandleRef}
            className="absolute left-[-8px] top-0 w-5 h-full cursor-ew-resize group flex items-center justify-center"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsResizing(true);
            }}
          >
            <div className="h-[50px] w-[3px] bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"/>
          </div>
        )}
        
        {/* Filter chain section - grows to fill space */}
        <div className="flex-grow flex flex-col border-t border-gray-700 min-h-0">
          <div className="p-3 pb-1 flex-shrink-0">
            <div className="text-xs text-white font-mono mb-2 flex items-center">
              <span className="text-gray-400 mr-1">//</span> Filter Chain
            </div>
          </div>
          <div className="px-3 overflow-y-auto flex-grow" style={{maxHeight: 'calc(100vh - 530px)'}}>
            {selectedNode ? (
              getFilterChain(selectedNode)
            ) : (
              // If no node selected, find the last nodes in the chain (with no outgoing edges)
              (() => {
                // Find nodes that don't have outgoing connections (end of the chain)
                const nodeIds = nodes.map(node => node.id);
                const nodesWithOutgoingEdges = new Set(edges.map(edge => edge.source));
                const endNodes = nodes.filter(node => 
                  nodeIds.includes(node.id) && !nodesWithOutgoingEdges.has(node.id) && node.type !== 'imageNode'
                );
                
                if (endNodes.length > 0) {
                  // Get the first end node and its entire chain
                  return getFilterChain(endNodes[0]);
                } else {
                  // Fallback to using the source node
                  const sourceNode = nodes.find(node => node.type === 'imageNode');
                  return sourceNode ? (
                    getFilterChain(sourceNode)
                  ) : (
                    <div className="text-sm text-gray-500">No filter chain available</div>
                  );
                }
              })()
            )}
          </div>
        </div>
        

      </div>

      {/* Export button and settings - completely outside the panel flow */}
      <div 
        className="fixed z-40 bottom-0 border-t border-gray-700" 
        style={{
          backgroundColor: '#000',
          width: `${width}px`, 
          right: isDetached ? 'auto' : 0,
          left: isDetached ? `${detachedPosition.x}px` : 'auto',
          transform: isDetached ? `translateY(${detachedPosition.y + 500}px)` : 'none'
        }}
      >
        <div className="p-4 flex items-center justify-between">
          <div 
            className={`btn-glitch special-filters flex-1 ${!processedImage ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => processedImage && onExportImage(exportFormat)}
            style={{marginBottom: 0}}
          >
            <div className="text-container font-semibold">
              // Export Image
            </div>
            <div className="icon-container" style={{ backgroundColor: '#FFC107' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Settings button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-2 bg-black border-gray-700 hover:bg-gray-900 text-white"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            
            <DialogContent className="bg-black border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="font-mono text-white">Export Settings</DialogTitle>
                <div className="text-xs text-gray-400 mt-1 font-mono">
                  Configure your image export options
                </div>
              </DialogHeader>
              <div className="py-4">
                <Label className="block text-xs text-gray-300 mb-1 font-mono">Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="w-full bg-gray-900 border border-gray-700 rounded">
                    <SelectValue placeholder="PNG" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="webp">WEBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}