/**
 * ReactFlowAdapter - Converts between internal GraphState and ReactFlow's Node[]/Edge[] format.
 * Keeps ReactFlow as a pure presentation layer.
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
import { NodeRegistry } from '@/registry/nodes';
import { DATA_TYPE_COLORS, DataType, NimzeyNodeData } from '@/types';

/**
 * Convert internal graph state to ReactFlow nodes and edges.
 */
export function graphStateToReactFlow(state: GraphState): {
  nodes: RFNode<NimzeyNodeData>[];
  edges: RFEdge[];
} {
  const nodes: RFNode<NimzeyNodeData>[] = [];
  const edges: RFEdge[] = [];

  for (const node of state.nodes.values()) {
    const def = NodeRegistry.get(node.definitionId);
    if (!def) continue;

    nodes.push({
      id: node.id,
      type: 'nimzeyNode',
      position: node.position,
      selected: state.selectedNodeIds.has(node.id),
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
      },
    });
  }

  for (const edge of state.edges.values()) {
    const color = DATA_TYPE_COLORS[edge.dataType] || DATA_TYPE_COLORS[DataType.Map];
    edges.push({
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      sourceHandle: edge.sourcePortId,
      targetHandle: edge.targetPortId,
      type: 'smoothstep',
      selected: state.selectedEdgeIds.has(edge.id),
      style: {
        stroke: color,
        strokeWidth: 1.5,
      },
      animated: edge.dataType === DataType.Curve,
    });
  }

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
    const targetPort = targetDef.inputs.find(p => p.id === (connection.targetHandle || 'source'));
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
