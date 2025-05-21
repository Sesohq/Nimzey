/**
 * previewBus.ts
 * 
 * A lightweight event system to handle node preview updates
 * This bypasses React Flow's memoization by updating component state directly
 * and provides a DOM event-based system for maximum compatibility
 */

type PreviewHandler = (nodeId: string, url: string) => void;
const handlers = new Set<PreviewHandler>();

export function onPreview(fn: PreviewHandler) { 
  handlers.add(fn); 
  return fn; // Return handler for easier reference
}

export function offPreview(fn: PreviewHandler) { 
  handlers.delete(fn); 
}

// Emit preview updates through both our handler system and DOM events
export function emitPreview(nodeId: string, url: string) {
  // Call registered handlers
  handlers.forEach(fn => fn(nodeId, url));
  
  // Also emit as DOM event for direct component updates
  const event = new CustomEvent('node-preview-updated', {
    detail: { nodeId, preview: url }
  });
  window.dispatchEvent(event);
  
  // Log for debugging
  console.log(`Preview emitted for node: ${nodeId}`);
}

// Helper function to request a preview update for a specific node
export function requestPreview(nodeId: string) {
  // Dispatch a DOM event requesting a preview update
  const requestEvent = new CustomEvent('request-node-preview', {
    detail: { nodeId }
  });
  window.dispatchEvent(requestEvent);
  console.log(`Preview requested for node: ${nodeId}`);
}