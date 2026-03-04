/**
 * GraphStore - Manages the node graph topology and parameter values.
 * Pure data layer with no rendering logic.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { DataType, GraphEdge, GraphNode, NodeColorTag, NodeDefinition } from '@/types';
import { NodeRegistry, getEffectiveInputs } from '@/registry/nodes';
import { TemplateBuildResult } from '@/templates/graphTemplates';
import { SerializedGraph, serializeGraph, deserializeGraph } from '@/utils/graphSerializer';
import { autoLayoutGraph } from '@/utils/autoLayout';
import { debugLog } from './debugLog';

export interface GraphState {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  edgesBySource: Map<string, Set<string>>;  // nodeId -> set of edgeIds where node is source
  edgesByTarget: Map<string, Set<string>>;  // nodeId -> set of edgeIds where node is target
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
  resultNodeId: string;
}

/** Build edge indexes from a flat edge map */
function buildEdgeIndexes(edges: Map<string, GraphEdge>): {
  edgesBySource: Map<string, Set<string>>;
  edgesByTarget: Map<string, Set<string>>;
} {
  const edgesBySource = new Map<string, Set<string>>();
  const edgesByTarget = new Map<string, Set<string>>();
  for (const [edgeId, edge] of edges) {
    let srcSet = edgesBySource.get(edge.sourceNodeId);
    if (!srcSet) { srcSet = new Set(); edgesBySource.set(edge.sourceNodeId, srcSet); }
    srcSet.add(edgeId);

    let tgtSet = edgesByTarget.get(edge.targetNodeId);
    if (!tgtSet) { tgtSet = new Set(); edgesByTarget.set(edge.targetNodeId, tgtSet); }
    tgtSet.add(edgeId);
  }
  return { edgesBySource, edgesByTarget };
}

/** Get all edges connected to a node, split into inputs (where node is target) and outputs (where node is source) */
export function getNodeEdges(nodeId: string, state: GraphState): { inputs: GraphEdge[], outputs: GraphEdge[] } {
  const inputs: GraphEdge[] = [];
  const outputs: GraphEdge[] = [];
  for (const edgeId of (state.edgesByTarget.get(nodeId) || [])) {
    const edge = state.edges.get(edgeId);
    if (edge) inputs.push(edge);
  }
  for (const edgeId of (state.edgesBySource.get(nodeId) || [])) {
    const edge = state.edges.get(edgeId);
    if (edge) outputs.push(edge);
  }
  return { inputs, outputs };
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
  const [edgesBySource, setEdgesBySource] = useState<Map<string, Set<string>>>(new Map());
  const [edgesByTarget, setEdgesByTarget] = useState<Map<string, Set<string>>>(new Map());
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());
  // Structural version counter - increments on node/edge/parameter changes, NOT preview updates.
  // Used as a stable dependency for auto-save to avoid infinite loops from preview thumbnail updates.
  const [structuralVersion, setStructuralVersion] = useState(0);
  const bumpVersion = useCallback(() => setStructuralVersion(v => v + 1), []);

  const resultNodeId = 'result-node';

  /** Set edges and rebuild indexes atomically */
  const setEdgesWithIndex = useCallback((nextEdges: Map<string, GraphEdge>) => {
    setEdges(nextEdges);
    const { edgesBySource: newSrc, edgesByTarget: newTgt } = buildEdgeIndexes(nextEdges);
    setEdgesBySource(newSrc);
    setEdgesByTarget(newTgt);
  }, []);

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

    debugLog('EDGE', `removeNode() deleting node ${nodeId} and its edges`);

    setNodes(prev => {
      const next = new Map(prev);
      next.delete(nodeId);
      return next;
    });

    // Remove all edges connected to this node and rebuild indexes
    setEdges(prev => {
      const next = new Map(prev);
      let changed = false;
      for (const [id, edge] of next) {
        if (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId) {
          debugLog('EDGE', `removeNode() cleaning edge ${id}`, {
            source: `${edge.sourceNodeId}:${edge.sourcePortId}`,
            target: `${edge.targetNodeId}:${edge.targetPortId}`,
          });
          next.delete(id);
          changed = true;
        }
      }
      if (changed) {
        const { edgesBySource: newSrc, edgesByTarget: newTgt } = buildEdgeIndexes(next);
        setEdgesBySource(newSrc);
        setEdgesByTarget(newTgt);
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
    // NOTE: No bumpVersion() here — position changes during drag should NOT
    // trigger history snapshots (Bug 9). Call commitPositionChange() on dragStop instead.
  }, []);

  /** Bump structural version after a node drag completes, triggering history + auto-save. */
  const commitPositionChange = useCallback(() => {
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

  /** Set image data directly on a node (for image/external nodes) */
  const setNodeImage = useCallback((nodeId: string, imageUrl: string, width?: number, height?: number) => {
    setNodes(prev => {
      const node = prev.get(nodeId);
      if (!node) return prev;
      const next = new Map(prev);
      next.set(nodeId, { ...node, imageUrl, width: width ?? node.width, height: height ?? node.height });
      return next;
    });
    bumpVersion();
  }, [bumpVersion]);

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
    // Validate nodes (reads closure, but staleness here is harmless — just validation)
    const sourceNode = nodes.get(sourceNodeId);
    const targetNode = nodes.get(targetNodeId);
    if (!sourceNode || !targetNode) return false;

    const sourceDef = NodeRegistry.get(sourceNode.definitionId);
    const targetDef = NodeRegistry.get(targetNode.definitionId);
    if (!sourceDef || !targetDef) return false;

    const sourcePort = sourceDef.outputs.find(p => p.id === sourcePortId);
    // Use effective inputs (includes auto-generated map_ ports for mappable params)
    const effectiveTargetInputs = getEffectiveInputs(targetDef);
    const targetPort = effectiveTargetInputs.find(p => p.id === targetPortId);
    if (!sourcePort || !targetPort) return false;

    // Type check
    if (!NodeRegistry.canConnect(sourcePort, targetPort)) return false;

    // Use functional updater to avoid stale edge closure.
    // The updater runs synchronously, so the `success` flag is set before we return.
    let success = false;
    setEdges(prev => {
      // Cycle check using current edges (not stale closure)
      const { edgesByTarget: currentTargetIdx } = buildEdgeIndexes(prev);
      if (wouldCreateCycle(sourceNodeId, targetNodeId, prev, currentTargetIdx)) return prev;

      // Build new edge map: remove existing connection to same target port, add new edge
      const next = new Map(prev);
      for (const [id, edge] of next) {
        if (edge.targetNodeId === targetNodeId && edge.targetPortId === targetPortId) {
          debugLog('EDGE', `connect() replacing existing edge ${id} to ${targetNodeId}:${targetPortId}`, {
            oldSource: edge.sourceNodeId, oldSourcePort: edge.sourcePortId,
            newSource: sourceNodeId, newSourcePort: sourcePortId,
          });
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
        dataType: targetPort!.dataType,
      });

      debugLog('EDGE', `connect() created edge ${edgeId}`, {
        source: `${sourceNodeId}:${sourcePortId}`,
        target: `${targetNodeId}:${targetPortId}`,
        totalEdges: next.size,
      });

      // Rebuild indexes to match the new edge map
      const { edgesBySource: newSrc, edgesByTarget: newTgt } = buildEdgeIndexes(next);
      setEdgesBySource(newSrc);
      setEdgesByTarget(newTgt);

      success = true;
      return next;
    });

    if (success) bumpVersion();
    return success;
  }, [nodes, bumpVersion]);

  const disconnect = useCallback((edgeId: string) => {
    // Use functional updater to avoid stale closure when deleting multiple edges
    // in a single synchronous loop (e.g., selecting multiple edges + pressing Delete).
    // Without this, each call would clone the same stale `edges` map and only the
    // last deletion would survive React's batched setState.
    let didRemove = false;
    setEdges(prev => {
      const edge = prev.get(edgeId);
      if (edge) {
        debugLog('EDGE', `disconnect() removing edge ${edgeId}`, {
          source: `${edge.sourceNodeId}:${edge.sourcePortId}`,
          target: `${edge.targetNodeId}:${edge.targetPortId}`,
          remainingEdges: prev.size - 1,
        });
      } else {
        debugLog('EDGE', `disconnect() called for non-existent edge ${edgeId} (no-op)`);
        return prev; // No change needed
      }
      const next = new Map(prev);
      next.delete(edgeId);
      // Rebuild indexes inside the updater so they match the actual edge map
      const { edgesBySource: newSrc, edgesByTarget: newTgt } = buildEdgeIndexes(next);
      setEdgesBySource(newSrc);
      setEdgesByTarget(newTgt);
      didRemove = true;
      return next;
    });
    // Only bump version when an edge was actually removed — avoids spurious undo entries
    if (didRemove) bumpVersion();
  }, [bumpVersion]);

  // ---- Graph Queries ----

  const getUpstreamNodes = useCallback((nodeId: string): string[] => {
    const visited = new Set<string>();
    const queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      // Use edge index: look up edges where current node is target
      for (const edgeId of (edgesByTarget.get(current) || [])) {
        const edge = edges.get(edgeId);
        if (edge && !visited.has(edge.sourceNodeId)) {
          visited.add(edge.sourceNodeId);
          queue.push(edge.sourceNodeId);
        }
      }
    }
    return Array.from(visited);
  }, [edges, edgesByTarget]);

  // ---- Edge Queries ----

  const getEdgeToPort = useCallback((targetNodeId: string, targetPortId: string): GraphEdge | undefined => {
    // Use edge index: only iterate edges targeting this node
    for (const edgeId of (edgesByTarget.get(targetNodeId) || [])) {
      const edge = edges.get(edgeId);
      if (edge && edge.targetPortId === targetPortId) {
        return edge;
      }
    }
    return undefined;
  }, [edges, edgesByTarget]);

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

    // Build new edge map
    const nextEdges = new Map(edges);

    // Find existing edge feeding Result's source
    let existingEdge: GraphEdge | undefined;
    for (const edge of nextEdges.values()) {
      if (edge.targetNodeId === resultNodeId && edge.targetPortId === 'source') {
        existingEdge = edge;
        break;
      }
    }

    if (def.isGenerator) {
      if (!existingEdge && hasMapOutput) {
        const edgeId = `edge_${edgeCounter++}`;
        nextEdges.set(edgeId, {
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
        nextEdges.set(edgeId, {
          id: edgeId,
          sourceNodeId: id,
          sourcePortId: 'out',
          targetNodeId: resultNodeId,
          targetPortId: 'source',
          dataType: DataType.Map,
        });
      } else {
        // Splice: oldSource -> newNode -> Result
        nextEdges.delete(existingEdge.id);

        const edgeId1 = `edge_${edgeCounter++}`;
        nextEdges.set(edgeId1, {
          id: edgeId1,
          sourceNodeId: existingEdge.sourceNodeId,
          sourcePortId: existingEdge.sourcePortId,
          targetNodeId: id,
          targetPortId: primaryInput.id,
          dataType: DataType.Map,
        });

        const edgeId2 = `edge_${edgeCounter++}`;
        nextEdges.set(edgeId2, {
          id: edgeId2,
          sourceNodeId: id,
          sourcePortId: 'out',
          targetNodeId: resultNodeId,
          targetPortId: 'source',
          dataType: DataType.Map,
        });
      }
    }

    setEdgesWithIndex(nextEdges);
    bumpVersion();
    return id;
  }, [edges, resultNodeId, bumpVersion, setEdgesWithIndex]);

  /**
   * Atomically splice a new node into an existing edge.
   * Removes the edge and creates: source -> newNode -> target.
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

    const targetEdge = edges.get(edgeId);
    if (!targetEdge) return '';

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

    debugLog('EDGE', `spliceNodeIntoEdge() splicing new node ${id} into edge ${edgeId}`, {
      removedEdge: `${targetEdge.sourceNodeId}→${targetEdge.targetNodeId}`,
      newNode: definitionId,
    });

    const nextEdges = new Map(edges);
    nextEdges.delete(edgeId);

    const edgeId1 = `edge_${edgeCounter++}`;
    nextEdges.set(edgeId1, {
      id: edgeId1,
      sourceNodeId: targetEdge.sourceNodeId,
      sourcePortId: targetEdge.sourcePortId,
      targetNodeId: id,
      targetPortId: primaryInput.id,
      dataType: DataType.Map,
    });

    const edgeId2 = `edge_${edgeCounter++}`;
    nextEdges.set(edgeId2, {
      id: edgeId2,
      sourceNodeId: id,
      sourcePortId: 'out',
      targetNodeId: targetEdge.targetNodeId,
      targetPortId: targetEdge.targetPortId,
      dataType: DataType.Map,
    });

    debugLog('EDGE', `spliceNodeIntoEdge() created edges ${edgeId1}, ${edgeId2}`);

    setEdgesWithIndex(nextEdges);
    bumpVersion();
    return id;
  }, [edges, bumpVersion, setEdgesWithIndex]);

  /**
   * Splice an EXISTING node into an edge.
   * Removes the edge and wires: source -> existingNode -> target.
   * Also removes any existing edges to the node's primary Map input (to avoid double-connections).
   */
  const spliceExistingNodeIntoEdge = useCallback((
    nodeId: string,
    edgeId: string,
  ): boolean => {
    const node = nodes.get(nodeId);
    if (!node) return false;

    const def = NodeRegistry.get(node.definitionId);
    if (!def || def.isGenerator) return false;

    const primaryInput = findPrimaryMapInput(def);
    const hasMapOutput = def.outputs.some(p => p.dataType === DataType.Map);
    if (!primaryInput || !hasMapOutput) return false;

    const targetEdge = edges.get(edgeId);
    if (!targetEdge) return false;

    // Don't splice into an edge that already connects to/from this node
    if (targetEdge.sourceNodeId === nodeId || targetEdge.targetNodeId === nodeId) return false;

    debugLog('EDGE', `spliceExistingNodeIntoEdge() splicing node ${nodeId} into edge ${edgeId}`, {
      removedEdge: `${targetEdge.sourceNodeId}→${targetEdge.targetNodeId}`,
      nodeDefinition: node.definitionId,
    });

    const nextEdges = new Map(edges);
    nextEdges.delete(edgeId);

    // Remove any existing edge to this node's primary input
    for (const [eid, e] of nextEdges) {
      if (e.targetNodeId === nodeId && e.targetPortId === primaryInput.id) {
        nextEdges.delete(eid);
      }
    }

    // Remove any existing edge from this node's output to the same target
    for (const [eid, e] of nextEdges) {
      if (e.sourceNodeId === nodeId && e.sourcePortId === 'out'
          && e.targetNodeId === targetEdge.targetNodeId && e.targetPortId === targetEdge.targetPortId) {
        nextEdges.delete(eid);
      }
    }

    const edgeId1 = `edge_${edgeCounter++}`;
    nextEdges.set(edgeId1, {
      id: edgeId1,
      sourceNodeId: targetEdge.sourceNodeId,
      sourcePortId: targetEdge.sourcePortId,
      targetNodeId: nodeId,
      targetPortId: primaryInput.id,
      dataType: DataType.Map,
    });

    const edgeId2 = `edge_${edgeCounter++}`;
    nextEdges.set(edgeId2, {
      id: edgeId2,
      sourceNodeId: nodeId,
      sourcePortId: 'out',
      targetNodeId: targetEdge.targetNodeId,
      targetPortId: targetEdge.targetPortId,
      dataType: DataType.Map,
    });

    setEdgesWithIndex(nextEdges);
    bumpVersion();
    return true;
  }, [nodes, edges, bumpVersion, setEdgesWithIndex]);

  /**
   * Atomically add a new node and connect its output to a specific port.
   * Avoids the stale-closure problem of calling addNode() then connect() separately.
   */
  const addNodeAndConnect = useCallback((
    definitionId: string,
    position: { x: number; y: number },
    targetNodeId: string,
    targetPortId: string,
  ): string => {
    const def = NodeRegistry.get(definitionId);
    if (!def) return '';

    const targetNode = nodes.get(targetNodeId);
    if (!targetNode) return '';

    const targetDef = NodeRegistry.get(targetNode.definitionId);
    if (!targetDef) return '';

    if (def.outputs.length === 0) return '';
    const sourcePortId = def.outputs[0].id;
    const sourcePort = def.outputs[0];
    const effectiveTargetInputs = getEffectiveInputs(targetDef);
    const targetPort = effectiveTargetInputs.find(p => p.id === targetPortId);
    if (!targetPort) return '';
    if (!NodeRegistry.canConnect(sourcePort, targetPort)) return '';

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

    // Build new edge map: remove existing connection to same target port, add new edge
    const nextEdges = new Map(edges);
    for (const [eid, edge] of nextEdges) {
      if (edge.targetNodeId === targetNodeId && edge.targetPortId === targetPortId) {
        debugLog('EDGE', `addNodeAndConnect() replacing existing edge ${eid} to ${targetNodeId}:${targetPortId}`);
        nextEdges.delete(eid);
      }
    }

    const edgeId = `edge_${edgeCounter++}`;
    nextEdges.set(edgeId, {
      id: edgeId,
      sourceNodeId: id,
      sourcePortId,
      targetNodeId,
      targetPortId,
      dataType: targetPort.dataType,
    });

    debugLog('EDGE', `addNodeAndConnect() created node ${id} and edge ${edgeId}`, {
      source: `${id}:${sourcePortId}`,
      target: `${targetNodeId}:${targetPortId}`,
    });

    setEdgesWithIndex(nextEdges);
    bumpVersion();
    return id;
  }, [nodes, edges, bumpVersion, setEdgesWithIndex]);

  /**
   * Atomically insert a chain of processor nodes before the Result node.
   * Each step provides a definitionId, position, and optional parameter overrides.
   * Builds all nodes and edges in one pass to avoid stale-closure issues.
   */
  const insertChain = useCallback((
    steps: { definitionId: string; position: { x: number; y: number }; parameters?: Record<string, number | string | boolean> }[],
  ): string[] => {
    if (steps.length === 0) return [];

    const nodeIds: string[] = [];
    const newNodes: GraphNode[] = [];

    for (const step of steps) {
      const def = NodeRegistry.get(step.definitionId);
      if (!def) continue;
      const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${nodeIds.length}`;
      nodeIds.push(id);
      const params = NodeRegistry.getDefaultParameters(step.definitionId);
      if (step.parameters) {
        for (const [k, v] of Object.entries(step.parameters)) {
          params[k] = v;
        }
      }
      newNodes.push({
        id,
        definitionId: step.definitionId,
        position: step.position,
        parameters: params,
        enabled: true,
        collapsed: false,
        colorTag: 'default',
      });
    }

    if (newNodes.length === 0) return [];

    // Add all new nodes
    setNodes(prev => {
      const next = new Map(prev);
      for (const node of newNodes) {
        next.set(node.id, node);
      }
      return next;
    });

    // Build new edge map: splice the chain before Result
    const nextEdges = new Map(edges);

    // Find existing edge feeding Result's source
    let existingEdge: GraphEdge | undefined;
    for (const edge of nextEdges.values()) {
      if (edge.targetNodeId === resultNodeId && edge.targetPortId === 'source') {
        existingEdge = edge;
        break;
      }
    }

    // Wire the chain: previous -> chain[0] -> chain[1] -> ... -> Result
    // First, determine what feeds into chain[0]
    let previousSourceNodeId: string | undefined;
    let previousSourcePortId: string | undefined;
    if (existingEdge) {
      previousSourceNodeId = existingEdge.sourceNodeId;
      previousSourcePortId = existingEdge.sourcePortId;
      nextEdges.delete(existingEdge.id);
    }

    for (let i = 0; i < newNodes.length; i++) {
      const node = newNodes[i];
      const def = NodeRegistry.get(node.definitionId)!;
      const primaryInput = findPrimaryMapInput(def);

      // Wire input from previous node (or existing upstream)
      if (primaryInput && previousSourceNodeId && previousSourcePortId) {
        const eid = `edge_${edgeCounter++}`;
        nextEdges.set(eid, {
          id: eid,
          sourceNodeId: previousSourceNodeId,
          sourcePortId: previousSourcePortId,
          targetNodeId: node.id,
          targetPortId: primaryInput.id,
          dataType: DataType.Map,
        });
      }

      // This node's output becomes the next input
      previousSourceNodeId = node.id;
      previousSourcePortId = 'out';
    }

    // Wire last chain node to Result
    if (previousSourceNodeId && previousSourcePortId) {
      const eid = `edge_${edgeCounter++}`;
      nextEdges.set(eid, {
        id: eid,
        sourceNodeId: previousSourceNodeId,
        sourcePortId: previousSourcePortId,
        targetNodeId: resultNodeId,
        targetPortId: 'source',
        dataType: DataType.Map,
      });
    }

    debugLog('EDGE', `insertChain() created ${newNodes.length} nodes with edges`, {
      nodeIds,
      totalEdges: nextEdges.size,
    });

    setEdgesWithIndex(nextEdges);
    bumpVersion();
    return nodeIds;
  }, [edges, resultNodeId, bumpVersion, setEdgesWithIndex]);

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

      const eid = `edge_${edgeCounter++}`;
      newEdges.set(eid, {
        id: eid,
        sourceNodeId: sourceId,
        sourcePortId: tEdge.sourcePort,
        targetNodeId: targetId,
        targetPortId: tEdge.targetPort,
        dataType: DataType.Map,
      });
    }

    setNodes(newNodes);
    setEdgesWithIndex(newEdges);
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
    bumpVersion();
  }, [nodes, resultNodeId, bumpVersion, setEdgesWithIndex]);

  // ---- Serialization / Persistence ----

  const getSerializedState = useCallback((): SerializedGraph => {
    return serializeGraph(nodes, edges, resultNodeId);
  }, [nodes, edges, resultNodeId]);

  const loadFromSerialized = useCallback((data: SerializedGraph, options?: { autoLayout?: boolean }) => {
    const graphData = options?.autoLayout ? autoLayoutGraph(data) : data;
    const deserialized = deserializeGraph(graphData);
    debugLog('EDGE', `loadFromSerialized() restoring graph`, {
      nodes: deserialized.nodes.size,
      edges: deserialized.edges.size,
      edgeIds: Array.from(deserialized.edges.keys()).join(', '),
    });

    // Sync edgeCounter to avoid ID collisions with deserialized edge IDs.
    // Without this, new edges could reuse IDs like "edge_5" that already exist
    // in the loaded graph, silently overwriting connections.
    for (const edgeId of deserialized.edges.keys()) {
      const match = edgeId.match(/^edge_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10) + 1;
        if (num > edgeCounter) edgeCounter = num;
      }
    }

    setNodes(deserialized.nodes);
    setEdgesWithIndex(deserialized.edges);
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
    bumpVersion();
  }, [bumpVersion, setEdgesWithIndex]);

  const resetGraph = useCallback(() => {
    const initial = new Map<string, GraphNode>();
    const result = createResultNode();
    initial.set(result.id, result);
    setNodes(initial);
    setEdgesWithIndex(new Map());
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
    bumpVersion();
  }, [bumpVersion, setEdgesWithIndex]);

  /**
   * "End Here" — rewire the given node as the final output.
   * 1. Remove all edges feeding into the result node's 'source' port
   * 2. Connect nodeId:out → result-node:source
   * 3. Remove any nodes no longer reachable from the result node
   *    (except generator/source nodes with no incoming edges — keep those)
   */
  const endHere = useCallback((nodeId: string) => {
    console.log('[endHere] called with nodeId:', nodeId, 'resultNodeId:', resultNodeId);
    console.log('[endHere] nodes.has(nodeId):', nodes.has(nodeId), 'nodes.has(resultNodeId):', nodes.has(resultNodeId));
    console.log('[endHere] all node IDs:', Array.from(nodes.keys()));

    if (nodeId === resultNodeId) {
      console.log('[endHere] SKIPPED — nodeId === resultNodeId');
      return;
    }

    // Safety: verify the node and result node exist
    if (!nodes.has(nodeId) || !nodes.has(resultNodeId)) {
      console.log('[endHere] SKIPPED — node or result not found in nodes map');
      return;
    }

    // Collect edges to remove and build fresh edge map
    const edgesToKeep = new Map<string, GraphEdge>();
    for (const [eid, edge] of edges) {
      // Remove all edges feeding into result node's 'source' port
      if (edge.targetNodeId === resultNodeId && edge.targetPortId === 'source') {
        continue; // Skip — will be replaced
      }
      edgesToKeep.set(eid, edge);
    }

    // Add new edge: nodeId:out → result-node:source
    const newEdgeId = `edge_${edgeCounter++}`;
    edgesToKeep.set(newEdgeId, {
      id: newEdgeId,
      sourceNodeId: nodeId,
      sourcePortId: 'out',
      targetNodeId: resultNodeId,
      targetPortId: 'source',
      dataType: DataType.Map,
    });

    // Walk backwards from result node to find all reachable nodes
    const reachable = new Set<string>();
    const queue = [resultNodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      reachable.add(current);
      for (const edge of edgesToKeep.values()) {
        if (edge.targetNodeId === current && !reachable.has(edge.sourceNodeId)) {
          queue.push(edge.sourceNodeId);
        }
      }
    }

    // Identify nodes to remove: not reachable AND not a standalone generator
    const nodesToRemove = new Set<string>();
    for (const [nid] of nodes) {
      // NEVER remove the result node
      if (nid === resultNodeId) continue;
      // Keep reachable nodes
      if (reachable.has(nid)) continue;
      // Keep generators (nodes with no incoming edges — they're standalone sources)
      let hasIncoming = false;
      for (const edge of edgesToKeep.values()) {
        if (edge.targetNodeId === nid) {
          hasIncoming = true;
          break;
        }
      }
      if (!hasIncoming) continue;
      nodesToRemove.add(nid);
    }

    // Build final node and edge maps
    const newNodes = new Map(nodes);
    const newEdges = new Map(edgesToKeep);

    // Remove edges first (connected to nodes being removed)
    for (const [eid, edge] of newEdges) {
      if (nodesToRemove.has(edge.sourceNodeId) || nodesToRemove.has(edge.targetNodeId)) {
        // NEVER remove an edge connected to the result node
        if (edge.sourceNodeId === resultNodeId || edge.targetNodeId === resultNodeId) continue;
        newEdges.delete(eid);
      }
    }

    // Remove the nodes
    for (const nid of nodesToRemove) {
      newNodes.delete(nid);
    }

    debugLog('EDGE', `endHere: rewired ${nodeId} → result, removed ${nodesToRemove.size} downstream nodes`);

    setNodes(newNodes);
    setEdgesWithIndex(newEdges);
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
    bumpVersion();
  }, [nodes, edges, resultNodeId, bumpVersion, setEdgesWithIndex]);

  const state: GraphState = useMemo(() => ({
    nodes,
    edges,
    edgesBySource,
    edgesByTarget,
    selectedNodeIds,
    selectedEdgeIds,
    resultNodeId,
  }), [nodes, edges, edgesBySource, edgesByTarget, selectedNodeIds, selectedEdgeIds, resultNodeId]);

  return {
    state,
    addNode,
    removeNode,
    updateNodePosition,
    commitPositionChange,
    setParameter,
    toggleEnabled,
    toggleCollapsed,
    setColorTag,
    setNodePreview,
    setNodeImage,
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
    spliceExistingNodeIntoEdge,
    addNodeAndConnect,
    insertChain,
    applyTemplate,
    getSerializedState,
    loadFromSerialized,
    resetGraph,
    endHere,
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

/**
 * Cycle detection using edge index for O(V+E) BFS instead of O(V*E).
 * Checks if adding an edge from sourceNodeId -> targetNodeId would create a cycle.
 * Uses edgesByTarget index for fast upstream traversal.
 */
function wouldCreateCycle(
  sourceNodeId: string,
  targetNodeId: string,
  edges: Map<string, GraphEdge>,
  edgesByTarget: Map<string, Set<string>>,
): boolean {
  if (sourceNodeId === targetNodeId) return true;

  // BFS upstream from targetNodeId: can we reach sourceNodeId?
  const visited = new Set<string>();
  const queue = [targetNodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    // Use edge index for O(1) lookup of incoming edges
    for (const edgeId of (edgesByTarget.get(current) || [])) {
      const edge = edges.get(edgeId);
      if (!edge) continue;
      if (edge.sourceNodeId === sourceNodeId) return true; // Cycle!
      if (!visited.has(edge.sourceNodeId)) {
        visited.add(edge.sourceNodeId);
        queue.push(edge.sourceNodeId);
      }
    }
  }

  return false;
}
