import React, { useCallback, useRef } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  NodeChange, 
  EdgeChange, 
  Connection, 
  Background, 
  Controls,
  Panel,
  NodeTypes,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import SimpleFilterNode from './SimpleFilterNode';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Upload } from 'lucide-react';

// Define the node types
const nodeTypes: NodeTypes = {
  filterNode: SimpleFilterNode,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle node click
  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  };

  // Handle file upload
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      onUploadImage(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Control"
        selectionKeyCode="Shift"
      >
        {/* Background pattern */}
        <Background color="#888" gap={16} size={1} />
        
        {/* Zoom controls */}
        <Panel position="top-right" className="space-x-2">
          <Button variant="outline" size="icon" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleUploadClick}>
            <Upload className="h-4 w-4" />
          </Button>
        </Panel>
        
        {/* ReactFlow controls */}
        <Controls />
      </ReactFlow>
      
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
}