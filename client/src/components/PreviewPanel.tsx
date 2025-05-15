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
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Node, Edge } from 'reactflow';
import { FilterNodeData, ImageNodeData } from '@/types';
import { Maximize2, Minimize2, ExternalLink, X } from 'lucide-react';

interface PreviewPanelProps {
  width: number;
  selectedNode: Node<FilterNodeData | ImageNodeData> | null;
  nodePreview: string | null;
  processedImage: string | null;
  onExportImage: (format?: string, quality?: number) => void;
  nodes: Node[];
  edges: Edge[];
}

export default function PreviewPanel({ 
  width: initialWidth, 
  selectedNode, 
  nodePreview,
  processedImage,
  onExportImage,
  nodes,
  edges 
}: PreviewPanelProps) {
  const [exportFormat, setExportFormat] = useState('png');
  const [exportQuality, setExportQuality] = useState(90);
  const [width, setWidth] = useState(initialWidth);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDetached, setIsDetached] = useState(false);
  const [detachedPosition, setDetachedPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const detachedWindowRef = useRef<Window | null>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Get all downstream nodes from a given node
  const getDownstreamNodes = (nodeId: string): Node[] => {
    const result: Node[] = [];
    const targetEdges = edges.filter(edge => edge.source === nodeId);
    
    for (const edge of targetEdges) {
      const targetNode = nodes.find(n => n.id === edge.target);
      if (targetNode) {
        result.push(targetNode);
        // Recursively get all downstream nodes
        const downstreamNodes = getDownstreamNodes(targetNode.id);
        result.push(...downstreamNodes);
      }
    }
    
    return result;
  };

  // Get the filter chain (selected node and all downstream nodes)
  const getFilterChain = (node: Node<FilterNodeData | ImageNodeData>) => {
    const isSourceNode = node.type === 'imageNode';
    const nodeChain = [node, ...getDownstreamNodes(node.id)];
    
    return (
      <div className="space-y-2">
        {nodeChain.map((chainNode) => {
          const isChainNodeSource = chainNode.type === 'imageNode';
          const nodeLabel = isChainNodeSource 
            ? 'Source Image' 
            : (chainNode.data as FilterNodeData).label;
          
          const isEnabled = isChainNodeSource 
            ? true 
            : (chainNode.data as FilterNodeData).enabled;
            
          return (
            <div key={chainNode.id} className="flex items-center text-sm">
              <div 
                className={`w-2 h-2 rounded-full ${
                  isChainNodeSource 
                    ? 'bg-blue-500' 
                    : isEnabled 
                      ? 'bg-accent' 
                      : 'bg-gray-600'
                } mr-2`}
              ></div>
              <span className={`${!isEnabled ? 'line-through text-gray-500' : ''}`}>
                {nodeLabel}
              </span>
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
        const newWidth = Math.max(250, Math.min(600, e.clientX - 10));
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
      setDetachedPosition({
        x: detachedPosition.x + deltaX,
        y: detachedPosition.y + deltaY
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Get the display image based on selection state
  const getDisplayImage = () => {
    // If a node is selected, show its preview
    if (nodePreview) {
      return (
        <img 
          src={nodePreview} 
          alt="Preview" 
          className={`w-full h-auto ${isFullscreen ? 'max-h-[80vh]' : ''}`}
        />
      );
    }
    
    // If no node is selected but we have a processed image, show that
    if (processedImage) {
      return (
        <img 
          src={processedImage} 
          alt="Final Output" 
          className={`w-full h-auto ${isFullscreen ? 'max-h-[80vh]' : ''}`}
        />
      );
    }
    
    // Otherwise show a placeholder
    return (
      <div className={`w-full flex items-center justify-center text-gray-400 ${isFullscreen ? 'h-[80vh]' : 'h-[200px]'}`}>
        No image available
      </div>
    );
  };
  
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setIsFullscreen(false)}>
        <div className="bg-darkBg rounded-lg overflow-hidden max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <div className="p-3 bg-secondary font-medium flex items-center justify-between">
            <span>Preview (Fullscreen)</span>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-3">
            <div className="bg-gray-800 rounded-md overflow-hidden">
              {getDisplayImage()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-darkBg text-white flex flex-col relative ${isDetached ? 'fixed z-40 shadow-xl rounded-lg overflow-hidden' : ''}`}
      style={{ 
        width: `${width}px`,
        ...(isDetached ? { 
          top: `${detachedPosition.y}px`, 
          left: `${detachedPosition.x}px`,
          height: 'auto',
          maxHeight: '80vh'
        } : {})
      }}
      onMouseMove={handleDrag}
      onMouseUp={() => setIsDragging(false)}
    >
      <div 
        className="p-3 bg-secondary font-medium flex items-center justify-between cursor-move"
        onMouseDown={handleMouseDown}
      >
        <span>Preview</span>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsDetached(!isDetached)} 
            title={isDetached ? "Dock" : "Detach"}
          >
            {isDetached ? <X className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-xs text-gray-400 mb-1">
          Selected Node: <span>{selectedNode ? 
            (selectedNode.type === 'imageNode' ? 'Source Image' : (selectedNode.data as FilterNodeData).label) 
            : 'None'}</span>
        </div>
        <div className="bg-gray-800 rounded-md overflow-hidden">
          {getDisplayImage()}
        </div>
      </div>
      
      {/* Resize handle - only visible when not detached */}
      {!isDetached && (
        <div 
          ref={resizeHandleRef}
          className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-transparent hover:bg-blue-500/30"
          onMouseDown={() => setIsResizing(true)}
          style={{ left: '-2px' }}
        ></div>
      )}
      
      <div className="p-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Filter Chain</div>
        <ScrollArea className="h-[150px]">
          {selectedNode ? (
            getFilterChain(selectedNode)
          ) : (
            // If no node selected, find the source node and show the full chain from it
            (() => {
              const sourceNode = nodes.find(node => node.type === 'imageNode');
              return sourceNode ? (
                getFilterChain(sourceNode)
              ) : (
                <div className="text-sm text-gray-500">No node selected</div>
              );
            })()
          )}
        </ScrollArea>
      </div>
      
      <div className="mt-auto p-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Export Settings</div>
        <div className="mb-2">
          <Label className="block text-xs text-gray-400 mb-1">Format</Label>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-full bg-gray-700 border border-gray-600 rounded">
              <SelectValue placeholder="PNG" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="webp">WEBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mb-3">
          <Label className="block text-xs text-gray-400 mb-1">Quality</Label>
          <div className="flex items-center">
            <Slider
              value={[exportQuality]}
              min={10}
              max={100}
              step={1}
              className="flex-1 mr-2"
              onValueChange={(values) => setExportQuality(values[0])}
            />
            <span className="text-xs font-mono bg-gray-600 px-2 py-1 rounded text-white font-medium">{exportQuality}%</span>
          </div>
        </div>
        <Button 
          className="w-full py-2 bg-primary hover:bg-primary/90"
          onClick={() => onExportImage(exportFormat, exportQuality)}
          disabled={!processedImage}
        >
          Export Final Image
        </Button>
      </div>
    </div>
  );
}
