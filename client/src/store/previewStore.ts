/**
 * previewStore.ts
 * 
 * Global store for managing node previews in a way that's decoupled
 * from React Flow's rendering cycle.
 */
import { create } from 'zustand';

export interface PreviewState {
  // nodeId → dataURL
  previews: Record<string, string>;
  // Keep track of which nodes are currently being processed
  processing: Record<string, boolean>;
  // Current quality level for previews
  qualityLevel: 'preview' | 'draft' | 'full';
}

export interface PreviewActions {
  updatePreview: (nodeId: string, url: string) => void;
  setProcessing: (nodeId: string, isProcessing: boolean) => void;
  setQualityLevel: (quality: 'preview' | 'draft' | 'full') => void;
  clearPreviews: () => void;
}

export const usePreviewStore = create<PreviewState & PreviewActions>((set) => ({
  // Initial state
  previews: {},
  processing: {},
  qualityLevel: 'draft',
  
  // Actions
  updatePreview: (nodeId, url) =>
    set((state) => ({
      previews: { ...state.previews, [nodeId]: url },
      // Automatically mark node as no longer processing when preview is updated
      processing: { ...state.processing, [nodeId]: false }
    })),
    
  setProcessing: (nodeId, isProcessing) =>
    set((state) => ({
      processing: { ...state.processing, [nodeId]: isProcessing }
    })),
    
  setQualityLevel: (quality) =>
    set({ qualityLevel: quality }),
    
  clearPreviews: () =>
    set({ previews: {}, processing: {} })
}));