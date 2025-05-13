import { useState } from 'react';
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
  width, 
  selectedNode, 
  nodePreview,
  processedImage,
  onExportImage,
  nodes,
  edges 
}: PreviewPanelProps) {
  const [exportFormat, setExportFormat] = useState('png');
  const [exportQuality, setExportQuality] = useState(90);

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

  // Get the display image based on selection state
  const getDisplayImage = () => {
    // If a node is selected, show its preview
    if (nodePreview) {
      return (
        <img 
          src={nodePreview} 
          alt="Preview" 
          className="w-full h-auto"
        />
      );
    }
    
    // If no node is selected but we have a processed image, show that
    if (processedImage) {
      return (
        <img 
          src={processedImage} 
          alt="Final Output" 
          className="w-full h-auto"
        />
      );
    }
    
    // Otherwise show a placeholder
    return (
      <div className="w-full h-[200px] flex items-center justify-center text-gray-400">
        No image available
      </div>
    );
  };

  return (
    <div className="w-72 bg-darkBg text-white flex flex-col" style={{ width: `${width}px` }}>
      <div className="p-3 bg-secondary font-medium">Preview</div>
      
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
      
      <div className="p-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Filter Chain</div>
        <ScrollArea className="h-[150px]">
          {selectedNode ? (
            getFilterChain(selectedNode)
          ) : (
            <div className="text-sm text-gray-500">No node selected</div>
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
            <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded">{exportQuality}%</span>
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
