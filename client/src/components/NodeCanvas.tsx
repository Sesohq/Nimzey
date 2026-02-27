/**
 * NodeCanvas - ReactFlow-based graph editor with single unified node type.
 * Registers NimzeyNode for all node types, handles connections, drag-and-drop, and validation.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  updateEdge,
  useReactFlow,
} from 'reactflow';
import { NimzeyNode, NimzeyNodeContext, NimzeyNodeActions } from './nodes/NimzeyNode';
import EmptyStateOverlay from './EmptyStateOverlay';
import QuickAddPalette from './QuickAddPalette';
import { NimzeyNodeData, NodeColorTag } from '@/types';
import { getIsValidConnection } from '@/adapters/ReactFlowAdapter';
import { GraphState } from '@/stores/graphStore';
import { findNearestEdge } from '@/utils/edgeProximity';

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
  onSpliceIntoEdge?: (definitionId: string, edgeId: string, position: { x: number; y: number }) => void;
  onUploadSourceImage?: (file: File) => void;
  onGenerateTexture?: () => void;
  onApplyTemplate?: (templateId: string) => void;
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
  onSpliceIntoEdge,
  onUploadSourceImage,
  onGenerateTexture,
  onApplyTemplate,
}: NodeCanvasProps) {
  const [emptyStateDismissed, setEmptyStateDismissed] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddScreenPos, setQuickAddScreenPos] = useState({ x: 0, y: 0 });
  const [dragOverEdgeId, setDragOverEdgeId] = useState<string | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  // Detect empty graph (only Result node, no other nodes)
  const isGraphEmpty = useMemo(
    () => nodes.length === 1 && nodes[0]?.data?.definitionId === 'result',
    [nodes],
  );

  const showEmptyState = isGraphEmpty && !emptyStateDismissed;

  // Track mouse position for Space key palette opening
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Keyboard shortcuts: Space for palette, Delete/Backspace for deleting selected edges
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement).isContentEditable) return;

      if (e.code === 'Space' && !quickAddOpen) {
        e.preventDefault();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        setQuickAddScreenPos({
          x: mousePosRef.current.x - containerRect.left,
          y: mousePosRef.current.y - containerRect.top,
        });
        setQuickAddOpen(true);
      }

      // Delete/Backspace: remove selected edges
      if (e.code === 'Delete' || e.code === 'Backspace') {
        const selectedEdgeIds = graphState.selectedEdgeIds;
        if (selectedEdgeIds.size > 0) {
          const removeChanges: EdgeChange[] = Array.from(selectedEdgeIds).map(id => ({
            id,
            type: 'remove' as const,
          }));
          onEdgesChange(removeChanges);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickAddOpen, graphState.selectedEdgeIds, onEdgesChange]);

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

  // Apply highlight styling to edge being hovered during drag
  const displayEdges = useMemo(() => {
    if (!dragOverEdgeId) return edges;
    return edges.map(edge =>
      edge.id === dragOverEdgeId
        ? {
            ...edge,
            style: {
              ...edge.style,
              strokeWidth: 4,
              stroke: '#facc15',
              filter: 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.6))',
            },
          }
        : edge,
    );
  }, [edges, dragOverEdgeId]);

  // Detect double-click on pane via click timing (ReactFlow absorbs native dblclick)
  const lastPaneClickRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const handlePaneClickForQuickAdd = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const last = lastPaneClickRef.current;

    if (last && now - last.time < 350 &&
        Math.abs(e.clientX - last.x) < 10 &&
        Math.abs(e.clientY - last.y) < 10) {
      // Double-click detected
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setQuickAddScreenPos({
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top,
        });
        setQuickAddOpen(true);
      }
      lastPaneClickRef.current = null;
    } else {
      lastPaneClickRef.current = { time: now, x: e.clientX, y: e.clientY };
    }
  }, []);

  const handlePaneClick = useCallback((e: React.MouseEvent) => {
    onNodeClick('');
    handlePaneClickForQuickAdd(e);
  }, [onNodeClick, handlePaneClickForQuickAdd]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  // Quick-add palette selection
  const handleQuickAddSelect = useCallback((definitionId: string) => {
    if (!onDrop) return;
    // Convert screen position to flow coordinates
    const flowPos = reactFlowInstance.screenToFlowPosition({
      x: mousePosRef.current.x,
      y: mousePosRef.current.y,
    });
    onDrop(definitionId, flowPos);
  }, [onDrop, reactFlowInstance]);

  // Click edge to select it, double-click to delete
  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    // Edge selection is handled by ReactFlow's built-in selection
  }, []);

  const handleEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    onEdgesChange([{ id: edge.id, type: 'remove' }]);
  }, [onEdgesChange]);

  // Re-wire: drag an edge endpoint to a new handle
  const handleEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
    // Remove old edge, create new connection
    onEdgesChange([{ id: oldEdge.id, type: 'remove' }]);
    onConnect(newConnection);
  }, [onEdgesChange, onConnect]);

  // Drag-and-drop from filter panel with edge proximity detection
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    // Detect nearest edge for drop-on-edge highlighting
    const flowPos = reactFlowInstance.screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    });
    const nearest = findNearestEdge(flowPos, edges, nodes);
    setDragOverEdgeId(nearest ? nearest.edgeId : null);
  }, [reactFlowInstance, edges, nodes]);

  const handleDragLeave = useCallback(() => {
    setDragOverEdgeId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const definitionId = e.dataTransfer.getData('application/nimzey-node');
    if (!definitionId || !onDrop) return;

    // Convert screen position to flow coordinates (accounts for zoom/pan)
    const position = reactFlowInstance.screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    });

    // Check for drop-on-edge
    const nearest = findNearestEdge(position, edges, nodes);
    if (nearest && onSpliceIntoEdge) {
      setDragOverEdgeId(null);
      onSpliceIntoEdge(definitionId, nearest.edgeId, position);
      return;
    }

    setDragOverEdgeId(null);
    onDrop(definitionId, position);
  }, [onDrop, onSpliceIntoEdge, reactFlowInstance, edges, nodes]);

  return (
    <NimzeyNodeContext.Provider value={nodeActions}>
      <div
        ref={containerRef}
        className="flex-1 flex flex-col relative overflow-hidden h-full"
        onMouseMove={handleMouseMove}
      >
        <ReactFlow
          nodes={nodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          onEdgeUpdate={handleEdgeUpdate}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          nodeTypes={nodeTypes}
          isValidConnection={isValidConnection}
          edgesUpdatable
          fitView
          fitViewOptions={{ padding: 0.4 }}
          minZoom={0.1}
          maxZoom={1}
          snapToGrid
          snapGrid={[15, 15]}
          deleteKeyCode={['Delete', 'Backspace']}
          className="bg-zinc-950"
          onMoveStart={() => { if (quickAddOpen) setQuickAddOpen(false); }}
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

        {/* Empty state overlay */}
        {showEmptyState && onUploadSourceImage && onGenerateTexture && (
          <EmptyStateOverlay
            onUploadImage={onUploadSourceImage}
            onGenerateTexture={onGenerateTexture}
            onDismiss={() => setEmptyStateDismissed(true)}
            onApplyTemplate={onApplyTemplate}
          />
        )}

        {/* Quick-add palette (double-click or Space) */}
        {quickAddOpen && (
          <QuickAddPalette
            position={quickAddScreenPos}
            onSelect={handleQuickAddSelect}
            onClose={() => setQuickAddOpen(false)}
          />
        )}
      </div>
    </NimzeyNodeContext.Provider>
  );
}
