import { Node, Edge } from 'reactflow';

// Cache of node results to avoid recomputing the same filter chain
export const nodeResultCache = new Map<string, HTMLCanvasElement>();

// Helper function to check if a node is in the chain for a target node
export function isNodeInChain(nodeId: string, targetNodeId: string, nodes: Node[], edges: Edge[]): boolean {
  if (nodeId === targetNodeId) return true;
  
  // Build a dependency graph (what nodes depend on this node)
  const dependents: Record<string, string[]> = {};
  nodes.forEach(node => {
    dependents[node.id] = [];
  });
  
  edges.forEach(edge => {
    if (dependents[edge.source]) {
      dependents[edge.source].push(edge.target);
    }
  });
  
  // Use BFS to find if targetNodeId can be reached from nodeId
  const visited = new Set<string>();
  const queue = [nodeId];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current === targetNodeId) return true;
    if (visited.has(current)) continue;
    
    visited.add(current);
    
    dependents[current]?.forEach(dependent => {
      if (!visited.has(dependent)) {
        queue.push(dependent);
      }
    });
  }
  
  return false;
}

// Helper function to determine if a node is a leaf node (has no outgoing edges)
export function isLeafNode(nodeId: string, edges: Edge[]): boolean {
  return !edges.some(edge => edge.source === nodeId);
}

// Function to determine processing order for nodes
export function getNodeProcessingOrder(nodes: Node[], edges: Edge[], targetNodeId?: string): string[] {
  if (targetNodeId) {
    // If a target node is specified, process only the nodes in the path to it
    // Use topological sort to ensure proper processing order
    const sorted = topologicalSort(nodes, edges);
    
    // Filter out only the nodes that are in the path to the target
    return sorted.filter(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      return node && (node.type === 'imageNode' || isNodeInChain(nodeId, targetNodeId, nodes, edges));
    });
  } else {
    // If no target node, process all nodes in topological order
    return topologicalSort(nodes, edges);
  }
}

// Topological sort implementation
export function topologicalSort(nodes: Node[], edges: Edge[]): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();
  
  // Build adjacency list
  const graph: Record<string, string[]> = {};
  nodes.forEach(node => {
    graph[node.id] = [];
  });
  
  edges.forEach(edge => {
    if (graph[edge.source]) {
      graph[edge.source].push(edge.target);
    }
  });
  
  // Visit function for DFS
  function visit(nodeId: string) {
    if (temp.has(nodeId)) {
      // Cycle detected, skip this node
      return;
    }
    
    if (visited.has(nodeId)) {
      return;
    }
    
    temp.add(nodeId);
    
    graph[nodeId]?.forEach(neighbor => {
      visit(neighbor);
    });
    
    temp.delete(nodeId);
    visited.add(nodeId);
    sorted.unshift(nodeId);
  }
  
  // Start with the source node
  const sourceNode = nodes.find(node => node.type === 'imageNode');
  if (sourceNode) {
    visit(sourceNode.id);
  }
  
  // Process any remaining nodes that weren't visited
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      visit(node.id);
    }
  });
  
  return sorted;
}

// Helper function to generate a node preview
export function generateNodePreview(
  sourceImage: HTMLImageElement,
  nodes: Node[],
  edges: Edge[],
  canvas: HTMLCanvasElement,
  targetNodeId: string,
  clearCache: boolean = false
): string | null {
  // TODO: Implement this function based on applyFilters
  return null;
}