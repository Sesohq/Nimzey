/**
 * NodePreviewContainer.tsx
 * 
 * Container component for managing node preview canvases.
 * Uses the recursive image processing system combined with caching for better performance.
 */

import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import { useNodePreviewManager } from '@/hooks/useNodePreviewManager';

interface NodePreviewContainerProps {
  nodes: Node[];
  edges: any[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export default function NodePreviewContainer({ nodes, edges, setNodes }: NodePreviewContainerProps) {
  const { getProcessedImage, clearDownstreamCache } = useNodePreviewManager(nodes, edges);

  // Generate previews for all nodes whenever the graph changes
  useEffect(() => {
    const updateAllNodePreviews = async () => {
      for (const node of nodes) {
        if (node.type === 'filterNode') {
          await getProcessedImage(node.id, setNodes);
        }
      }
    };

    updateAllNodePreviews();
  }, [nodes, edges, getProcessedImage, setNodes]);

  // Listen for parameter changes to update previews
  useEffect(() => {
    const handleParamChange = (e: CustomEvent) => {
      if (e.detail && e.detail.nodeId) {
        // Clear cache for this node and downstream nodes
        clearDownstreamCache(e.detail.nodeId);
        
        // Regenerate preview
        getProcessedImage(e.detail.nodeId, setNodes);
      }
    };
    
    window.addEventListener('node-param-changed', handleParamChange as EventListener);
    
    return () => {
      window.removeEventListener('node-param-changed', handleParamChange as EventListener);
    };
  }, [getProcessedImage, clearDownstreamCache, setNodes]);

  // This component doesn't render anything visible
  return null;
}