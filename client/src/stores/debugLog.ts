/**
 * Global debug log for render pipeline diagnostics.
 * Persisted to sessionStorage so entries survive SPA navigation.
 */

export interface DebugEntry {
  time: number;
  tag: string;
  message: string;
  data?: Record<string, unknown>;
}

const MAX_ENTRIES = 200;
const STORAGE_KEY = '__nimzey_debug_log';

/** Load entries from sessionStorage */
function loadEntries(): DebugEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

/** Save entries to sessionStorage */
function saveEntries(entries: DebugEntry[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* ignore quota errors */ }
}

const entries: DebugEntry[] = loadEntries();
let seq = entries.length;

/** Listeners for live updates (same-page only) */
type Listener = () => void;
const listeners = new Set<Listener>();

export function debugLog(tag: string, message: string, data?: Record<string, unknown>) {
  seq++;
  entries.push({ time: Date.now(), tag, message, data });
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  saveEntries(entries);
  for (const fn of listeners) fn();
}

export function getDebugEntries(): DebugEntry[] {
  return entries;
}

export function getDebugSeq(): number {
  return seq;
}

export function subscribeDebug(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearDebugLog() {
  entries.length = 0;
  seq = 0;
  saveEntries(entries);
  for (const fn of listeners) fn();
}

// Expose globally for emergency console access
if (typeof window !== 'undefined') {
  (window as any).__debugLog = { entries, debugLog, clearDebugLog };
}
