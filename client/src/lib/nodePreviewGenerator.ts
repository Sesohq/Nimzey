import { Node, Edge } from 'reactflow';
import { FilterNodeData, ImageNodeData } from '../types';
import { applyFilters } from './filterAlgorithms';
import { nodeResultCache, getNodeProcessingOrder, isNodeInChain } from './nodePreviewHelper';

// Function to generate a node preview
export function generateNodePreview(
  sourceImage: HTMLImageElement,
  nodes: Node[],
  edges: Edge[],
  targetNodeId: string
): string | null {
  // Create a small canvas for the preview
  const previewCanvas = document.createElement('canvas');
  
  // Use a smaller size for preview to improve performance
  previewCanvas.width = 150;
  previewCanvas.height = 150;
  
  // Generate the preview by using the existing applyFilters function
  // but targeting only the specific node and its dependencies
  return applyFilters(
    sourceImage,
    nodes,
    edges,
    previewCanvas,
    targetNodeId,  // Target the specific node
    false          // Don't clear the cache
  );
}

// Function to update previews for all nodes
export function updateAllNodePreviews(
  sourceImage: HTMLImageElement,
  nodes: Node[],
  edges: Edge[],
  updateNodeCallback: (nodeId: string, previewUrl: string) => void
): void {
  // Skip if no source image
  if (!sourceImage) return;
  
  // Update previews for all filter/blend/texture nodes
  nodes.forEach(node => {
    if (node.type !== 'imageNode') {
      const preview = generateNodePreview(sourceImage, nodes, edges, node.id);
      if (preview) {
        updateNodeCallback(node.id, preview);
      }
    }
  });
}

// Function to update a specific node's preview
export function updateNodePreview(
  sourceImage: HTMLImageElement,
  nodes: Node[],
  edges: Edge[],
  nodeId: string,
  updateNodeCallback: (nodeId: string, previewUrl: string) => void
): void {
  // Skip if no source image
  if (!sourceImage) return;
  
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;
  
  // Generate preview for this specific node
  const preview = generateNodePreview(sourceImage, nodes, edges, nodeId);
  if (preview) {
    updateNodeCallback(nodeId, preview);
  }
}

// Function to update previews affected by a parameter change
export function updatePreviewsAfterParamChange(
  sourceImage: HTMLImageElement,
  nodes: Node[],
  edges: Edge[],
  changedNodeId: string,
  updateNodeCallback: (nodeId: string, previewUrl: string) => void
): void {
  // First update the changed node's preview
  updateNodePreview(sourceImage, nodes, edges, changedNodeId, updateNodeCallback);
  
  // Then find and update any nodes that depend on this node
  const affectedNodes = findDependentNodes(changedNodeId, nodes, edges);
  
  // Update previews for all affected nodes
  affectedNodes.forEach(nodeId => {
    updateNodePreview(sourceImage, nodes, edges, nodeId, updateNodeCallback);
  });
}

// Helper function to find nodes that depend on a given node
function findDependentNodes(nodeId: string, nodes: Node[], edges: Edge[]): string[] {
  const dependents: string[] = [];
  
  // Function to recursively find all dependent nodes
  function findDependents(currentId: string) {
    // Find all edges where this node is the source
    const outgoingEdges = edges.filter(edge => edge.source === currentId);
    
    // For each target of these edges, recursively find their dependents
    outgoingEdges.forEach(edge => {
      if (!dependents.includes(edge.target)) {
        dependents.push(edge.target);
        findDependents(edge.target);
      }
    });
  }
  
  // Start the search
  findDependents(nodeId);
  
  return dependents;
}