/**
 * ImprovedNodePreviewContainer.tsx
 * 
 * React state-driven approach for node preview thumbnails
 * Uses React's state management instead of DOM events for reliable updates
 */

import React, { useEffect, useRef } from 'react';
import { Node } from 'reactflow';
import { FilterNodeData } from '@/types';

interface ImprovedNodePreviewContainerProps {
  nodes: Node[];
  onUpdatePreview: (nodeId: string, previewDataUrl: string) => void;
}

// Size for the preview thumbnails
const PREVIEW_SIZE = 128;

export default function ImprovedNodePreviewContainer({ 
  nodes, 
  onUpdatePreview 
}: ImprovedNodePreviewContainerProps) {
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
          // Find the canvas in our container
          const canvas = canvasRefs.current.get(nodeId);
          if (canvas) {
            const ctx = canvas.getContext('bitmaprenderer');
            if (ctx) {
              // Draw the bitmap directly to the canvas
              ctx.transferFromImageBitmap(bitmap);
              
              // Generate a data URL and update React state via callback
              const dataUrl = canvas.toDataURL('image/png');
              onUpdatePreview(nodeId, dataUrl);
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
  }, [nodes, onUpdatePreview]);
  
  // Create canvases for each node and send them to the worker
  useEffect(() => {
    if (!containerRef.current || !workerRef.current) return;
    
    // Clear container
    containerRef.current.innerHTML = '';
    canvasRefs.current.clear();
    
    // Create canvases for filter nodes
    for (const node of nodes) {
      if (node.type !== 'filterNode') continue;
      
      const data = node.data as FilterNodeData;
      if (!data.filter?.type) continue;
      
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