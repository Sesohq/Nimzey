/**
 * GraphSerializer - Serializes/deserializes graph state to/from JSON-safe objects.
 * Handles Map -> Object conversion for persistence in localStorage.
 */

import { GraphNode, GraphEdge, DataType } from '@/types';

export interface SerializedNode {
  id: string;
  definitionId: string;
  position: { x: number; y: number };
  parameters: Record<string, number | string | boolean | number[]>;
  enabled: boolean;
  collapsed: boolean;
  colorTag: string;
  imageUrl?: string;
}

export interface SerializedEdge {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  dataType: string;
}

export interface SerializedGraph {
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  resultNodeId: string;
}

export function serializeGraph(
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>,
  resultNodeId: string,
): SerializedGraph {
  const serializedNodes: SerializedNode[] = [];
  for (const node of nodes.values()) {
    serializedNodes.push({
      id: node.id,
      definitionId: node.definitionId,
      position: { ...node.position },
      parameters: { ...node.parameters },
      enabled: node.enabled,
      collapsed: node.collapsed,
      colorTag: node.colorTag,
      imageUrl: node.imageUrl,
    });
  }

  const serializedEdges: SerializedEdge[] = [];
  for (const edge of edges.values()) {
    serializedEdges.push({
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      sourcePortId: edge.sourcePortId,
      targetNodeId: edge.targetNodeId,
      targetPortId: edge.targetPortId,
      dataType: edge.dataType,
    });
  }

  return { nodes: serializedNodes, edges: serializedEdges, resultNodeId };
}

export function deserializeGraph(data: SerializedGraph): {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  resultNodeId: string;
} {
  const nodes = new Map<string, GraphNode>();
  for (const sn of data.nodes) {
    nodes.set(sn.id, {
      id: sn.id,
      definitionId: sn.definitionId,
      position: sn.position,
      parameters: sn.parameters,
      enabled: sn.enabled,
      collapsed: sn.collapsed,
      colorTag: sn.colorTag as GraphNode['colorTag'],
      imageUrl: sn.imageUrl,
    });
  }

  const edges = new Map<string, GraphEdge>();
  for (const se of data.edges) {
    edges.set(se.id, {
      id: se.id,
      sourceNodeId: se.sourceNodeId,
      sourcePortId: se.sourcePortId,
      targetNodeId: se.targetNodeId,
      targetPortId: se.targetPortId,
      dataType: se.dataType as DataType,
    });
  }

  return { nodes, edges, resultNodeId: data.resultNodeId };
}
