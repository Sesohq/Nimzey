/**
 * ReactFlowAdapter - Converts between internal GraphState and ReactFlow's Node[]/Edge[] format.
 * Keeps ReactFlow as a pure presentation layer.
 *
 * Uses module-level caches to return stable references for unchanged nodes/edges,
 * allowing React.memo in NimzeyNode to skip re-renders.
 */

import {
  Node as RFNode,
  Edge as RFEdge,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { GraphState } from '@/stores/graphStore';
import { NodeRegistry, getEffectiveInputs } from '@/registry/nodes';
import { DATA_TYPE_COLORS, DataType, NimzeyNodeData } from '@/types';

// ---- Memoization caches ----

// Per-node cache: nodeId -> previous RFNode
let prevNodeCache = new Map<string, RFNode<NimzeyNodeData>>();
// Per-edge cache: edgeId -> previous RFEdge
let prevEdgeCache = new Map<string, RFEdge>();

/** Check if two Sets have the same contents */
function setsEqual(a: Set<string> | undefined, b: Set<string> | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

/** Shallow-compare node data fields to determine if an RFNode needs updating */
function nodeDataChanged(
  prev: RFNode<NimzeyNodeData>,
  node: { position: { x: number; y: number }; definitionId: string; parameters: Record<string, any>;
    enabled: boolean; collapsed: boolean; colorTag: string; preview?: string | null;
    imageUrl?: string; width?: number; height?: number },
  selected: boolean,
  connectedInputs: Set<string>,
  connectedOutputs: Set<string>,
): boolean {
  if (prev.selected !== selected) return true;
  if (prev.position.x !== node.position.x || prev.position.y !== node.position.y) return true;

  const d = prev.data;
  if (d.definitionId !== node.definitionId) return true;
  if (d.enabled !== node.enabled) return true;
  if (d.collapsed !== node.collapsed) return true;
  if (d.colorTag !== node.colorTag) return true;
  if (d.preview !== node.preview) return true;
  if (d.imageUrl !== node.imageUrl) return true;
  if (d.width !== node.width) return true;
  if (d.height !== node.height) return true;
  if (d.parameters !== node.parameters) return true;
  if (!setsEqual(d.connectedInputs, connectedInputs)) return true;
  if (!setsEqual(d.connectedOutputs, connectedOutputs)) return true;

  return false;
}

/**
 * Convert internal graph state to ReactFlow nodes and edges.
 * Returns stable references for unchanged nodes/edges to enable React.memo optimizations.
 */
export function graphStateToReactFlow(state: GraphState): {
  nodes: RFNode<NimzeyNodeData>[];
  edges: RFEdge[];
} {
  const nodes: RFNode<NimzeyNodeData>[] = [];
  const edges: RFEdge[] = [];
  const nextNodeCache = new Map<string, RFNode<NimzeyNodeData>>();
  const nextEdgeCache = new Map<string, RFEdge>();

  for (const node of state.nodes.values()) {
    const def = NodeRegistry.get(node.definitionId);
    if (!def) continue;

    // Pre-compute connected ports from edge index
    const connectedInputs = new Set<string>();
    const connectedOutputs = new Set<string>();

    const targetEdgeIds = state.edgesByTarget.get(node.id);
    if (targetEdgeIds) {
      for (const edgeId of targetEdgeIds) {
        const edge = state.edges.get(edgeId);
        if (edge) connectedInputs.add(edge.targetPortId);
      }
    }

    const sourceEdgeIds = state.edgesBySource.get(node.id);
    if (sourceEdgeIds) {
      for (const edgeId of sourceEdgeIds) {
        const edge = state.edges.get(edgeId);
        if (edge) connectedOutputs.add(edge.sourcePortId);
      }
    }

    const selected = state.selectedNodeIds.has(node.id);
    const cached = prevNodeCache.get(node.id);

    let rfNode: RFNode<NimzeyNodeData>;
    if (cached && !nodeDataChanged(cached, node, selected, connectedInputs, connectedOutputs)) {
      // No change - reuse exact same reference so React.memo skips re-render
      rfNode = cached;
    } else {
      rfNode = {
        id: node.id,
        type: 'nimzeyNode',
        position: node.position,
        selected,
        data: {
          definitionId: node.definitionId,
          parameters: node.parameters,
          enabled: node.enabled,
          collapsed: node.collapsed,
          colorTag: node.colorTag,
          preview: node.preview,
          imageUrl: node.imageUrl,
          width: node.width,
          height: node.height,
          connectedInputs,
          connectedOutputs,
        },
      };
    }

    nodes.push(rfNode);
    nextNodeCache.set(node.id, rfNode);
  }

  for (const edge of state.edges.values()) {
    const edgeSelected = state.selectedEdgeIds.has(edge.id);
    const cached = prevEdgeCache.get(edge.id);

    let rfEdge: RFEdge;
    if (cached &&
        cached.selected === edgeSelected &&
        cached.source === edge.sourceNodeId &&
        cached.target === edge.targetNodeId &&
        cached.sourceHandle === edge.sourcePortId &&
        cached.targetHandle === edge.targetPortId) {
      // Reuse same reference
      rfEdge = cached;
    } else {
      const color = DATA_TYPE_COLORS[edge.dataType] || DATA_TYPE_COLORS[DataType.Map];
      rfEdge = {
        id: edge.id,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        sourceHandle: edge.sourcePortId,
        targetHandle: edge.targetPortId,
        type: 'smoothstep',
        selected: edgeSelected,
        style: {
          stroke: color,
          strokeWidth: 1.5,
        },
        animated: edge.dataType === DataType.Curve,
      };
    }

    edges.push(rfEdge);
    nextEdgeCache.set(edge.id, rfEdge);
  }

  // Swap caches (old entries for deleted nodes/edges are discarded)
  prevNodeCache = nextNodeCache;
  prevEdgeCache = nextEdgeCache;

  return { nodes, edges };
}

/**
 * Convert a ReactFlow Connection event to a connect action.
 */
export function connectionToEdge(connection: Connection): {
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
} | null {
  if (!connection.source || !connection.target) return null;
  return {
    sourceNodeId: connection.source,
    sourcePortId: connection.sourceHandle || 'out',
    targetNodeId: connection.target,
    targetPortId: connection.targetHandle || 'source',
  };
}

/**
 * Get the connection validation function for ReactFlow.
 */
export function getIsValidConnection(state: GraphState) {
  return (connection: Connection): boolean => {
    if (!connection.source || !connection.target) return false;
    if (connection.source === connection.target) return false;

    const sourceNode = state.nodes.get(connection.source);
    const targetNode = state.nodes.get(connection.target);
    if (!sourceNode || !targetNode) return false;

    const sourceDef = NodeRegistry.get(sourceNode.definitionId);
    const targetDef = NodeRegistry.get(targetNode.definitionId);
    if (!sourceDef || !targetDef) return false;

    const sourcePort = sourceDef.outputs.find(p => p.id === (connection.sourceHandle || 'out'));
    // Use effective inputs (includes auto-generated map_ ports for mappable params)
    const effectiveTargetInputs = getEffectiveInputs(targetDef);
    const targetPort = effectiveTargetInputs.find(p => p.id === (connection.targetHandle || 'source'));
    if (!sourcePort || !targetPort) return false;

    return NodeRegistry.canConnect(sourcePort, targetPort);
  };
}

/**
 * Edge color based on data type.
 */
export function getEdgeColor(dataType: DataType): string {
  return DATA_TYPE_COLORS[dataType] || '#9ca3af';
}
