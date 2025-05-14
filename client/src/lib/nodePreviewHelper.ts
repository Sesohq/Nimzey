import { Node, Edge } from 'reactflow';
import { FilterNodeData, ImageNodeData } from '@/types';

// Cache for storing intermediate node results
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
    const currentId = queue.shift()!;
    visited.add(currentId);
    
    // If we found the target node, return true
    if (currentId === targetNodeId) {
      return true;
    }
    
    // Add all unvisited dependents to the queue
    for (const dependent of dependents[currentId] || []) {
      if (!visited.has(dependent)) {
        queue.push(dependent);
      }
    }
  }
  
  return false;
}

// Check if a node is a leaf node (no outgoing edges)
export function isLeafNode(nodeId: string, edges: Edge[]): boolean {
  return !edges.some(edge => edge.source === nodeId);
}

// Get the processing order for nodes
export function getNodeProcessingOrder(nodes: Node[], edges: Edge[], targetNodeId?: string): string[] {
  // If we have a target node, start from that node and work backwards
  if (targetNodeId) {
    // Get all nodes in the chain leading to the target
    const chain = new Set<string>();
    const visited = new Set<string>();
    const stack = [targetNodeId];
    
    while (stack.length > 0) {
      const nodeId = stack.pop()!;
      chain.add(nodeId);
      visited.add(nodeId);
      
      // Find all edges pointing to this node
      const incomingEdges = edges.filter(edge => edge.target === nodeId);
      for (const edge of incomingEdges) {
        if (!visited.has(edge.source)) {
          stack.push(edge.source);
        }
      }
    }
    
    // Now do a topological sort on just these nodes
    return topologicalSort(nodes.filter(node => chain.has(node.id)), edges);
  }
  
  // Otherwise, do a normal topological sort
  return topologicalSort(nodes, edges);
}

// Topological sort for nodes
export function topologicalSort(nodes: Node[], edges: Edge[]): string[] {
  // Build dependency graph
  const graph: Record<string, string[]> = {};
  nodes.forEach(node => {
    graph[node.id] = [];
  });
  
  edges.forEach(edge => {
    if (graph[edge.target]) {
      graph[edge.target].push(edge.source);
    }
  });
  
  // Topological sort
  const visited: Record<string, boolean> = {};
  const temp: Record<string, boolean> = {};
  const order: string[] = [];
  
  function visit(nodeId: string) {
    if (visited[nodeId]) return;
    if (temp[nodeId]) return; // Cycle detected
    
    temp[nodeId] = true;
    
    for (const depId of graph[nodeId] || []) {
      visit(depId);
    }
    
    temp[nodeId] = false;
    visited[nodeId] = true;
    order.push(nodeId);
  }
  
  // Visit all nodes
  for (const node of nodes) {
    if (!visited[node.id]) {
      visit(node.id);
    }
  }
  
  return order.reverse();
}

// Function to generate a preview for a specific node
export function generateNodePreview(
  sourceImage: HTMLImageElement | null,
  nodes: Node[],
  edges: Edge[],
  targetNodeId: string,
  clearCache: boolean = false
): string | null {
  if (!sourceImage) return null;

  // Create a small canvas for the preview
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 150; // Small size for preview
  previewCanvas.height = 150;
  
  const ctx = previewCanvas.getContext('2d');
  if (!ctx) return null;
  
  // Handle cache control
  if (clearCache) {
    nodeResultCache.clear();
  }
  
  // Find the source node
  const sourceNode = nodes.find(node => node.type === 'imageNode');
  if (!sourceNode) return null;
  
  // Create a source canvas with the image
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = previewCanvas.width;
  sourceCanvas.height = previewCanvas.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  
  if (!sourceCtx) return null;
  
  // Draw the source image to the source canvas
  sourceCtx.drawImage(sourceImage, 0, 0, sourceCanvas.width, sourceCanvas.height);
  
  // Cache the source image
  nodeResultCache.set(sourceNode.id, sourceCanvas);
  
  // Get the processing order for the target node
  const processOrder = getNodeProcessingOrder(nodes, edges, targetNodeId);
  
  // Process each node in order
  for (const nodeId of processOrder) {
    // Skip if not needed for this preview
    if (!isNodeInChain(nodeId, targetNodeId, nodes, edges)) {
      continue;
    }
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.type === 'imageNode' || (node.data.enabled === false)) {
      continue;
    }
    
    try {
      // For different node types, process them accordingly
      // This is a simplified version - in a real implementation,
      // you'd handle each type appropriately
      
      // For texture generators, create directly
      if (node.type === 'textureGenerator') {
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = previewCanvas.width;
        resultCanvas.height = previewCanvas.height;
        const resultCtx = resultCanvas.getContext('2d');
        
        if (resultCtx) {
          // Fill with a default color or pattern
          // In practice, you'd generate the texture here
          resultCtx.fillStyle = '#ffffff';
          resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
          
          // Store in cache
          nodeResultCache.set(nodeId, resultCanvas);
        }
        continue;
      }
      
      // Find input nodes
      const incomingEdges = edges.filter(edge => edge.target === nodeId);
      
      // If no inputs, skip
      if (incomingEdges.length === 0) continue;
      
      // Get input canvas (simplified, in reality you'd handle multiple inputs)
      let inputCanvas = null;
      for (const edge of incomingEdges) {
        if (nodeResultCache.has(edge.source)) {
          inputCanvas = nodeResultCache.get(edge.source);
          break;
        }
      }
      
      if (!inputCanvas) continue;
      
      // Create result canvas
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = previewCanvas.width;
      resultCanvas.height = previewCanvas.height;
      const resultCtx = resultCanvas.getContext('2d');
      
      if (!resultCtx) continue;
      
      // Copy input to result
      resultCtx.drawImage(inputCanvas, 0, 0);
      
      // Apply the filter (simplified)
      // In practice, you'd properly apply the filter based on node type and parameters
      
      // Store result in cache
      nodeResultCache.set(nodeId, resultCanvas);
      
      // If this is our target node, we're done
      if (nodeId === targetNodeId) {
        ctx.drawImage(resultCanvas, 0, 0);
      }
    } catch (error) {
      console.error(`Error processing node ${nodeId} for preview:`, error);
    }
  }
  
  // Return the preview as a data URL
  return previewCanvas.toDataURL();
}