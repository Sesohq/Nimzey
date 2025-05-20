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
import OutputNode from './OutputNode';
import ImageFilterNode from './ImageFilterNode';
import { Badge } from '@/components/ui/badge';

// Using a renderNode function instead of creating new nodeTypes object on each render
const nodeTypes: NodeTypes = {
  filterNode: FilterNode,
  imageNode: ImageNode,
  outputNode: OutputNode,
  imageFilterNode: ImageFilterNode
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
  const reactFlowInstance = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handlePaneClick = () => {
    // Deselect node when clicking on the pane
    onNodeClick('');
  };

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  };
  
  // Handle double-click on edges to delete them
  const handleEdgeDoubleClick = (_: React.MouseEvent, edge: Edge) => {
    // Create a remove change for this edge
    const removeChange: EdgeChange = {
      id: edge.id,
      type: 'remove',
    };
    
    // Apply the change
    onEdgesChange([removeChange]);
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          onNodeClick={handleNodeClick}
          onEdgeDoubleClick={handleEdgeDoubleClick}
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
          
          {/* Small hint for users about connections */}
          <div className="absolute top-2 right-2 z-10 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-gray-200">
            <div className="mb-1">Drag between handles to connect • Double-click on connections to delete</div>
            <div>Click the red disconnect button to remove parameter connections</div>
          </div>
        </ReactFlow>
      </div>
    </div>
  );
}
