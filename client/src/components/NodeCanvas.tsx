/**
 * NodeCanvas - ReactFlow-based graph editor with single unified node type.
 * Registers NimzeyNode for all node types, handles connections, drag-and-drop, and validation.
 */

import { useCallback, useMemo } from 'react';
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
  NodeTypes,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { NimzeyNode, NimzeyNodeContext, NimzeyNodeActions } from './nodes/NimzeyNode';
import { NimzeyNodeData, NodeColorTag } from '@/types';
import { getIsValidConnection } from '@/adapters/ReactFlowAdapter';
import { GraphState } from '@/stores/graphStore';

// Single node type for all nodes
const nodeTypes: NodeTypes = {
  nimzeyNode: NimzeyNode as any,
};

interface NodeCanvasProps {
  nodes: Node<NimzeyNodeData>[];
  edges: Edge[];
  graphState: GraphState;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick: (nodeId: string) => void;
  onParameterChange: (nodeId: string, paramId: string, value: number | string | boolean | number[]) => void;
  onToggleEnabled: (nodeId: string) => void;
  onToggleCollapsed: (nodeId: string) => void;
  onSetColorTag: (nodeId: string, tag: NodeColorTag) => void;
  onUploadImage?: (nodeId: string, file: File) => void;
  onDrop?: (definitionId: string, position: { x: number; y: number }) => void;
}

export default function NodeCanvas({
  nodes,
  edges,
  graphState,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onParameterChange,
  onToggleEnabled,
  onToggleCollapsed,
  onSetColorTag,
  onUploadImage,
  onDrop,
}: NodeCanvasProps) {
  // Build the context actions for NimzeyNode
  const nodeActions: NimzeyNodeActions = useMemo(() => ({
    onParameterChange,
    onToggleEnabled,
    onToggleCollapsed,
    onSetColorTag,
    onUploadImage,
  }), [onParameterChange, onToggleEnabled, onToggleCollapsed, onSetColorTag, onUploadImage]);

  // Connection validation using typed ports
  const isValidConnection = useMemo(
    () => getIsValidConnection(graphState),
    [graphState],
  );

  const handlePaneClick = useCallback(() => {
    onNodeClick('');
  }, [onNodeClick]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  // Double-click edge to delete
  const handleEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    onEdgesChange([{ id: edge.id, type: 'remove' }]);
  }, [onEdgesChange]);

  // Drag-and-drop from filter panel
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const definitionId = e.dataTransfer.getData('application/nimzey-node');
    if (!definitionId || !onDrop) return;

    // Get drop position in flow coordinates
    const bounds = (e.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
    if (!bounds) return;

    const position = {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    };

    onDrop(definitionId, position);
  }, [onDrop]);

  return (
    <NimzeyNodeContext.Provider value={nodeActions}>
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          onNodeClick={handleNodeClick}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          nodeTypes={nodeTypes}
          isValidConnection={isValidConnection}
          fitView
          minZoom={0.1}
          maxZoom={2}
          snapToGrid
          snapGrid={[15, 15]}
          deleteKeyCode="Delete"
          className="bg-zinc-950"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
          <Controls showInteractive={false} className="!bg-zinc-800 !border-zinc-700 !shadow-lg [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-700" />
          <MiniMap
            nodeColor={(n) => {
              if (n.data?.definitionId === 'result') return '#3b82f6';
              if (n.data?.definitionId === 'image') return '#22c55e';
              return '#52525b';
            }}
            className="!bg-zinc-900 !border-zinc-700"
            maskColor="rgba(0,0,0,0.6)"
          />
        </ReactFlow>
      </div>
    </NimzeyNodeContext.Provider>
  );
}
