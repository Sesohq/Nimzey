/**
 * NodePreviewContainer.tsx
 * 
 * Container component for managing node preview canvases.
 * Creates and stores the hidden canvases used for preview thumbnails
 * and handles communication with the Web Worker.
 */
import { useEffect, useRef } from 'react';
import { Node } from 'reactflow';
import { FilterNodeData } from '@/types';

interface NodePreviewContainerProps {
  nodes: Node[];
}

export default function NodePreviewContainer({ nodes }: NodePreviewContainerProps) {
  // Reference to the worker
  const workerRef = useRef<Worker | null>(null);
  
  // Initialize the worker and event listeners
  useEffect(() => {
    // Create the worker if it doesn't exist
    if (!workerRef.current && window.Worker) {
      try {
        workerRef.current = new Worker('/previewWorker.js');
        
        // Set up message handler
        workerRef.current.onmessage = (e) => {
          const { nodeId, imageDataUrl, error } = e.data;
          
          if (error) {
            console.error(`Worker error for node ${nodeId}:`, error);
            return;
          }
          
          if (nodeId && imageDataUrl) {
            // Dispatch an event to update the node's preview
            const updateEvent = new CustomEvent('node-preview-updated', {
              detail: { nodeId, preview: imageDataUrl }
            });
            window.dispatchEvent(updateEvent);
          }
        };
      } catch (error) {
        console.error('Error initializing preview worker:', error);
      }
    }
    
    // Create a handler for preview requests
    const handlePreviewRequest = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.nodeId) {
        requestNodePreview(customEvent.detail.nodeId);
      }
    };
    
    // Listen for preview requests
    window.addEventListener('request-node-preview', handlePreviewRequest);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('request-node-preview', handlePreviewRequest);
      
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);
  
  // Handle parameter changes
  useEffect(() => {
    const handleParamChange = (e: CustomEvent) => {
      // This would update the preview for a node when parameters change
      if (e.detail && e.detail.nodeId) {
        requestNodePreview(e.detail.nodeId);
      }
    };
    
    // Listen for parameter changes
    window.addEventListener('parameter-changed' as any, handleParamChange);
    
    return () => {
      window.removeEventListener('parameter-changed' as any, handleParamChange);
    };
  }, []);
  
  // Function to request a preview update for a specific node
  const requestNodePreview = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !workerRef.current) return;
    
    // Get the node's input image
    const getInputImage = async () => {
      // Find the input edge for this node
      const inputNodeId = findInputNodeId(nodeId);
      if (!inputNodeId) return null;
      
      // Get the input node
      const inputNode = nodes.find(n => n.id === inputNodeId);
      if (!inputNode) return null;
      
      // If it's a source image, use it directly
      if (inputNode.data.type === 'image') {
        return inputNode.data.src || null;
      }
      
      // Otherwise, use its preview (which should have been processed already)
      return inputNode.data.preview || null;
    };
    
    // Get the input image and send to worker
    getInputImage().then(inputImageUrl => {
      if (!inputImageUrl || !workerRef.current) return;
      
      // Get filter type and settings
      const filterType = (node.data as FilterNodeData).filterType || '';
      const settings = (node.data as FilterNodeData).settings || {};
      
      // Send message to worker
      workerRef.current.postMessage({
        nodeId,
        imageDataUrl: inputImageUrl,
        filterType,
        settings
      });
    });
  };
  
  // Helper to find the input node ID for a given node
  const findInputNodeId = (nodeId: string): string | null => {
    // This is a simplified approach - in a real app, you'd use the edges array
    // For each node, find its input edges
    const inputNodes = nodes.filter(node => {
      // Check if this node outputs to our target node
      // In a real implementation, you'd check the edges array
      return false; // Placeholder
    });
    
    if (inputNodes.length === 0) return null;
    return inputNodes[0].id;
  };
  
  // This component doesn't render anything visible
  return null;
}