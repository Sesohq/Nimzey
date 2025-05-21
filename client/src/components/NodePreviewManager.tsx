/**
 * NodePreviewManager.tsx
 * 
 * Manager component for node previews using OffscreenCanvas and Web Workers.
 * Similar to Filter Forge's approach of efficient per-node preview thumbnails.
 */

import React, { useEffect, useRef } from 'react';
import { Node } from 'reactflow';
import { useNodePreviews } from '@/hooks/useNodePreviews';
import { FilterNodeData, FilterType } from '@/types';

interface NodePreviewManagerProps {
  nodes: Node[];
}

export default function NodePreviewManager({ nodes }: NodePreviewManagerProps) {
  const { 
    registerNode, 
    markNodeDirty, 
    updateNodePreview, 
    updateDirtyNodes,
    togglePreviewLock, 
    isPreviewLocked 
  } = useNodePreviews();
  
  // Store references to the last processed nodes to avoid unnecessary updates
  const nodesRef = useRef<Node[]>([]);
  
  // Make helper functions available globally for easier debugging and integration
  useEffect(() => {
    // Global helper to toggle preview lock state
    (window as any).toggleNodePreviewLock = (nodeId: string) => {
      togglePreviewLock(nodeId);
      
      // Also dispatch an event to update the UI
      const event = new CustomEvent('node-preview-lock-changed', {
        detail: { nodeId, locked: isPreviewLocked(nodeId) }
      });
      window.dispatchEvent(event);
    };
    
    // Global helper to force a node preview update
    (window as any).updateNodePreview = (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.type === 'filterNode') {
        const data = node.data as FilterNodeData;
        if (data.filter?.type) {
          markNodeDirty(nodeId);
          
          // Build parameter map
          const params: Record<string, any> = {};
          for (const param of data.params || []) {
            params[param.id] = param.value;
          }
          
          updateNodePreview(nodeId, data.filter.type, params);
        }
      }
    };
    
    return () => {
      // Clean up globals
      delete (window as any).toggleNodePreviewLock;
      delete (window as any).updateNodePreview;
    };
  }, [nodes, markNodeDirty, updateNodePreview, togglePreviewLock, isPreviewLocked]);
  
  // Initialize and register nodes
  useEffect(() => {
    // Register all filter nodes for preview generation
    for (const node of nodes) {
      if (node.type === 'filterNode') {
        const data = node.data as FilterNodeData;
        if (data.filter?.type) {
          registerNode(node.id, data.filter.type);
        }
      }
    }
    
    // Set nodes reference
    nodesRef.current = nodes;
    
    // Schedule an update of dirty nodes (throttled in the hook)
    updateDirtyNodes(nodes);
    
    // Listen for parameter change events to mark nodes as dirty
    const handleParamChange = (e: any) => {
      if (e.detail && e.detail.nodeId) {
        markNodeDirty(e.detail.nodeId);
      }
    };
    
    window.addEventListener('node-param-changed', handleParamChange);
    
    return () => {
      window.removeEventListener('node-param-changed', handleParamChange);
    };
  }, [nodes, registerNode, markNodeDirty, updateDirtyNodes]);
  
  // Update when nodes change (debounced/throttled in the hook)
  useEffect(() => {
    // Skip if nodes haven't changed
    if (nodesRef.current === nodes) return;
    
    // Update nodes reference
    nodesRef.current = nodes;
    
    // Update dirty nodes
    updateDirtyNodes(nodes);
  }, [nodes, updateDirtyNodes]);
  
  // This is a manager component, so it doesn't render anything visible
  return null;
}