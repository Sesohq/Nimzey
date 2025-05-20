/**
 * useFilterPreviewUpdater.ts
 * 
 * A custom hook that specifically handles real-time updates for filter previews.
 * This ensures that when parameters change via sliders, the preview updates immediately.
 */

import { useCallback, useRef, useEffect } from 'react';
import { Node } from 'reactflow';
import { FilterNodeData, ImageNodeData } from '@/types';

type QualityLevel = 'low' | 'preview' | 'draft' | 'full';

interface PreviewUpdaterOptions {
  selectedNodeId: string | null;
  nodes: Node[];
  processGraph: (quality: QualityLevel) => void;
  setNodePreview: (preview: string | null) => void;
}

export function useFilterPreviewUpdater({
  selectedNodeId,
  nodes,
  processGraph,
  setNodePreview
}: PreviewUpdaterOptions) {
  // Refs to track parameter changes
  const lastParamChangeTime = useRef<number>(0);
  const scheduledUpdateRef = useRef<number | null>(null);
  const isUpdatingRef = useRef<boolean>(false);
  
  // Clear any scheduled updates
  const clearScheduledUpdates = useCallback(() => {
    if (scheduledUpdateRef.current !== null) {
      window.clearTimeout(scheduledUpdateRef.current);
      scheduledUpdateRef.current = null;
    }
  }, []);
  
  // Process parameter changes immediately and schedule high-quality updates
  const handleParameterChange = useCallback(() => {
    // Track time of change for debouncing
    lastParamChangeTime.current = Date.now();
    
    // Clear any pending update timers
    clearScheduledUpdates();
    
    // Don't schedule multiple concurrent updates
    if (isUpdatingRef.current) return;
    
    // Mark as updating
    isUpdatingRef.current = true;
    
    // Immediately process at low quality for super-responsive UI during sliding
    processGraph('low');
    
    // Schedule a higher quality update after user stops changing parameters
    scheduledUpdateRef.current = window.setTimeout(() => {
      // Only proceed if no recent parameter changes
      const timeSinceLastChange = Date.now() - lastParamChangeTime.current;
      if (timeSinceLastChange < 150) {
        // Still changing parameters, reschedule
        isUpdatingRef.current = false;
        handleParameterChange();
        return;
      }
      
      // First update with preview quality
      processGraph('preview');
      
      // Then schedule full quality update after a longer pause
      scheduledUpdateRef.current = window.setTimeout(() => {
        processGraph('full');
        isUpdatingRef.current = false;
      }, 300);
    }, 200);
  }, [processGraph, clearScheduledUpdates]);
  
  // Watch for changes in the nodes array that might indicate parameter changes
  useEffect(() => {
    // Find the selected node if any
    const selectedNode = selectedNodeId 
      ? nodes.find(n => n.id === selectedNodeId)
      : null;
    
    // Check if this is a filter node with a preview
    if (selectedNode) {
      const nodeData = selectedNode.data as FilterNodeData | ImageNodeData;
      if (nodeData.preview) {
        setNodePreview(nodeData.preview);
      } else {
        // No preview yet, trigger processing
        handleParameterChange();
      }
    }
    
    // Any time nodes change, it might be due to parameter updates
    // This ensures real-time preview updates
    if (nodes.length > 0) {
      handleParameterChange();
    }
    
    // Cleanup on unmount
    return () => {
      clearScheduledUpdates();
    };
  }, [nodes, selectedNodeId, handleParameterChange, clearScheduledUpdates, setNodePreview]);
  
  return {
    handleParameterChange
  };
}