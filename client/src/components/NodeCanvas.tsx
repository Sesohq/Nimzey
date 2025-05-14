import { useCallback, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  useReactFlow,
  NodeTypes
} from 'reactflow';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';
import FilterNode from './FilterNode';
import ImageNode from './ImageNode';
import BlendNode from './BlendNode';
import CustomNode from './CustomNode';
import NoiseGeneratorNode from './NoiseGeneratorNode';
import { Badge } from '@/components/ui/badge';

// Using a renderNode function instead of creating new nodeTypes object on each render
const nodeTypes: NodeTypes = {
  filterNode: FilterNode,
  imageNode: ImageNode,
  blendNode: BlendNode,
  customNode: CustomNode,
  noiseGenerator: NoiseGeneratorNode
};

interface NodeCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick: (nodeId: string) => void;
  selectedNodeId: string | null;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomLevel: number;
  onUploadImage?: (file: File) => void;
}

export default function NodeCanvas({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onNodeClick,
  selectedNodeId,
  zoomIn,
  zoomOut,
  zoomLevel,
  onUploadImage
}: NodeCanvasProps) {
  // NodeCanvas component - renders the node-based editor
  const reactFlowInstance = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handlePaneClick = (event: React.MouseEvent) => {
    // Only clear selections if not in multi-select mode
    const isMultiSelectMode = event.ctrlKey || event.metaKey || event.shiftKey;
    
    if (!isMultiSelectMode) {
      // Deselect all nodes
      nodes.forEach(node => {
        if (node.selected) {
          onNodesChange([{ type: 'select', id: node.id, selected: false }]);
        }
      });
      
      // Clear the focused node
      onNodeClick('');
    }
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    // Support for multi-select with keyboard modifiers
    const isCtrlPressed = event.ctrlKey || event.metaKey; // metaKey for Mac
    const isShiftPressed = event.shiftKey;
    
    if (isCtrlPressed || isShiftPressed) {
      // Multi-select mode - toggle selection without changing the focused node
      const updatedNode = {
        ...node,
        selected: !node.selected
      };
      
      // Update node selection state
      onNodesChange([{ type: 'select', id: node.id, selected: updatedNode.selected }]);
    } else {
      // Single select mode - normal behavior
      onNodeClick(node.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <div className="bg-gray-100 p-2 flex items-center border-b border-gray-300">
        <div className="flex space-x-2">
          <Button size="icon" variant="ghost" onClick={zoomIn}>
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={zoomOut}>
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Badge variant="outline" className="text-sm px-2 py-1 bg-white border border-gray-300 rounded text-gray-800 font-medium">
            {zoomLevel}%
          </Badge>
        </div>
        <div className="flex items-center ml-auto">
          <div className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1 mr-3">
            Use Ctrl+Click (⌘+Click on Mac) or Shift+Click to select multiple nodes
          </div>
          <div className="text-sm text-gray-500">
            Drag to connect nodes • Double-click to delete connections
          </div>
        </div>
      </div>
      
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          snapToGrid={true}
          snapGrid={[15, 15]}
          onDragOver={onDragOver}
          deleteKeyCode="Delete"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
