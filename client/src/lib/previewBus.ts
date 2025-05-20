/**
 * previewBus.ts
 * 
 * A lightweight event system to handle node preview updates
 * This bypasses React Flow's memoization by updating component state directly
 */

type PreviewHandler = (nodeId: string, url: string) => void;
const handlers = new Set<PreviewHandler>();

export function onPreview(fn: PreviewHandler) { 
  handlers.add(fn); 
}

export function offPreview(fn: PreviewHandler) { 
  handlers.delete(fn); 
}

export function emitPreview(nodeId: string, url: string) {
  handlers.forEach(fn => fn(nodeId, url));
}