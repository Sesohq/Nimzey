/**
 * PreviewManager.tsx
 * 
 * A component that manages preview generation for nodes outside the React Flow render cycle.
 * This helps avoid performance issues with React Flow's internal diffing and event handling.
 */
import { useEffect, useRef, useState } from 'react';
import { Node, NodeChange, useUpdateNodeInternals, useReactFlow } from 'reactflow';
import { usePreviewStore } from '../store/previewStore';
import { FilterNodeData, FilterType, ImageNodeData } from '../types/filters';

interface PreviewManagerProps {
  previewSize?: number;
}

export default function PreviewManager({ previewSize = 128 }: PreviewManagerProps) {
  const { setNodes, getNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const workerRef = useRef<Worker | null>(null);
  const canvasRef = useRef<Map<string, OffscreenCanvas>>(new Map());
  
  // Get preview store values and actions
  const { 
    previews, 
    updatePreview, 
    setProcessing,
    qualityLevel
  } = usePreviewStore();
  
  // Initialize the worker on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!workerRef.current && window.Worker) {
      try {
        // Create a new worker
        workerRef.current = new Worker(
          new URL('../workers/previewWorker.ts', import.meta.url),
          { type: 'module' }
        );
        
        // Set up the message handler
        workerRef.current.onmessage = async (event) => {
          const { nodeId, bitmap, error } = event.data;
          
          if (error) {
            console.error(`Preview worker error for node ${nodeId}:`, error);
            setProcessing(nodeId, false);
            return;
          }
          
          if (bitmap) {
            try {
              // Create a temporary canvas to convert the bitmap to a data URL
              const tempCanvas = new OffscreenCanvas(previewSize, previewSize);
              const ctx = tempCanvas.getContext('bitmaprenderer');
              
              if (!ctx) {
                throw new Error('Could not get 2d context for temporary canvas');
              }
              
              // Transfer the bitmap to the temporary canvas
              ctx.transferFromImageBitmap(bitmap);
              
              // Convert the canvas to a blob and then to a data URL
              const blob = await tempCanvas.convertToBlob({ type: 'image/png' });
              const url = URL.createObjectURL(blob);
              
              // Update the preview in the store
              updatePreview(nodeId, url);
              
              // Force React Flow to update the node internals
              updateNodeInternals([nodeId]);
            } catch (err) {
              console.error('Error processing bitmap:', err);
              setProcessing(nodeId, false);
            }
          }
        };
        
        console.log('Preview worker initialized');
      } catch (error) {
        console.error('Failed to initialize preview worker:', error);
      }
    }
    
    // Clean up the worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      
      // Also clean up any offscreen canvases
      canvasRef.current.forEach((canvas, nodeId) => {
        URL.revokeObjectURL(previews[nodeId]);
      });
      canvasRef.current.clear();
    };
  }, [previewSize, updatePreview, setProcessing, previews, updateNodeInternals]);
  
  // Effect to update nodes with preview data whenever previews change
  useEffect(() => {
    // Skip if no previews or nodes yet
    if (Object.keys(previews).length === 0) return;
    
    // Update the nodes with the new preview URLs
    setNodes((nodes) => 
      nodes.map((node) => {
        const previewUrl = previews[node.id];
        
        // Only update if we have a preview and it's different from the current one
        if (previewUrl && node.data.preview !== previewUrl) {
          return {
            ...node,
            data: {
              ...node.data,
              preview: previewUrl
            }
          };
        }
        
        return node;
      })
    );
  }, [previews, setNodes]);
  
  // Function to schedule a preview generation for a specific node
  const schedulePreview = async (node: Node<FilterNodeData | ImageNodeData>, sourceImageUrl: string | null) => {
    if (!workerRef.current) return;
    
    try {
      // Mark this node as processing
      setProcessing(node.id, true);
      
      // Skip if we don't have a source image yet
      if (!sourceImageUrl) {
        setProcessing(node.id, false);
        return;
      }
      
      // Load the source image
      const image = new Image();
      image.src = sourceImageUrl;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      
      // Create or reuse an offscreen canvas for this node
      let offscreen: OffscreenCanvas;
      if (canvasRef.current.has(node.id)) {
        offscreen = canvasRef.current.get(node.id)!;
      } else {
        offscreen = new OffscreenCanvas(previewSize, previewSize);
        canvasRef.current.set(node.id, offscreen);
      }
      
      // Draw the source image to a temporary canvas and get ImageBitmap
      const tempCanvas = new OffscreenCanvas(previewSize, previewSize);
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(image, 0, 0, previewSize, previewSize);
      const sourceImageData = await tempCanvas.transferToImageBitmap();
      
      // Send the data to the worker
      const filterType = (node.data as FilterNodeData).type || 'brightness';
      const params = (node.data as FilterNodeData).params || [];
      
      workerRef.current.postMessage(
        {
          offscreen,
          nodeId: node.id,
          filterType,
          params,
          sourceImageData
        },
        [offscreen as any, sourceImageData as any]
      );
    } catch (error) {
      console.error(`Error scheduling preview for node ${node.id}:`, error);
      setProcessing(node.id, false);
    }
  };
  
  // Effect to monitor node changes and schedule preview updates
  useEffect(() => {
    // Create a function to check for nodes that need preview updates
    const checkForPreviewUpdates = () => {
      const nodes = getNodes();
      
      // Find image nodes (source nodes)
      const imageNodes = nodes.filter(
        (node) => node.type === 'imageNode' && (node.data as ImageNodeData).src
      );
      
      if (imageNodes.length === 0) return;
      
      // For each image node, find connected filter nodes and schedule previews
      imageNodes.forEach((imageNode) => {
        const sourceImage = (imageNode.data as ImageNodeData).src;
        
        // First schedule the image node itself
        if (!previews[imageNode.id]) {
          updatePreview(imageNode.id, sourceImage || '');
        }
        
        // Then find connected nodes
        const connectedNodes = findConnectedNodes(imageNode.id, nodes);
        
        // Schedule previews for each connected node
        connectedNodes.forEach((node) => {
          schedulePreview(node, sourceImage);
        });
      });
    };
    
    // Run the check once on mount
    checkForPreviewUpdates();
    
    // Set up an interval to check periodically based on quality level
    const intervalMs = qualityLevel === 'preview' ? 500 : qualityLevel === 'draft' ? 200 : 100;
    const intervalId = setInterval(checkForPreviewUpdates, intervalMs);
    
    return () => clearInterval(intervalId);
  }, [getNodes, previews, updatePreview, qualityLevel]);
  
  // Helper function to find connected nodes
  const findConnectedNodes = (sourceId: string, nodes: Node[]): Node[] => {
    // This would normally use edge information, but for simplicity
    // we're just returning all non-image nodes for now
    return nodes.filter((node) => 
      node.type !== 'imageNode' && 
      node.id !== sourceId
    );
  };
  
  // This component doesn't render anything visible
  return null;
}