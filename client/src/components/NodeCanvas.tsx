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
import PortContextMenu from './PortContextMenu';
import NodeContextMenu from './NodeContextMenu';
import { SuggestedNextPill } from './SuggestedNextPill';
import { NimzeyNodeData, NodeColorTag, DataType } from '@/types';
import { getIsValidConnection } from '@/adapters/ReactFlowAdapter';
import { GraphState } from '@/stores/graphStore';
import { findNearestEdge } from '@/utils/edgeProximity';
import { debugLog } from '@/stores/debugLog';

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
  onSpliceIntoEdge?: (definitionId: string, edgeId: string, position: { x: number; y: number }) => string;
  onSpliceExistingIntoEdge?: (nodeId: string, edgeId: string) => boolean;
  onAddAndConnect?: (definitionId: string, targetNodeId: string, targetPortId: string) => void;
  onUploadSourceImage?: (file: File) => void;
  onGenerateTexture?: () => void;
  onApplyTemplate?: (templateId: string) => void;
  onCommitPositionChange?: () => void;
  onBakeToImage?: (nodeId: string) => void;
  onNodeFocus?: (nodeId: string) => void;
  onSaveNodeImage?: (nodeId: string) => void;
  onEndHere?: (nodeId: string) => void;
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
  onSpliceExistingIntoEdge,
  onAddAndConnect,
  onUploadSourceImage,
  onGenerateTexture,
  onApplyTemplate,
  onCommitPositionChange,
  onBakeToImage,
  onNodeFocus,
  onSaveNodeImage,
  onEndHere,
}: NodeCanvasProps) {
  const [emptyStateDismissed, setEmptyStateDismissed] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddScreenPos, setQuickAddScreenPos] = useState({ x: 0, y: 0 });
  const [dragOverEdgeId, setDragOverEdgeId] = useState<string | null>(null);
  const [portMenu, setPortMenu] = useState<{
    position: { x: number; y: number };
    dataType: DataType;
    targetNodeId: string;
    targetPortId: string;
  } | null>(null);
  const [nodeMenu, setNodeMenu] = useState<{
    position: { x: number; y: number };
    nodeId: string;
    definitionId: string;
    preview?: string | null;
  } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    nodeId: string;
    definitionId: string;
  } | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
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

      // Delete/Backspace: remove selected edges and nodes
      if (e.code === 'Delete' || e.code === 'Backspace') {
        const selectedEdgeIds = graphState.selectedEdgeIds;
        const selectedNodeIds = graphState.selectedNodeIds;
        if (selectedEdgeIds.size > 0) {
          debugLog('EDGE', `Keyboard ${e.code}: deleting ${selectedEdgeIds.size} selected edge(s)`, {
            edgeIds: Array.from(selectedEdgeIds).join(', '),
          });
          const removeChanges: EdgeChange[] = Array.from(selectedEdgeIds).map(id => ({
            id,
            type: 'remove' as const,
          }));
          onEdgesChange(removeChanges);
        }
        if (selectedNodeIds.size > 0) {
          debugLog('EDGE', `Keyboard ${e.code}: deleting ${selectedNodeIds.size} selected node(s)`, {
            nodeIds: Array.from(selectedNodeIds).join(', '),
          });
          const removeChanges: NodeChange[] = Array.from(selectedNodeIds).map(id => ({
            id,
            type: 'remove' as const,
          }));
          onNodesChange(removeChanges);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickAddOpen, graphState.selectedEdgeIds, graphState.selectedNodeIds, onEdgesChange, onNodesChange]);

  // Port context menu handler — opens suggestion menu on unconnected inputs
  const handlePortContextMenu = useCallback((nodeId: string, portId: string, dataType: DataType, screenPos: { x: number; y: number }) => {
    setPortMenu({ position: screenPos, dataType, targetNodeId: nodeId, targetPortId: portId });
  }, []);

  // Node header hover handlers — show suggestion pills after short delay
  const handleHeaderHover = useCallback((nodeId: string, definitionId: string) => {
    // Don't show on result nodes
    if (definitionId === 'result' || definitionId === 'result-pbr') return;
    // Small delay (300ms) to avoid flickering on quick mouse passes
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      setHoveredNode({ nodeId, definitionId });
    }, 300);
  }, []);

  const handleHeaderHoverEnd = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredNode(null);
  }, []);

  // Build the context actions for NimzeyNode
  const nodeActions: NimzeyNodeActions = useMemo(() => ({
    onParameterChange,
    onToggleEnabled,
    onToggleCollapsed,
    onSetColorTag,
    onUploadImage,
    onPortContextMenu: handlePortContextMenu,
    onHeaderHover: handleHeaderHover,
    onHeaderHoverEnd: handleHeaderHoverEnd,
  }), [onParameterChange, onToggleEnabled, onToggleCollapsed, onSetColorTag, onUploadImage, handlePortContextMenu, handleHeaderHover, handleHeaderHoverEnd]);

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

  // Node context menu handler — opens on right-click on any node
  const handleNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault();
    const data = node.data as NimzeyNodeData;
    setNodeMenu({
      position: { x: e.clientX, y: e.clientY },
      nodeId: node.id,
      definitionId: data?.definitionId || '',
      preview: data?.preview ?? null,
    });
  }, []);

  // Double-click on node → focus mode (skip result nodes)
  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    const defId = (node.data as NimzeyNodeData)?.definitionId || '';
    if (defId === 'result' || defId === 'result-pbr') return;
    onNodeFocus?.(node.id);
  }, [onNodeFocus]);

  const handleNodeMenuDelete = useCallback((nodeId: string) => {
    onNodesChange([{ id: nodeId, type: 'remove' }]);
  }, [onNodesChange]);

  const handlePaneClick = useCallback((e: React.MouseEvent) => {
    onNodeClick('');
    handlePaneClickForQuickAdd(e);
    setPortMenu(null);
    setNodeMenu(null);
    setHoveredNode(null);
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
    debugLog('EDGE', `Double-click disconnect edge ${edge.id}`);
    onEdgesChange([{ id: edge.id, type: 'remove' }]);
  }, [onEdgesChange]);

  // Edge re-wire: drag an edge endpoint to a new handle, or drop on empty space to disconnect
  // Track the start position so we can distinguish intentional drags from accidental clicks
  const edgeUpdateStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleEdgeUpdateStart = useCallback((_: React.MouseEvent, edge: Edge) => {
    edgeUpdateSuccessful.current = false;
    edgeUpdateStartPos.current = { x: mousePosRef.current.x, y: mousePosRef.current.y };
    debugLog('EDGE', `Edge update started: ${edge.id}`);
  }, []);

  const handleEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
    edgeUpdateSuccessful.current = true;
    debugLog('EDGE', `Edge re-wired: ${oldEdge.id} → new connection`);
    // Remove old edge, create new connection
    onEdgesChange([{ id: oldEdge.id, type: 'remove' }]);
    onConnect(newConnection);
  }, [onEdgesChange, onConnect]);

  const handleEdgeUpdateEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
    if (!edgeUpdateSuccessful.current) {
      // Only disconnect if the user actually dragged the edge endpoint a meaningful distance.
      // This prevents accidental disconnections from clicking near edge handles.
      const startPos = edgeUpdateStartPos.current;
      const endPos = mousePosRef.current;
      const dragDist = startPos
        ? Math.hypot(endPos.x - startPos.x, endPos.y - startPos.y)
        : 0;

      if (dragDist > 15) {
        debugLog('EDGE', `Edge drag-to-empty disconnect: ${edge.id} (drag distance: ${dragDist.toFixed(0)}px)`);
        onEdgesChange([{ id: edge.id, type: 'remove' }]);
      } else {
        debugLog('EDGE', `Edge update end IGNORED (drag distance ${dragDist.toFixed(0)}px < 15px threshold) — preventing accidental disconnect of ${edge.id}`);
      }
    }
    edgeUpdateSuccessful.current = true;
    edgeUpdateStartPos.current = null;
  }, [onEdgesChange]);

  // Canvas node drag: detect edge proximity for smart linking existing nodes
  const draggingNodeRef = useRef<string | null>(null);

  // Track the node's initial position when drag starts so we can require minimum drag distance
  const nodeDragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    nodeDragStartRef.current = { x: node.position.x, y: node.position.y };
  }, []);

  const handleNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
    if (!onSpliceExistingIntoEdge) return;
    draggingNodeRef.current = node.id;

    // Use node center for edge detection
    const nodeWidth = (node as any).width || 250;
    const nodeHeight = (node as any).height || 100;
    const center = {
      x: node.position.x + nodeWidth / 2,
      y: node.position.y + nodeHeight / 2,
    };

    // Exclude edges already connected to this node
    const otherEdges = edges.filter(
      e => e.source !== node.id && e.target !== node.id,
    );
    // Use tighter threshold (40px) for existing node drag to prevent accidental splices
    const nearest = findNearestEdge(center, otherEdges, nodes, 40);
    setDragOverEdgeId(nearest ? nearest.edgeId : null);
  }, [onSpliceExistingIntoEdge, edges, nodes]);

  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    // Commit position change to trigger history snapshot + auto-save
    // (updateNodePosition during drag does NOT bump version to avoid undo pollution)
    onCommitPositionChange?.();

    if (!onSpliceExistingIntoEdge || !dragOverEdgeId) {
      draggingNodeRef.current = null;
      nodeDragStartRef.current = null;
      setDragOverEdgeId(null);
      return;
    }

    // Require the node to have moved at least 30px from its start position
    // to prevent accidental splicing from small adjustments
    const startPos = nodeDragStartRef.current;
    const dragDist = startPos
      ? Math.hypot(node.position.x - startPos.x, node.position.y - startPos.y)
      : 0;

    if (dragDist < 30) {
      debugLog('EDGE', `Node drag splice IGNORED for ${node.id} — drag distance ${dragDist.toFixed(0)}px < 30px threshold`);
      draggingNodeRef.current = null;
      nodeDragStartRef.current = null;
      setDragOverEdgeId(null);
      return;
    }

    debugLog('EDGE', `Node drag splice: ${node.id} onto edge ${dragOverEdgeId} (drag distance: ${dragDist.toFixed(0)}px)`);
    const success = onSpliceExistingIntoEdge(node.id, dragOverEdgeId);
    if (!success) {
      debugLog('EDGE', `Node drag splice FAILED for ${node.id} onto edge ${dragOverEdgeId}`);
    }
    draggingNodeRef.current = null;
    nodeDragStartRef.current = null;
    setDragOverEdgeId(null);
  }, [onSpliceExistingIntoEdge, dragOverEdgeId, onCommitPositionChange]);

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

    // Check for drop-on-edge (smart linking)
    const nearest = findNearestEdge(position, edges, nodes);
    if (nearest && onSpliceIntoEdge) {
      setDragOverEdgeId(null);
      const spliceResult = onSpliceIntoEdge(definitionId, nearest.edgeId, position);
      if (spliceResult) return; // Splice succeeded
      // Splice failed (incompatible node type) — fall through to normal drop
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
          onNodeDragStart={handleNodeDragStart}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          onNodeContextMenu={handleNodeContextMenu}
          onNodeDoubleClick={handleNodeDoubleClick}
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
          deleteKeyCode={null}
          className="bg-[#0C0C0C]"
          onMoveStart={() => { if (quickAddOpen) setQuickAddOpen(false); }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1A1A19" />
          <Controls showInteractive={false} className="!bg-[#1A1A19] !border-[#333] !shadow-lg [&>button]:!bg-[#1A1A19] [&>button]:!border-[#333] [&>button]:!text-[#A6A6A6] [&>button:hover]:!bg-[#252524]" />
          <MiniMap
            nodeColor={(n) => {
              if (n.data?.definitionId === 'result') return '#E0FF29';
              if (n.data?.definitionId === 'image') return '#ABDF40';
              return '#3a3a3a';
            }}
            className="!bg-[#131312] !border-[#333]"
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

        {/* Port context menu (right-click on unconnected input) */}
        {portMenu && onAddAndConnect && (
          <PortContextMenu
            position={portMenu.position}
            dataType={portMenu.dataType}
            targetNodeId={portMenu.targetNodeId}
            targetPortId={portMenu.targetPortId}
            onSelect={onAddAndConnect}
            onClose={() => setPortMenu(null)}
          />
        )}

        {/* Node context menu (right-click on any node) */}
        {nodeMenu && (
          <NodeContextMenu
            position={nodeMenu.position}
            nodeId={nodeMenu.nodeId}
            definitionId={nodeMenu.definitionId}
            onBakeToImage={onBakeToImage || (() => {})}
            onFocus={onNodeFocus}
            onDelete={handleNodeMenuDelete}
            previewDataUrl={nodeMenu.preview}
            onSaveImage={onSaveNodeImage}
            onEndHere={onEndHere}
            onClose={() => setNodeMenu(null)}
          />
        )}

        {/* Suggested next node pills (shown on title bar hover) */}
        {hoveredNode && (() => {
          const node = graphState.nodes.get(hoveredNode.nodeId);
          if (!node) return null;

          // Convert flow coordinates → screen-relative position for the overlay
          const containerRect = containerRef.current?.getBoundingClientRect();
          const screenPos = reactFlowInstance.flowToScreenPosition({
            x: node.position.x,
            y: node.position.y - 28,
          });
          const relativePos = {
            x: screenPos.x - (containerRect?.left || 0),
            y: screenPos.y - (containerRect?.top || 0),
          };

          return (
            <SuggestedNextPill
              definitionId={hoveredNode.definitionId}
              nodePosition={relativePos}
              onSelect={(defId) => {
                if (onDrop) {
                  const pos = {
                    x: node.position.x + 280,
                    y: node.position.y,
                  };
                  onDrop(defId, pos);
                }
                setHoveredNode(null);
              }}
            />
          );
        })()}
      </div>
    </NimzeyNodeContext.Provider>
  );
}
