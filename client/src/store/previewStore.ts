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
  // Last updated timestamp for each node preview
  lastUpdated: Record<string, number>;
}

export interface PreviewActions {
  updatePreview: (nodeId: string, url: string) => void;
  setProcessing: (nodeId: string, isProcessing: boolean) => void;
  setQualityLevel: (quality: 'preview' | 'draft' | 'full') => void;
  clearPreviews: () => void;
  getPreviewForNode: (nodeId: string) => string | null;
  shouldUpdatePreview: (nodeId: string, debounceMs: number) => boolean;
}

export const usePreviewStore = create<PreviewState & PreviewActions>((set, get) => ({
  // Initial state
  previews: {},
  processing: {},
  qualityLevel: 'draft',
  lastUpdated: {},
  
  // Actions
  updatePreview: (nodeId, url) =>
    set((state) => ({
      previews: { ...state.previews, [nodeId]: url },
      // Automatically mark node as no longer processing when preview is updated
      processing: { ...state.processing, [nodeId]: false },
      lastUpdated: { ...state.lastUpdated, [nodeId]: Date.now() }
    })),
    
  setProcessing: (nodeId, isProcessing) =>
    set((state) => ({
      processing: { ...state.processing, [nodeId]: isProcessing }
    })),
    
  setQualityLevel: (quality) =>
    set({ qualityLevel: quality }),
    
  clearPreviews: () =>
    set({ previews: {}, processing: {}, lastUpdated: {} }),
    
  getPreviewForNode: (nodeId) => {
    return get().previews[nodeId] || null;
  },
  
  shouldUpdatePreview: (nodeId, debounceMs) => {
    const lastUpdate = get().lastUpdated[nodeId] || 0;
    const now = Date.now();
    return now - lastUpdate > debounceMs;
  }
}));