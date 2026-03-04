/**
 * autoLayout - DAG-based layered layout for node graphs.
 * Computes non-overlapping positions using topological sort + layer assignment.
 * Used when opening community textures in the editor so nodes don't overlap.
 */

import { SerializedGraph, SerializedNode } from './graphSerializer';
import { NodeRegistry } from '@/registry/nodes';

// Layout constants
const NODE_WIDTH = 280;
const H_GAP = 60; // horizontal gap between layer edges
const V_GAP = 40; // vertical gap between nodes in the same layer
const RESULT_ANCHOR = { x: 500, y: 200 };

/**
 * Estimate the rendered height of a node based on its definition.
 * Uses the NodeRegistry to count inputs, parameters, and outputs.
 * Heights are intentionally generous to avoid any overlap.
 */
function estimateNodeHeight(definitionId: string, collapsed: boolean): number {
  const def = NodeRegistry.get(definitionId);
  if (!def) return 150; // generous default for unknown nodes

  // Header: title bar + category label + padding + borders
  let height = 56;

  // Input ports: ~24px each + section padding
  if (def.inputs.length > 0) {
    height += def.inputs.length * 24 + 12;
  }

  // Parameters (only when not collapsed): ~34px each (sliders/dropdowns are taller)
  if (!collapsed && def.parameters.length > 0) {
    height += def.parameters.length * 34 + 12;
  }

  // Output ports: ~24px each + section padding
  if (def.outputs.length > 0) {
    height += def.outputs.length * 24 + 12;
  }

  // Preview thumbnail area (most nodes show a 64px preview)
  if (def.outputs.length > 0) {
    height += 80;
  }

  // Bottom padding
  height += 12;

  return height;
}

/**
 * Compute non-overlapping positions for all nodes in a serialized graph.
 * Uses a layered DAG layout:
 *   1. Topological sort (Kahn's algorithm)
 *   2. Longest-path layer assignment (generators left, result right)
 *   3. Vertical stacking within each layer, centered around RESULT_ANCHOR.y
 *
 * Returns a new SerializedGraph with updated positions (input is not mutated).
 */
export function autoLayoutGraph(graph: SerializedGraph): SerializedGraph {
  const { nodes, edges, resultNodeId } = graph;
  console.log(`[autoLayout] Running on ${nodes.length} nodes, ${edges.length} edges`);
  if (nodes.length <= 1) return graph;

  // ---- Build adjacency ----
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const node of nodes) {
    incoming.set(node.id, []);
    outgoing.set(node.id, []);
  }
  for (const edge of edges) {
    incoming.get(edge.targetNodeId)?.push(edge.sourceNodeId);
    outgoing.get(edge.sourceNodeId)?.push(edge.targetNodeId);
  }

  // ---- Topological sort (Kahn's algorithm) ----
  const inDegree = new Map<string, number>();
  for (const node of nodes) inDegree.set(node.id, 0);
  for (const edge of edges) {
    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sorted.push(nodeId);
    for (const targetId of outgoing.get(nodeId) || []) {
      const newDeg = (inDegree.get(targetId) || 1) - 1;
      inDegree.set(targetId, newDeg);
      if (newDeg === 0) queue.push(targetId);
    }
  }

  // Handle any nodes not reached by topo sort (cycles or disconnected)
  for (const node of nodes) {
    if (!sorted.includes(node.id)) sorted.push(node.id);
  }

  // ---- Layer assignment: longest path from any source ----
  const layer = new Map<string, number>();
  for (const nodeId of sorted) {
    const preds = incoming.get(nodeId) || [];
    if (preds.length === 0) {
      layer.set(nodeId, 0);
    } else {
      const maxPredLayer = Math.max(...preds.map(p => layer.get(p) ?? 0));
      layer.set(nodeId, maxPredLayer + 1);
    }
  }

  // Force result node to the maximum layer
  const maxLayer = Math.max(...Array.from(layer.values()));
  layer.set(resultNodeId, maxLayer);

  // ---- Group nodes by layer ----
  const layers = new Map<number, string[]>();
  for (const [nodeId, l] of layer) {
    if (!layers.has(l)) layers.set(l, []);
    layers.get(l)!.push(nodeId);
  }

  // ---- Build node lookup ----
  const nodeById = new Map<string, SerializedNode>();
  for (const node of nodes) nodeById.set(node.id, node);

  // ---- Compute positions ----
  const newPositions = new Map<string, { x: number; y: number }>();

  // Result node anchor
  newPositions.set(resultNodeId, { ...RESULT_ANCHOR });

  // Calculate X for each layer (right to left from result)
  const layerX = new Map<number, number>();
  layerX.set(maxLayer, RESULT_ANCHOR.x);
  for (let l = maxLayer - 1; l >= 0; l--) {
    const rightLayerX = layerX.get(l + 1)!;
    layerX.set(l, rightLayerX - NODE_WIDTH - H_GAP);
  }

  // Position nodes within each layer (vertical stacking, centered)
  for (let l = 0; l <= maxLayer; l++) {
    const layerNodes = (layers.get(l) || []).filter(id => id !== resultNodeId);
    if (layerNodes.length === 0) continue;

    // Sort nodes within layer by their original y position for stability
    layerNodes.sort((a, b) => {
      const nodeA = nodeById.get(a);
      const nodeB = nodeById.get(b);
      return (nodeA?.position.y ?? 0) - (nodeB?.position.y ?? 0);
    });

    // Calculate heights
    const heights = layerNodes.map(id => {
      const node = nodeById.get(id)!;
      return estimateNodeHeight(node.definitionId, node.collapsed);
    });
    const totalHeight = heights.reduce((sum, h) => sum + h, 0)
      + (layerNodes.length - 1) * V_GAP;

    // Center the stack around RESULT_ANCHOR.y
    let currentY = RESULT_ANCHOR.y - totalHeight / 2;
    const x = layerX.get(l)!;

    for (let i = 0; i < layerNodes.length; i++) {
      newPositions.set(layerNodes[i], { x, y: Math.round(currentY) });
      currentY += heights[i] + V_GAP;
    }
  }

  // Return new graph with updated positions
  return {
    ...graph,
    nodes: nodes.map(node => ({
      ...node,
      position: newPositions.get(node.id) || node.position,
    })),
  };
}
