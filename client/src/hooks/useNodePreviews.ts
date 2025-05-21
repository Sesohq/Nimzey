/**
 * useNodePreviews.ts
 * 
 * React hook for managing node preview thumbnails using OffscreenCanvas and Web Workers.
 * Inspired by Filter Forge's thumbnail approach.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Node } from 'reactflow';
import { FilterNodeData, FilterType } from '@/types';

const PREVIEW_SIZE = 128; // Low-resolution thumbnail size

interface NodePreviewData {
  canvas: HTMLCanvasElement;
  offscreen: OffscreenCanvas | null;
  isDirty: boolean;
  isLocked: boolean;
}

interface FilterParamMap {
  [paramId: string]: number | string | boolean;
}

export function useNodePreviews() {
  // Maps node IDs to their preview canvases
  const previewMap = useRef<Map<string, NodePreviewData>>(new Map());
  
  // Reference to the worker
  const workerRef = useRef<Worker | null>(null);
  
  // Map of node IDs to their lock state
  const [lockedPreviews, setLockedPreviews] = useState<Record<string, boolean>>({});
  
  // Initialize the worker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Create the worker
      const worker = new Worker('/public/previewWorker.js');
      workerRef.current = worker;
      
      // Handle messages from the worker
      worker.onmessage = (e) => {
        const { nodeId, bitmap, error } = e.data;
        
        if (error) {
          console.error(`Preview worker error for node ${nodeId}:`, error);
          return;
        }
        
        if (bitmap && nodeId) {
          // Get the canvas from our map
          const previewData = previewMap.current.get(nodeId);
          if (previewData) {
            // Mark as no longer dirty since we got a fresh render
            previewData.isDirty = false;
            
            // Draw the ImageBitmap onto the visible canvas
            const ctx = previewData.canvas.getContext('bitmaprenderer');
            if (ctx) {
              ctx.transferFromImageBitmap(bitmap);
              
              // Also dispatch an event for compatibility with existing code
              const dataUrl = previewData.canvas.toDataURL('image/png');
              const event = new CustomEvent('node-preview-updated', {
                detail: { nodeId, preview: dataUrl }
              });
              window.dispatchEvent(event);
            }
          }
        }
      };
      
      // Clean up on unmount
      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch (err) {
      console.error('Error initializing preview worker:', err);
    }
  }, []);
  
  /**
   * Register a node for preview generation
   */
  const registerNode = useCallback((nodeId: string, filterType: FilterType): HTMLCanvasElement => {
    // Check if we already have a canvas for this node
    let previewData = previewMap.current.get(nodeId);
    
    if (!previewData) {
      // Create a new canvas for this node
      const canvas = document.createElement('canvas');
      canvas.width = PREVIEW_SIZE;
      canvas.height = PREVIEW_SIZE;
      canvas.id = `node-preview-${nodeId}`;
      
      // Create a hidden element to hold it (for debugging)
      const container = document.createElement('div');
      container.style.display = 'none';
      container.id = `preview-container-${nodeId}`;
      container.appendChild(canvas);
      document.body.appendChild(container);
      
      // Create an OffscreenCanvas if supported
      let offscreen: OffscreenCanvas | null = null;
      
      try {
        if ('transferControlToOffscreen' in canvas) {
          offscreen = canvas.transferControlToOffscreen();
        }
      } catch (err) {
        console.warn('OffscreenCanvas not supported, using fallback:', err);
      }
      
      // Store in our map
      previewData = {
        canvas,
        offscreen,
        isDirty: true,
        isLocked: lockedPreviews[nodeId] || false
      };
      
      previewMap.current.set(nodeId, previewData);
      
      // If we have an offscreen canvas and worker, send it to the worker
      if (offscreen && workerRef.current) {
        workerRef.current.postMessage({
          canvas: offscreen,
          nodeId,
          filterType
        }, [offscreen]);
      }
    }
    
    return previewData.canvas;
  }, [lockedPreviews]);
  
  /**
   * Mark a node as dirty, needing re-rendering
   */
  const markNodeDirty = useCallback((nodeId: string) => {
    const previewData = previewMap.current.get(nodeId);
    if (previewData && !previewData.isLocked) {
      previewData.isDirty = true;
    }
  }, []);
  
  /**
   * Toggle the lock state of a node's preview
   */
  const togglePreviewLock = useCallback((nodeId: string) => {
    setLockedPreviews(prev => {
      const newLockedState = !prev[nodeId];
      
      // Also update in our preview map
      const previewData = previewMap.current.get(nodeId);
      if (previewData) {
        previewData.isLocked = newLockedState;
      }
      
      return {
        ...prev,
        [nodeId]: newLockedState
      };
    });
  }, []);
  
  /**
   * Update a node preview with new parameters
   */
  const updateNodePreview = useCallback((
    nodeId: string, 
    filterType: FilterType,
    params: FilterParamMap,
    sourceImageData?: ImageData
  ) => {
    // Don't update if the node is locked
    const previewData = previewMap.current.get(nodeId);
    if (!previewData || previewData.isLocked) return;
    
    // Mark as dirty
    previewData.isDirty = true;
    
    // If we have a worker, send the update request
    if (workerRef.current) {
      const transferList = [];
      const message: any = {
        nodeId,
        filterType,
        params
      };
      
      // If we have source image data, include it
      if (sourceImageData) {
        message.sourceImageData = {
          data: sourceImageData.data.buffer,
          width: sourceImageData.width,
          height: sourceImageData.height
        };
        transferList.push(sourceImageData.data.buffer);
      }
      
      workerRef.current.postMessage(message, transferList);
    }
  }, []);
  
  /**
   * Update all dirty nodes in the graph
   */
  const updateDirtyNodes = useCallback((nodes: Node[]) => {
    for (const node of nodes) {
      const nodeId = node.id;
      const previewData = previewMap.current.get(nodeId);
      
      // Skip if not in our map, not dirty, or locked
      if (!previewData || !previewData.isDirty || previewData.isLocked) continue;
      
      // Only process filter nodes
      if (node.type !== 'filterNode') continue;
      
      const nodeData = node.data as FilterNodeData;
      
      // Build parameter map for the worker
      const params: FilterParamMap = {};
      if (nodeData.params) {
        for (const param of nodeData.params) {
          params[param.id] = param.value;
        }
      }
      
      // Send update to worker
      if (workerRef.current) {
        workerRef.current.postMessage({
          nodeId,
          filterType: nodeData.filter?.type,
          params
        });
      }
      
      // Mark as no longer dirty (will be set again if needed)
      previewData.isDirty = false;
    }
  }, []);
  
  /**
   * Get the lock state of a node
   */
  const isPreviewLocked = useCallback((nodeId: string) => {
    return lockedPreviews[nodeId] || false;
  }, [lockedPreviews]);
  
  return {
    registerNode,
    markNodeDirty,
    updateNodePreview,
    updateDirtyNodes,
    togglePreviewLock,
    isPreviewLocked
  };
}