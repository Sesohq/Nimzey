import { useRef, useEffect, useCallback, useState } from 'react';
import { FilterType } from '@/types';

// Define types for worker messages
type WorkerMessageType = 
  | { type: 'filterApplied', imageData: ImageData, targetNodeId?: string }
  | { type: 'filtersApplied', imageData: ImageData, targetNodeId?: string }
  | { type: 'error', error: string, targetNodeId?: string };

interface UseFilterWorkerReturn {
  applyFilter: (
    imageData: ImageData, 
    filterType: FilterType, 
    params: any[], 
    targetNodeId?: string
  ) => Promise<ImageData>;
  applyFilters: (
    imageData: ImageData, 
    filters: { type: FilterType, params: any[] }[], 
    targetNodeId?: string
  ) => Promise<ImageData>;
  isProcessing: boolean;
}

/**
 * Hook to use a Web Worker for filter processing
 */
export function useFilterWorker(): UseFilterWorkerReturn {
  // Create a worker reference
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Callback reference to resolve promises from worker responses
  const callbacksRef = useRef<Map<string, (data: ImageData | Error) => void>>(new Map());
  
  // Initialize worker
  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(
      new URL('../workers/filterWorker.ts', import.meta.url), 
      { type: 'module' }
    );
    
    // Set up message handler
    workerRef.current.onmessage = (event: MessageEvent<WorkerMessageType>) => {
      const { type, targetNodeId } = event.data;
      
      // Generate a callback key - use targetNodeId if available or a default
      const callbackKey = targetNodeId || 'default';
      
      // Get the callback from the map
      const callback = callbacksRef.current.get(callbackKey);
      
      if (callback) {
        if (type === 'filterApplied' || type === 'filtersApplied') {
          // Success - resolve with processed image data
          callback(event.data.imageData);
        } else if (type === 'error') {
          // Error - reject with error message
          callback(new Error(event.data.error));
        }
        
        // Remove the callback from the map
        callbacksRef.current.delete(callbackKey);
      }
      
      // Check if we're done processing
      if (callbacksRef.current.size === 0) {
        setIsProcessing(false);
      }
    };
    
    // Clean up
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);
  
  // Function to apply a single filter
  const applyFilter = useCallback((
    imageData: ImageData, 
    filterType: FilterType, 
    params: any[],
    targetNodeId?: string
  ): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }
      
      // Indicate processing has started
      setIsProcessing(true);
      
      // Store the callback in the map
      const callbackKey = targetNodeId || 'default';
      callbacksRef.current.set(callbackKey, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
      
      // Send message to worker
      workerRef.current.postMessage({
        type: 'applyFilter',
        imageData,
        filter: {
          type: filterType,
          params
        },
        targetNodeId
      });
    });
  }, []);
  
  // Function to apply multiple filters in sequence
  const applyFilters = useCallback((
    imageData: ImageData, 
    filters: { type: FilterType, params: any[] }[],
    targetNodeId?: string
  ): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }
      
      // Indicate processing has started
      setIsProcessing(true);
      
      // Store the callback in the map
      const callbackKey = targetNodeId || 'default';
      callbacksRef.current.set(callbackKey, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
      
      // Send message to worker
      workerRef.current.postMessage({
        type: 'applyFilters',
        imageData,
        filters,
        targetNodeId
      });
    });
  }, []);
  
  return { applyFilter, applyFilters, isProcessing };
}

export default useFilterWorker;