/**
 * NodePreviewContainer.tsx
 * 
 * Container component for managing node preview canvases.
 * Creates and stores the hidden canvases used for preview thumbnails
 * and handles communication with the Web Worker.
 */

import React, { useEffect, useRef } from 'react';
import { Node } from 'reactflow';
import { FilterNodeData } from '@/types';

interface NodePreviewContainerProps {
  nodes: Node[];
}

// Size for the preview thumbnails (matches what we use in the worker)
const PREVIEW_SIZE = 128;

export default function NodePreviewContainer({ nodes }: NodePreviewContainerProps) {
  const workerRef = useRef<Worker | null>(null);
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize the Web Worker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Create the Worker
      const worker = new Worker('/previewWorker.js');
      workerRef.current = worker;
      
      // Handle messages from the Worker
      worker.onmessage = (e) => {
        const { nodeId, bitmap, error } = e.data;
        
        if (error) {
          console.error(`Error in preview worker:`, error);
          return;
        }
        
        if (bitmap && nodeId) {
          // Find the canvas in our visible DOM
          const canvasInNode = document.getElementById(`node-thumb-${nodeId}`) as HTMLCanvasElement;
          if (canvasInNode) {
            const ctx = canvasInNode.getContext('bitmaprenderer');
            if (ctx) {
              // Draw the bitmap directly to the canvas
              ctx.transferFromImageBitmap(bitmap);
              
              // Also trigger an event for compatibility with the existing system
              const event = new CustomEvent('node-preview-updated', {
                detail: {
                  nodeId,
                  preview: canvasInNode.toDataURL('image/png')
                }
              });
              window.dispatchEvent(event);
            }
          }
        }
      };
      
      // Expose function to request a node preview update
      window.updateNodePreview = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.type !== 'filterNode') return;
        
        const data = node.data as FilterNodeData;
        if (!data.filter?.type) return;
        
        // Build params object from filter params
        const params: Record<string, any> = {};
        if (data.params) {
          for (const param of data.params) {
            params[param.id] = param.value;
          }
        }
        
        // Send request to worker
        if (workerRef.current) {
          workerRef.current.postMessage({
            nodeId,
            filterType: data.filter.type,
            params
          });
        }
      };
      
      // Clean up
      return () => {
        worker.terminate();
        workerRef.current = null;
        delete window.updateNodePreview;
      };
    } catch (err) {
      console.error('Error initializing preview worker:', err);
    }
  }, [nodes]);
  
  // Create canvases for each node and send them to the worker
  useEffect(() => {
    if (!containerRef.current || !workerRef.current) return;
    
    // Clear container
    containerRef.current.innerHTML = '';
    
    // Create canvases for filter nodes
    for (const node of nodes) {
      if (node.type !== 'filterNode') continue;
      
      const data = node.data as FilterNodeData;
      if (!data.filter?.type) continue;
      
      // Skip if we already have a canvas for this node
      if (canvasRefs.current.has(node.id)) continue;
      
      try {
        // Create the canvas
        const canvas = document.createElement('canvas');
        canvas.width = PREVIEW_SIZE;
        canvas.height = PREVIEW_SIZE;
        canvas.id = `preview-canvas-${node.id}`;
        containerRef.current.appendChild(canvas);
        
        // Store reference
        canvasRefs.current.set(node.id, canvas);
        
        // Get the offscreen canvas and send to worker
        const offscreen = canvas.transferControlToOffscreen();
        workerRef.current.postMessage({
          canvas: offscreen,
          nodeId: node.id,
          filterType: data.filter.type
        }, [offscreen]);
        
        // Trigger initial update
        window.updateNodePreview?.(node.id);
      } catch (err) {
        console.error(`Error creating preview canvas for node ${node.id}:`, err);
      }
    }
    
    return () => {
      // Clean up canvases on unmount
      canvasRefs.current.clear();
    };
  }, [nodes]);
  
  // Listen for parameter changes to update previews
  useEffect(() => {
    const handleParamChange = (e: CustomEvent) => {
      if (e.detail && e.detail.nodeId) {
        window.updateNodePreview?.(e.detail.nodeId);
      }
    };
    
    window.addEventListener('node-param-changed', handleParamChange as EventListener);
    
    return () => {
      window.removeEventListener('node-param-changed', handleParamChange as EventListener);
    };
  }, []);
  
  return (
    <div 
      id="preview-canvases-container" 
      ref={containerRef}
      className="hidden" 
      aria-hidden="true"
    />
  );
}