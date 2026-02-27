/**
 * GraphStore - Manages the node graph topology and parameter values.
 * Pure data layer with no rendering logic.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { DataType, GraphEdge, GraphNode, NodeColorTag, NodeDefinition } from '@/types';
import { NodeRegistry } from '@/registry/nodes';
import { TemplateBuildResult } from '@/templates/graphTemplates';
import { SerializedGraph, serializeGraph, deserializeGraph } from '@/utils/graphSerializer';

export interface GraphState {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
  resultNodeId: string;
}

let edgeCounter = 0;

function createResultNode(): GraphNode {
  return {
    id: 'result-node',
    definitionId: 'result',
    position: { x: 500, y: 200 },
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
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());
  // Structural version counter - increments on node/edge/parameter changes, NOT preview updates.
  // Used as a stable dependency for auto-save to avoid infinite loops from preview thumbnail updates.
  const [structuralVersion, setStructuralVersion] = useState(0);
  const bumpVersion = useCallback(() => setStructuralVersion(v => v + 1), []);

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
    bumpVersion();

    return id;
  }, [bumpVersion]);

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
    bumpVersion();
  }, [resultNodeId, bumpVersion]);

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => {
      const node = prev.get(nodeId);
      if (!node) return prev;
      const next = new Map(prev);
      next.set(nodeId, { ...node, position });
      return next;
    });
    bumpVersion();
  }, [bumpVersion]);

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
    bumpVersion();
  }, [bumpVersion]);

  const toggleEnabled = useCallback((nodeId: string) => {
    setNodes(prev => {
      const node = prev.get(nodeId);
      if (!node) return prev;
      const next = new Map(prev);
      next.set(nodeId, { ...node, enabled: !node.enabled });
      return next;
    });
    bumpVersion();
  }, [bumpVersion]);

  const toggleCollapsed = useCallback((nodeId: string) => {
    setNodes(prev => {
      const node = prev.get(nodeId);
      if (!node) return prev;
      const next = new Map(prev);
      next.set(nodeId, { ...node, collapsed: !node.collapsed });
      return next;
    });
    bumpVersion();
  }, [bumpVersion]);

  const setColorTag = useCallback((nodeId: string, colorTag: NodeColorTag) => {
    setNodes(prev => {
      const node = prev.get(nodeId);
      if (!node) return prev;
      const next = new Map(prev);
      next.set(nodeId, { ...node, colorTag });
      return next;
    });
    bumpVersion();
  }, [bumpVersion]);

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
    setSelectedEdgeIds(new Set()); // Clear edge selection when selecting nodes
  }, []);

  const selectEdge = useCallback((edgeId: string, selected: boolean) => {
    setSelectedEdgeIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(edgeId);
      } else {
        next.delete(edgeId);
      }
      return next;
    });
    if (selected) {
      setSelectedNodeIds(new Set()); // Clear node selection when selecting edges
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
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

    bumpVersion();
    return true;
  }, [nodes, edges, bumpVersion]);

  const disconnect = useCallback((edgeId: string) => {
    setEdges(prev => {
      const next = new Map(prev);
      next.delete(edgeId);
      return next;
    });
    bumpVersion();
  }, [bumpVersion]);

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

  // ---- Edge Queries ----

  const getEdgeToPort = useCallback((targetNodeId: string, targetPortId: string): GraphEdge | undefined => {
    for (const edge of edges.values()) {
      if (edge.targetNodeId === targetNodeId && edge.targetPortId === targetPortId) {
        return edge;
      }
    }
    return undefined;
  }, [edges]);

  const getEdge = useCallback((edgeId: string): GraphEdge | undefined => {
    return edges.get(edgeId);
  }, [edges]);

  // ---- Auto-Connect Operations ----

  /**
   * Atomically add a node and auto-wire it into the chain.
   * Processors get spliced before Result; generators connect if Result is empty.
   */
  const autoInsertNode = useCallback((
    definitionId: string,
    position: { x: number; y: number },
  ): string => {
    const def = NodeRegistry.get(definitionId);
    if (!def) return '';

    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const params = NodeRegistry.getDefaultParameters(definitionId);
    const newNode: GraphNode = {
      id,
      definitionId,
      position,
      parameters: params,
      enabled: true,
      collapsed: false,
      colorTag: 'default',
    };

    const primaryInput = findPrimaryMapInput(def);
    const hasMapOutput = def.outputs.some(p => p.dataType === DataType.Map);

    // Check if we need to splice (processor with existing chain)
    // We peek at edges to decide whether to shift Result right
    const needsSplice = !def.isGenerator && primaryInput && hasMapOutput;
    let willSplice = false;
    if (needsSplice) {
      for (const edge of edges.values()) {
        if (edge.targetNodeId === resultNodeId && edge.targetPortId === 'source') {
          willSplice = true;
          break;
        }
      }
    }

    setNodes(prev => {
      const next = new Map(prev);
      next.set(id, newNode);

      // When splicing, shift Result right if it would overlap with the new node
      if (willSplice) {
        const result = next.get(resultNodeId);
        if (result && position.x + 280 > result.position.x) {
          next.set(resultNodeId, {
            ...result,
            position: { x: position.x + 280, y: result.position.y },
          });
        }
      }

      return next;
    });

    setEdges(prev => {
      const next = new Map(prev);

      // Find existing edge feeding Result's source
      let existingEdge: GraphEdge | undefined;
      for (const edge of next.values()) {
        if (edge.targetNodeId === resultNodeId && edge.targetPortId === 'source') {
          existingEdge = edge;
          break;
        }
      }

      if (def.isGenerator) {
        if (!existingEdge && hasMapOutput) {
          const edgeId = `edge_${edgeCounter++}`;
          next.set(edgeId, {
            id: edgeId,
            sourceNodeId: id,
            sourcePortId: 'out',
            targetNodeId: resultNodeId,
            targetPortId: 'source',
            dataType: DataType.Map,
          });
        }
      } else if (primaryInput && hasMapOutput) {
        if (!existingEdge) {
          const edgeId = `edge_${edgeCounter++}`;
          next.set(edgeId, {
            id: edgeId,
            sourceNodeId: id,
            sourcePortId: 'out',
            targetNodeId: resultNodeId,
            targetPortId: 'source',
            dataType: DataType.Map,
          });
        } else {
          // Splice: oldSource → newNode → Result
          next.delete(existingEdge.id);

          const edgeId1 = `edge_${edgeCounter++}`;
          next.set(edgeId1, {
            id: edgeId1,
            sourceNodeId: existingEdge.sourceNodeId,
            sourcePortId: existingEdge.sourcePortId,
            targetNodeId: id,
            targetPortId: primaryInput.id,
            dataType: DataType.Map,
          });

          const edgeId2 = `edge_${edgeCounter++}`;
          next.set(edgeId2, {
            id: edgeId2,
            sourceNodeId: id,
            sourcePortId: 'out',
            targetNodeId: resultNodeId,
            targetPortId: 'source',
            dataType: DataType.Map,
          });
        }
      }

      return next;
    });

    bumpVersion();
    return id;
  }, [resultNodeId, bumpVersion]);

  /**
   * Atomically splice a new node into an existing edge.
   * Removes the edge and creates: source → newNode → target.
   */
  const spliceNodeIntoEdge = useCallback((
    definitionId: string,
    position: { x: number; y: number },
    edgeId: string,
  ): string => {
    const def = NodeRegistry.get(definitionId);
    if (!def || def.isGenerator) return '';

    const primaryInput = findPrimaryMapInput(def);
    const hasMapOutput = def.outputs.some(p => p.dataType === DataType.Map);
    if (!primaryInput || !hasMapOutput) return '';

    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const params = NodeRegistry.getDefaultParameters(definitionId);
    const newNode: GraphNode = {
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
      next.set(id, newNode);
      return next;
    });

    setEdges(prev => {
      const next = new Map(prev);
      const targetEdge = next.get(edgeId);
      if (!targetEdge) return prev;

      next.delete(edgeId);

      const edgeId1 = `edge_${edgeCounter++}`;
      next.set(edgeId1, {
        id: edgeId1,
        sourceNodeId: targetEdge.sourceNodeId,
        sourcePortId: targetEdge.sourcePortId,
        targetNodeId: id,
        targetPortId: primaryInput.id,
        dataType: DataType.Map,
      });

      const edgeId2 = `edge_${edgeCounter++}`;
      next.set(edgeId2, {
        id: edgeId2,
        sourceNodeId: id,
        sourcePortId: 'out',
        targetNodeId: targetEdge.targetNodeId,
        targetPortId: targetEdge.targetPortId,
        dataType: DataType.Map,
      });

      return next;
    });

    bumpVersion();
    return id;
  }, [bumpVersion]);

  /**
   * Atomically apply a template: clear all non-result nodes/edges, add template nodes and edges.
   */
  const applyTemplate = useCallback((buildResult: TemplateBuildResult) => {
    const nodeIds: string[] = [];

    // Create all template nodes
    const newNodes = new Map<string, GraphNode>();
    const resultNode = nodes.get(resultNodeId) || createResultNode();
    newNodes.set(resultNodeId, resultNode);

    for (const tNode of buildResult.nodes) {
      const def = NodeRegistry.get(tNode.definitionId);
      if (!def) continue;
      const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${nodeIds.length}`;
      nodeIds.push(id);
      const params = NodeRegistry.getDefaultParameters(tNode.definitionId);
      // Override with template-specified parameters
      if (tNode.parameters) {
        for (const [k, v] of Object.entries(tNode.parameters)) {
          params[k] = v;
        }
      }
      newNodes.set(id, {
        id,
        definitionId: tNode.definitionId,
        position: tNode.position,
        parameters: params,
        enabled: true,
        collapsed: false,
        colorTag: 'default',
      });
    }

    // Create all template edges
    const newEdges = new Map<string, GraphEdge>();
    for (const tEdge of buildResult.edges) {
      const sourceId = tEdge.sourceIdx >= 0 ? nodeIds[tEdge.sourceIdx] : resultNodeId;
      const targetId = tEdge.targetIdx >= 0 ? nodeIds[tEdge.targetIdx] : resultNodeId;
      if (!sourceId || !targetId) continue;

      const edgeId = `edge_${edgeCounter++}`;
      newEdges.set(edgeId, {
        id: edgeId,
        sourceNodeId: sourceId,
        sourcePortId: tEdge.sourcePort,
        targetNodeId: targetId,
        targetPortId: tEdge.targetPort,
        dataType: DataType.Map,
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
    bumpVersion();
  }, [nodes, resultNodeId, bumpVersion]);

  // ---- Serialization / Persistence ----

  const getSerializedState = useCallback((): SerializedGraph => {
    return serializeGraph(nodes, edges, resultNodeId);
  }, [nodes, edges, resultNodeId]);

  const loadFromSerialized = useCallback((data: SerializedGraph) => {
    const deserialized = deserializeGraph(data);
    setNodes(deserialized.nodes);
    setEdges(deserialized.edges);
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
    bumpVersion();
  }, [bumpVersion]);

  const resetGraph = useCallback(() => {
    const initial = new Map<string, GraphNode>();
    const result = createResultNode();
    initial.set(result.id, result);
    setNodes(initial);
    setEdges(new Map());
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
    bumpVersion();
  }, [bumpVersion]);

  const state: GraphState = useMemo(() => ({
    nodes,
    edges,
    selectedNodeIds,
    selectedEdgeIds,
    resultNodeId,
  }), [nodes, edges, selectedNodeIds, selectedEdgeIds, resultNodeId]);

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
    selectEdge,
    clearSelection,
    connect,
    disconnect,
    getUpstreamNodes,
    getEdgeToPort,
    getEdge,
    autoInsertNode,
    spliceNodeIntoEdge,
    applyTemplate,
    getSerializedState,
    loadFromSerialized,
    resetGraph,
    structuralVersion,
  };
}

// ---- Helpers ----

/** Find the primary Map input port for a node definition. Prefers 'source', then required Map, then any Map. */
function findPrimaryMapInput(def: NodeDefinition) {
  return def.inputs.find(p => p.id === 'source' && p.dataType === DataType.Map)
    || def.inputs.find(p => p.dataType === DataType.Map && p.required)
    || def.inputs.find(p => p.dataType === DataType.Map)
    || null;
}

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
