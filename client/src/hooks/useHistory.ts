/**
 * useHistory - Manages undo/redo history using serialized graph snapshots.
 * Uses refs for the history array to avoid unnecessary re-renders.
 * Only canUndo/canRedo are reactive (drive UI button states).
 */

import { useCallback, useRef, useState } from 'react';
import { SerializedGraph } from '@/utils/graphSerializer';

const MAX_HISTORY = 50;

export interface UseHistoryReturn {
  /** Push a new snapshot. Truncates any redo entries. */
  pushState: (state: SerializedGraph) => void;
  /** Go back one step. Returns the state to restore, or null if at start. */
  undo: () => SerializedGraph | null;
  /** Go forward one step. Returns the state to restore, or null if at end. */
  redo: () => SerializedGraph | null;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Clear all history */
  clear: () => void;
}

export function useHistory(): UseHistoryReturn {
  const historyRef = useRef<SerializedGraph[]>([]);
  const indexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < historyRef.current.length - 1);
  }, []);

  const pushState = useCallback((state: SerializedGraph) => {
    const history = historyRef.current;
    const index = indexRef.current;

    // Truncate any redo entries beyond current position
    if (index < history.length - 1) {
      history.splice(index + 1);
    }

    // Push new snapshot
    history.push(state);

    // Enforce max history size
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    indexRef.current = history.length - 1;
    updateFlags();
  }, [updateFlags]);

  const undo = useCallback((): SerializedGraph | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current--;
    updateFlags();
    return historyRef.current[indexRef.current];
  }, [updateFlags]);

  const redo = useCallback((): SerializedGraph | null => {
    if (indexRef.current >= historyRef.current.length - 1) return null;
    indexRef.current++;
    updateFlags();
    return historyRef.current[indexRef.current];
  }, [updateFlags]);

  const clear = useCallback(() => {
    historyRef.current = [];
    indexRef.current = -1;
    updateFlags();
  }, [updateFlags]);

  return { pushState, undo, redo, canUndo, canRedo, clear };
}
