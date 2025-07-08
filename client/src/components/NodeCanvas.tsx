import { useCallback, useState, useMemo, useContext, createContext } from 'react';
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
import GeneratorNode from './GeneratorNode';
import { Badge } from '@/components/ui/badge';

// Create context for passing generateNodePreview to nodes
const NodeCanvasContext = createContext<{
  generateNodePreview?: (nodeId: string) => void;
}>({});

// Create wrapper component for ImageNode that receives onUploadImage
const ImageNodeWrapper = (props: any) => {
  return <ImageNode {...props} onUploadImage={props.data.onUploadImage} />;
};

// Create stable node types outside component to prevent recreation
const nodeTypes: NodeTypes = {
  filterNode: FilterNode,
  generatorNode: GeneratorNode,
  imageNode: ImageNodeWrapper,
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
  onInsertNodeIntoChain?: (nodeId: string, targetEdgeId: string, dropPosition: { x: number; y: number }) => void;
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
  onUploadImage,
  onInsertNodeIntoChain
}: NodeCanvasProps) {
  // NodeCanvas component - renders the node-based editor
  const reactFlowInstance = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle dropping a node onto the canvas
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    const nodeId = event.dataTransfer.getData('application/reactflow');
    if (!nodeId || !onInsertNodeIntoChain) return;
    
    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    
    // Find the closest edge to the drop position
    const closestEdge = findClosestEdge(position, edges, nodes);
    
    if (closestEdge) {
      onInsertNodeIntoChain(nodeId, closestEdge.id, position);
    }
  }, [reactFlowInstance, edges, nodes, onInsertNodeIntoChain]);

  // Find the closest edge to a given position
  const findClosestEdge = useCallback((position: { x: number; y: number }, edges: Edge[], nodes: Node[]) => {
    let closestEdge: Edge | null = null;
    let minDistance = Infinity;
    
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        // Calculate the midpoint of the edge
        const midpoint = {
          x: (sourceNode.position.x + targetNode.position.x) / 2,
          y: (sourceNode.position.y + targetNode.position.y) / 2
        };
        
        // Calculate distance from drop position to edge midpoint
        const distance = Math.sqrt(
          Math.pow(position.x - midpoint.x, 2) + 
          Math.pow(position.y - midpoint.y, 2)
        );
        
        if (distance < minDistance && distance < 100) { // Only consider edges within 100px
          minDistance = distance;
          closestEdge = edge;
        }
      }
    });
    
    return closestEdge;
  }, []);

  const handlePaneClick = () => {
    // Deselect node when clicking on the pane
    onNodeClick('');
  };

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  };

  // Handle node drag start for insertion
  const handleNodeDragStart = useCallback((event: React.DragEvent, node: Node) => {
    // Only allow dragging of unconnected nodes
    const hasConnections = edges.some(edge => edge.source === node.id || edge.target === node.id);
    
    if (!hasConnections && node.type !== 'imageNode' && node.type !== 'outputNode') {
      event.dataTransfer.setData('application/reactflow', node.id);
      event.dataTransfer.effectAllowed = 'move';
      setDraggedNodeId(node.id);
    } else {
      event.preventDefault();
    }
  }, [edges]);
  
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

  // Create stable generateNodePreview callback
  const generateNodePreview = useCallback((nodeId: string) => {
    // Simply call onNodeClick with the nodeId for preview generation
    if (onNodeClick && nodeId) {
      onNodeClick(nodeId);
    }
  }, [onNodeClick]);

  return (
    <NodeCanvasContext.Provider value={{ generateNodePreview }}>
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
            onNodeDragStart={handleNodeDragStart}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
            snapToGrid={true}
            snapGrid={[15, 15]}
            onDragOver={onDragOver}
            onDrop={onDrop}
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
    </NodeCanvasContext.Provider>
  );
}
