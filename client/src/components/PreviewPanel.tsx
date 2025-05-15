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
import { Label } from '@/components/ui/label';
import { Node, Edge } from 'reactflow';
import { FilterNodeData, ImageNodeData } from '@/types';
import { Maximize2, Minimize2, ExternalLink, X } from 'lucide-react';
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
  width: initialWidth, 
  selectedNode, 
  nodePreview,
  processedImage,
  processedImages = {},
  onExportImage,
  nodes,
  edges,
  isProcessing = false
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
              
              {/* Display thumbnail preview if available */}
              {nodePreviewImg && (
                <div className="border border-gray-800 rounded overflow-hidden mt-1 h-20">
                  <img 
                    src={nodePreviewImg} 
                    alt={`Preview of ${nodeLabel}`}
                    className="w-full h-full object-cover bg-black"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Handle resizing the panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        // Use window width minus mouse position to calculate the new width
        // This ensures proper resizing from right side
        const windowWidth = window.innerWidth;
        const newWidth = Math.max(250, Math.min(600, windowWidth - e.clientX));
        setWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (isFullscreen) {
      setWidth(initialWidth);
    }
  };

  // Handle panel dragging when detached
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDetached) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleDrag = (e: React.MouseEvent) => {
    if (isDragging && isDetached) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const newX = detachedPosition.x + deltaX;
      const newY = detachedPosition.y + deltaY;
      
      // Check if panel is near the right edge of screen (docking zone)
      const dockZone = window.innerWidth - 100; // 100px from right edge
      const isNearDockZone = newX > dockZone;
      
      // Visual indication for docking
      setDockArea(isNearDockZone);
      
      // If released near the dock zone, dock it
      if (isNearDockZone && e.type === 'mouseup') {
        setIsDetached(false);
        setWidth(initialWidth);
        setDetachedPosition({ x: 100, y: 100 });
        setDockArea(false);
      } else {
        setDetachedPosition({
          x: newX,
          y: newY
        });
      }
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

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
          className={`w-full h-full object-contain ${isFullscreen ? 'max-h-[80vh]' : 'min-h-[300px]'}`}
        />
      );
    }
    
    // If no node is selected but we have a processed image, show that
    if (processedImage) {
      return (
        <img 
          src={processedImage} 
          alt="Final Output" 
          className={`w-full h-full object-contain ${isFullscreen ? 'max-h-[80vh]' : 'min-h-[300px]'}`}
        />
      );
    }
    
    // Otherwise show a placeholder
    return (
      <div className={`w-full flex items-center justify-center text-gray-400 ${isFullscreen ? 'h-[80vh]' : 'h-[300px]'}`}>
        No image available
      </div>
    );
  };
  
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setIsFullscreen(false)}>
        <div className="bg-black border border-gray-700 rounded-lg overflow-hidden max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <div className="bg-black text-white border-b border-gray-700 px-4 py-2 flex items-center justify-between h-[40px]">
            <div className="flex items-center">
              <div className="icon-container effect-filters mr-3" style={{width: '32px', height: '32px', minWidth: '32px'}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
              </div>
              <span className="text-lg">Preview (Fullscreen)</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-3">
            <div className="bg-black border border-gray-800 rounded-md overflow-hidden h-[80vh] flex items-center justify-center">
              {getDisplayImage()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Dock indicator appears when dragging panel */}
      {isDetached && isDragging && (
        <div 
          className="fixed right-0 top-0 h-full bg-blue-500/20 border-l-2 border-blue-500 z-30"
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
          ${isDetached ? 'fixed z-40 shadow-xl rounded-lg overflow-hidden border border-gray-700' : 'fixed right-0 top-0 h-screen overflow-hidden border-l border-gray-700'} 
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
            boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.2)'
          })
        }}
        onMouseMove={handleDrag}
        onMouseUp={(e) => {
          handleDrag(e); // Pass event to handleDrag to check if we're in dock zone
          setIsDragging(false);
        }}
      >
        {/* Header */}
        <div 
          className="bg-black text-white border-b border-gray-700 px-4 py-2 flex items-center justify-between cursor-move h-[40px] flex-shrink-0"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center">
            <div className="icon-container effect-filters mr-3" style={{width: '32px', height: '32px', minWidth: '32px'}}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
            </div>
            <span className="text-lg">Preview</span>
          </div>
          <div className="flex space-x-2">
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
          <div className="px-3 overflow-y-auto flex-grow" style={{maxHeight: 'calc(100vh - 500px)'}}>
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
        
        {/* Export options section */}
        <div className="p-3 border-t border-gray-700 bg-black flex-shrink-0">
          <div className="text-sm font-bold text-white mb-2 flex items-center font-mono">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            EXPORT OPTIONS
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="w-1/2 pr-1">
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
            <div className="w-1/2 pl-1 flex items-end">
              <div 
                className={`btn-glitch special-filters w-full ${!processedImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => processedImage && onExportImage(exportFormat)}
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
            </div>
          </div>
          
          {!processedImage && (
            <div className="text-xs text-amber-400 p-1 bg-black border border-amber-800 rounded flex items-center font-mono">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Upload an image and apply filters to enable export
            </div>
          )}
        </div>
      </div>
    </>
  );
}