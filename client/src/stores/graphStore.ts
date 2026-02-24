/**
 * GraphStore - Manages the node graph topology and parameter values.
 * Pure data layer with no rendering logic.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { DataType, GraphEdge, GraphNode, NodeColorTag } from '@/types';
import { NodeRegistry } from '@/registry/nodes';

export interface GraphState {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  selectedNodeIds: Set<string>;
  resultNodeId: string;
}

let edgeCounter = 0;

function createResultNode(): GraphNode {
  return {
    id: 'result-node',
    definitionId: 'result',
    position: { x: 800, y: 300 },
    parameters: NodeRegistry.get('result')?.parameters.reduce((acc, p) => {
      acc[p.id] = p.defaultValue;
      return acc;
    }, {} as Record<string, any>) || {},
    enabled: true,
    collapsed: false,
    colorTag: 'default',
  };
}

export function useGraphStore() {
  const [nodes, setNodes] = useState<Map<string, GraphNode>>(() => {
    const initial = new Map<string, GraphNode>();
    const result = createResultNode();
    initial.set(result.id, result);
    return initial;
  });
  const [edges, setEdges] = useState<Map<string, GraphEdge>>(new Map());
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  const resultNodeId = 'result-node';

  // ---- Node Operations ----

  const addNode = useCallback((definitionId: string, position: { x: number; y: number }): string => {
    const def = NodeRegistry.get(definitionId);
    if (!def) {
      console.error('Unknown node definition:', definitionId);
      return '';
    }

    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const params = NodeRegistry.getDefaultParameters(definitionId);

    const node: GraphNode = {
      id,
      definitionId,
      position,
      parameters: params,
      enabled: true,
      collapsed: false,
      colorTag: 'default',
    };

    setNodes(prev => {
      const next = new Map(prev);
      next.set(id, node);
      return next;
    });

    return id;
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    if (nodeId === resultNodeId) return; // Cannot delete result node

    setNodes(prev => {
      const next = new Map(prev);
      next.delete(nodeId);
      return next;
    });

    // Remove all edges connected to this node
    setEdges(prev => {
      const next = new Map(prev);
      for (const [id, edge] of next) {
        if (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId) {
          next.delete(id);
        }
      }
      return next;
    });
  }, [resultNodeId]);

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => {
      const node = prev.get(nodeId);
      if (!node) return prev;
      const next = new Map(prev);
      next.set(nodeId, { ...node, position });
      return next;
    });
  }, []);

  const setParameter = useCallback((nodeId: string, paramId: string, value: number | string | boolean | number[]) => {
    setNodes(prev => {
      const node = prev.get(nodeId);
      if (!node) return prev;
      const next = new Map(prev);
      next.set(nodeId, {
        ...node,
        parameters: { ...node.parameters, [paramId]: value },
      });
      return next;
    });
  }, []);

  const toggleEnabled = useCallback((nodeId: string) => {
    setNodes(prev => {
      const node = prev.get(nodeId);
      if (!node) return prev;
      const next = new Map(prev);
      next.set(nodeId, { ...node, enabled: !node.enabled });
      return next;
    });
  }, []);

  const toggleCollapsed = useCallback((nodeId: string) => {
    setNodes(prev => {
      const node = prev.get(nodeId);
      if (!node) return prev;
      const next = new Map(prev);
      next.set(nodeId, { ...node, collapsed: !node.collapsed });
      return next;
    });
  }, []);

  const setColorTag = useCallback((nodeId: string, colorTag: NodeColorTag) => {
    setNodes(prev => {
      const node = prev.get(nodeId);
      if (!node) return prev;
      const next = new Map(prev);
      next.set(nodeId, { ...node, colorTag });
      return next;
    });
  }, []);

  const setNodePreview = useCallback((nodeId: string, preview: string | null) => {
    setNodes(prev => {
      const node = prev.get(nodeId);
      if (!node) return prev;
      const next = new Map(prev);
      next.set(nodeId, { ...node, preview });
      return next;
    });
  }, []);

  // ---- Selection ----

  const selectNode = useCallback((nodeId: string, multi?: boolean) => {
    setSelectedNodeIds(prev => {
      if (multi) {
        const next = new Set(prev);
        if (next.has(nodeId)) next.delete(nodeId);
        else next.add(nodeId);
        return next;
      }
      return new Set([nodeId]);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeIds(new Set());
  }, []);

  // ---- Edge Operations ----

  const connect = useCallback((
    sourceNodeId: string, sourcePortId: string,
    targetNodeId: string, targetPortId: string
  ): boolean => {
    const sourceNode = nodes.get(sourceNodeId);
    const targetNode = nodes.get(targetNodeId);
    if (!sourceNode || !targetNode) return false;

    const sourceDef = NodeRegistry.get(sourceNode.definitionId);
    const targetDef = NodeRegistry.get(targetNode.definitionId);
    if (!sourceDef || !targetDef) return false;

    const sourcePort = sourceDef.outputs.find(p => p.id === sourcePortId);
    const targetPort = targetDef.inputs.find(p => p.id === targetPortId);
    if (!sourcePort || !targetPort) return false;

    // Type check
    if (!NodeRegistry.canConnect(sourcePort, targetPort)) return false;

    // Cycle check
    if (wouldCreateCycle(sourceNodeId, targetNodeId, edges)) return false;

    // Remove existing connection to same target port
    setEdges(prev => {
      const next = new Map(prev);
      for (const [id, edge] of next) {
        if (edge.targetNodeId === targetNodeId && edge.targetPortId === targetPortId) {
          next.delete(id);
        }
      }
      const edgeId = `edge_${edgeCounter++}`;
      next.set(edgeId, {
        id: edgeId,
        sourceNodeId,
        sourcePortId,
        targetNodeId,
        targetPortId,
        dataType: targetPort.dataType,
      });
      return next;
    });

    return true;
  }, [nodes, edges]);

  const disconnect = useCallback((edgeId: string) => {
    setEdges(prev => {
      const next = new Map(prev);
      next.delete(edgeId);
      return next;
    });
  }, []);

  // ---- Graph Queries ----

  const getUpstreamNodes = useCallback((nodeId: string): string[] => {
    const visited = new Set<string>();
    const queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of edges.values()) {
        if (edge.targetNodeId === current && !visited.has(edge.sourceNodeId)) {
          visited.add(edge.sourceNodeId);
          queue.push(edge.sourceNodeId);
        }
      }
    }
    return Array.from(visited);
  }, [edges]);

  const state: GraphState = useMemo(() => ({
    nodes,
    edges,
    selectedNodeIds,
    resultNodeId,
  }), [nodes, edges, selectedNodeIds, resultNodeId]);

  return {
    state,
    addNode,
    removeNode,
    updateNodePosition,
    setParameter,
    toggleEnabled,
    toggleCollapsed,
    setColorTag,
    setNodePreview,
    selectNode,
    clearSelection,
    connect,
    disconnect,
    getUpstreamNodes,
  };
}

// ---- Helpers ----

function wouldCreateCycle(
  sourceNodeId: string,
  targetNodeId: string,
  edges: Map<string, GraphEdge>
): boolean {
  if (sourceNodeId === targetNodeId) return true;

  // BFS from target to see if we reach source
  const visited = new Set<string>();
  const queue = [sourceNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetNodeId) continue; // Skip the new edge
    for (const edge of edges.values()) {
      if (edge.sourceNodeId === current && !visited.has(edge.targetNodeId)) {
        if (edge.targetNodeId === sourceNodeId) continue;
        visited.add(edge.targetNodeId);
        // If we can reach the sourceNodeId from targetNodeId, it's a cycle
        // Wait - we need to check if targetNodeId can reach sourceNodeId through existing edges
      }
    }
  }

  // Proper cycle check: can targetNodeId reach sourceNodeId?
  const visited2 = new Set<string>();
  const queue2 = [targetNodeId];
  while (queue2.length > 0) {
    const current = queue2.shift()!;
    for (const edge of edges.values()) {
      if (edge.targetNodeId === current && !visited2.has(edge.sourceNodeId)) {
        if (edge.sourceNodeId === sourceNodeId) return true; // Cycle!
        visited2.add(edge.sourceNodeId);
        queue2.push(edge.sourceNodeId);
      }
    }
  }

  return false;
}
