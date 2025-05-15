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
import { Badge } from '@/components/ui/badge';

// Using a renderNode function instead of creating new nodeTypes object on each render
const nodeTypes: NodeTypes = {
  filterNode: FilterNode,
  imageNode: ImageNode
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

  const handlePaneClick = () => {
    // Deselect node when clicking on the pane
    onNodeClick('');
  };

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
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
          
          {/* Zoom controls moved to overlay in bottom-left corner */}
          <div className="absolute bottom-16 left-2 z-10 bg-white/80 backdrop-blur-sm p-1.5 rounded-md shadow-md border border-gray-200">
            <div className="flex flex-col space-y-1">
              <Button size="icon" variant="ghost" onClick={zoomIn} className="h-7 w-7">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className="text-xs px-1 py-0.5 bg-white border border-gray-300 rounded text-gray-800 font-medium text-center">
                {zoomLevel}%
              </Badge>
              <Button size="icon" variant="ghost" onClick={zoomOut} className="h-7 w-7">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ReactFlow>
      </div>
    </div>
  );
}
