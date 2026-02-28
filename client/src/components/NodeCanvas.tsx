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
import { SuggestedNextPill } from './SuggestedNextPill';
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
  lastAddedNodeId?: string | null;
  lastAddedDefinitionId?: string | null;
  onClearSuggestion?: () => void;
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
  lastAddedNodeId,
  lastAddedDefinitionId,
  onClearSuggestion,
}: NodeCanvasProps) {
  const [emptyStateDismissed, setEmptyStateDismissed] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddScreenPos, setQuickAddScreenPos] = useState({ x: 0, y: 0 });
  const [dragOverEdgeId, setDragOverEdgeId] = useState<string | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const edgeUpdateSuccessful = useRef(true);
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
    onClearSuggestion?.();
  }, [onNodeClick, handlePaneClickForQuickAdd, onClearSuggestion]);

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

  // Edge re-wire: drag an edge endpoint to a new handle, or drop on empty space to disconnect
  const handleEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const handleEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
    edgeUpdateSuccessful.current = true;
    // Remove old edge, create new connection
    onEdgesChange([{ id: oldEdge.id, type: 'remove' }]);
    onConnect(newConnection);
  }, [onEdgesChange, onConnect]);

  const handleEdgeUpdateEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
    if (!edgeUpdateSuccessful.current) {
      // Edge was dragged to empty space — disconnect it
      onEdgesChange([{ id: edge.id, type: 'remove' }]);
    }
    edgeUpdateSuccessful.current = true;
  }, [onEdgesChange]);

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
          onEdgeUpdateStart={handleEdgeUpdateStart}
          onEdgeUpdate={handleEdgeUpdate}
          onEdgeUpdateEnd={handleEdgeUpdateEnd}
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
          className="bg-[#0d0d0d]"
          onMoveStart={() => { if (quickAddOpen) setQuickAddOpen(false); }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a1a1a" />
          <Controls showInteractive={false} className="!bg-[#1e1e1e] !border-[#2e2e2e] !shadow-lg [&>button]:!bg-[#1e1e1e] [&>button]:!border-[#2e2e2e] [&>button]:!text-[#888] [&>button:hover]:!bg-[#252525]" />
          <MiniMap
            nodeColor={(n) => {
              if (n.data?.definitionId === 'result') return '#6b8aaf';
              if (n.data?.definitionId === 'image') return '#5a8a5a';
              return '#3a3a3a';
            }}
            className="!bg-[#141414] !border-[#2a2a2a]"
            maskColor="rgba(0,0,0,0.65)"
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

        {/* Suggested next node pills */}
        {lastAddedNodeId && lastAddedDefinitionId && onClearSuggestion && (() => {
          const node = graphState.nodes.get(lastAddedNodeId);
          if (!node) return null;

          // Convert flow coordinates → screen-relative position for the overlay
          const containerRect = containerRef.current?.getBoundingClientRect();
          const screenPos = reactFlowInstance.flowToScreenPosition({
            x: node.position.x,
            y: node.position.y + 120,
          });
          const relativePos = {
            x: screenPos.x - (containerRect?.left || 0),
            y: screenPos.y - (containerRect?.top || 0),
          };

          return (
            <SuggestedNextPill
              nodeId={lastAddedNodeId}
              definitionId={lastAddedDefinitionId}
              nodePosition={relativePos}
              onSelect={(defId) => {
                if (onDrop) {
                  const pos = {
                    x: node.position.x + 280,
                    y: node.position.y,
                  };
                  onDrop(defId, pos);
                }
              }}
              onDismiss={onClearSuggestion}
            />
          );
        })()}
      </div>
    </NimzeyNodeContext.Provider>
  );
}
