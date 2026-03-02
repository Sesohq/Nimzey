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
const NODE_WIDTH_MIN = 220;
const NODE_WIDTH_MAX = 280;

/**
 * Approximate the path of a smoothstep edge as a multi-segment polyline.
 * Source handle is on the right side, target handle is on the left side.
 * Uses a wider band to account for different node sizes and handle positions.
 */
function getEdgePolyline(
  sourceNode: Node,
  targetNode: Node,
  _edge: Edge,
): Point[] {
  // Source handle: right side of node
  // Use average of min/max width for better approximation
  const srcNodeWidth = (sourceNode as any).width || ((NODE_WIDTH_MIN + NODE_WIDTH_MAX) / 2);
  const srcX = sourceNode.position.x + srcNodeWidth;

  // Estimate handle Y from port position in the node
  // Header (~36px) + first port area offset (~12px)
  const srcPortOffset = getPortYOffset(sourceNode, _edge.sourceHandle || 'out', 'source');
  const srcY = sourceNode.position.y + srcPortOffset;

  // Target handle: left side of node
  const tgtPortOffset = getPortYOffset(targetNode, _edge.targetHandle || 'source', 'target');
  const tgtX = targetNode.position.x;
  const tgtY = targetNode.position.y + tgtPortOffset;

  // Smoothstep: source → right → midX → turn → midX → left → target
  const midX = (srcX + tgtX) / 2;

  return [
    { x: srcX, y: srcY },
    { x: midX, y: srcY },
    { x: midX, y: tgtY },
    { x: tgtX, y: tgtY },
  ];
}

/**
 * Estimate the Y offset of a port handle within a node.
 * This is approximate — header height + port index offset.
 */
function getPortYOffset(
  _node: Node,
  _handleId: string,
  _type: 'source' | 'target',
): number {
  // Header is ~36px (py-2 = 8px + icon = 20px + gaps)
  // Port rows start after header, each port row is ~20px
  // For simplicity, use a fixed offset that covers most cases
  return 48;
}

/**
 * Find the nearest edge to a given flow-coordinate point.
 * Returns the edge ID and distance, or null if nothing is within threshold.
 */
export function findNearestEdge(
  point: Point,
  edges: Edge[],
  nodes: Node[],
  threshold = 60,
): { edgeId: string; distance: number } | null {
  const nodeMap = new Map<string, Node>();
  for (const n of nodes) nodeMap.set(n.id, n);

  let best: { edgeId: string; distance: number } | null = null;

  for (const edge of edges) {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;

    const polyline = getEdgePolyline(src, tgt, edge);

    // Min distance to any segment of the polyline
    let minDist = Infinity;
    for (let i = 0; i < polyline.length - 1; i++) {
      const d = distToSegment(point, polyline[i], polyline[i + 1]);
      if (d < minDist) minDist = d;
    }

    // Also check: is the point horizontally between source and target?
    // This helps avoid false positives for edges above/below the drop point
    const leftX = Math.min(polyline[0].x, polyline[polyline.length - 1].x);
    const rightX = Math.max(polyline[0].x, polyline[polyline.length - 1].x);
    const inHorizontalBand = point.x >= leftX - threshold && point.x <= rightX + threshold;

    if (minDist < threshold && inHorizontalBand && (!best || minDist < best.distance)) {
      best = { edgeId: edge.id, distance: minDist };
    }
  }

  return best;
}
