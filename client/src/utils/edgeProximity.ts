/**
 * edgeProximity - Finds the nearest edge to a given point on the canvas.
 * Used for drop-on-edge insertion: when a node is dropped near an edge,
 * splice it into that edge.
 */

import { Node, Edge } from 'reactflow';

interface Point {
  x: number;
  y: number;
}

/**
 * Distance from point P to line segment AB.
 */
function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.hypot(p.x - proj.x, p.y - proj.y);
}

// Approximate node dimensions for handle position calculation
const NODE_WIDTH = 220;
const NODE_HEADER_HEIGHT = 32;

/**
 * Approximate the path of a smoothstep edge as 3-segment polyline.
 * Source handle is on the right side, target handle is on the left side.
 */
function getEdgePolyline(
  sourceNode: Node,
  targetNode: Node,
  _edge: Edge,
): Point[] {
  // Source handle: right side of node, vertically centered on first port area
  const srcX = sourceNode.position.x + NODE_WIDTH;
  const srcY = sourceNode.position.y + NODE_HEADER_HEIGHT + 12;

  // Target handle: left side of node
  const tgtX = targetNode.position.x;
  const tgtY = targetNode.position.y + NODE_HEADER_HEIGHT + 12;

  // Smoothstep goes: source → right → midX → turn → midX → left → target
  const midX = (srcX + tgtX) / 2;

  return [
    { x: srcX, y: srcY },
    { x: midX, y: srcY },
    { x: midX, y: tgtY },
    { x: tgtX, y: tgtY },
  ];
}

/**
 * Find the nearest edge to a given flow-coordinate point.
 * Returns the edge ID and distance, or null if nothing is within threshold.
 */
export function findNearestEdge(
  point: Point,
  edges: Edge[],
  nodes: Node[],
  threshold = 30,
): { edgeId: string; distance: number } | null {
  const nodeMap = new Map<string, Node>();
  for (const n of nodes) nodeMap.set(n.id, n);

  let best: { edgeId: string; distance: number } | null = null;

  for (const edge of edges) {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;

    const polyline = getEdgePolyline(src, tgt, edge);

    // Min distance to any segment
    let minDist = Infinity;
    for (let i = 0; i < polyline.length - 1; i++) {
      const d = distToSegment(point, polyline[i], polyline[i + 1]);
      if (d < minDist) minDist = d;
    }

    if (minDist < threshold && (!best || minDist < best.distance)) {
      best = { edgeId: edge.id, distance: minDist };
    }
  }

  return best;
}
