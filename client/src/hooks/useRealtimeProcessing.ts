/**
 * useRealtimeProcessing.ts
 * 
 * A hook that watches for node changes and triggers immediate preview processing
 * to ensure real-time updates when sliders or other controls are adjusted.
 */

import { useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';

interface RealtimeProcessingOptions {
  nodes: Node[];
  edges: Edge[];
  processImage: () => void;
  generateNodePreviews?: () => void;
  isEnabled?: boolean;
}

export function useRealtimeProcessing({
  nodes, 
  edges,
  processImage,
  generateNodePreviews,
  isEnabled = true
}: RealtimeProcessingOptions) {
  // Track when the last processing happened to throttle updates
  const lastProcessTimeRef = useRef<number>(0);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup function for timers
  const clearTimers = () => {
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
  };
  
  // The main effect that watches for node changes and triggers processing
  useEffect(() => {
    if (!isEnabled || !nodes.length) return;
    
    // Clear any existing timers
    clearTimers();
    
    // Calculate time since last processing to throttle if needed
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessTimeRef.current;
    
    if (timeSinceLastProcess < 16) {
      // Too soon after last process (less than 16ms = 60fps)
      // Schedule a delayed update to prevent excessive processing
      processingTimerRef.current = setTimeout(() => {
        processImage();
        if (generateNodePreviews) {
          generateNodePreviews();
        }
        lastProcessTimeRef.current = Date.now();
      }, 16);
    } else {
      // Enough time has passed, process immediately
      processImage();
      if (generateNodePreviews) {
        generateNodePreviews();
      }
      lastProcessTimeRef.current = now;
    }
    
    // Cleanup on unmount
    return clearTimers;
  }, [nodes, edges, processImage, generateNodePreviews, isEnabled]);
  
  return {
    clearProcessingTimers: clearTimers
  };
}