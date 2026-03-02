/**
 * Debug page — live tail of render pipeline diagnostics.
 * Accessible at /debug — auto-scrolls, color-coded by tag.
 * Reads from sessionStorage so entries persist across SPA navigation.
 * Polls for updates if the editor is in the same tab, or via storage events from other tabs.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { getDebugEntries, subscribeDebug, clearDebugLog, DebugEntry } from '@/stores/debugLog';

const TAG_COLORS: Record<string, string> = {
  INIT: '#4fc3f7',
  RENDER: '#81c784',
  EFFECT: '#ffb74d',
  TIMER: '#ce93d8',
  IMAGE: '#f06292',
  EDGE: '#ffa726',
  ERROR: '#ef5350',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function EntryLine({ entry }: { entry: DebugEntry }) {
  const color = TAG_COLORS[entry.tag] || '#aaa';
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: '18px', padding: '1px 0', borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ color: '#666' }}>{formatTime(entry.time)}</span>
      {' '}
      <span style={{ color, fontWeight: 'bold', minWidth: 60, display: 'inline-block' }}>[{entry.tag}]</span>
      {' '}
      <span style={{ color: '#ddd' }}>{entry.message}</span>
      {entry.data && (
        <span style={{ color: '#888', marginLeft: 8 }}>
          {Object.entries(entry.data).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('  ')}
        </span>
      )}
    </div>
  );
}

export default function DebugPage() {
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const refresh = useCallback(() => {
    setEntries([...getDebugEntries()]);
  }, []);

  useEffect(() => {
    refresh();

    // In-memory subscription (same page)
    const unsub = subscribeDebug(refresh);

    // Poll sessionStorage for cross-navigation updates (every 500ms)
    const interval = setInterval(() => {
      try {
        const raw = sessionStorage.getItem('__nimzey_debug_log');
        const parsed = raw ? JSON.parse(raw) : [];
        if (parsed.length !== entries.length) {
          setEntries(parsed);
        }
      } catch { /* ignore */ }
    }, 500);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [entries, autoScroll]);

  return (
    <div style={{ background: '#111', color: '#ddd', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderBottom: '1px solid #333', background: '#1a1a1a', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>🔧 Render Debug</span>
        <span style={{ color: '#666', fontSize: 12 }}>{entries.length} entries</span>
        <button
          onClick={() => { clearDebugLog(); setEntries([]); }}
          style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 11, background: '#333', color: '#ccc', border: '1px solid #555', borderRadius: 4, cursor: 'pointer' }}
        >
          Clear
        </button>
        <button
          onClick={refresh}
          style={{ padding: '4px 12px', fontSize: 11, background: '#333', color: '#ccc', border: '1px solid #555', borderRadius: 4, cursor: 'pointer' }}
        >
          Refresh
        </button>
        <label style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
          Auto-scroll
        </label>
      </div>

      {/* Log */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 16px' }}>
        {entries.length === 0 ? (
          <div style={{ color: '#555', padding: 40, textAlign: 'center', fontSize: 13 }}>
            No debug entries yet. Open a document to see render pipeline activity.
          </div>
        ) : (
          entries.map((entry, i) => <EntryLine key={i} entry={entry} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, padding: '6px 16px', borderTop: '1px solid #333', background: '#1a1a1a', fontSize: 11 }}>
        {Object.entries(TAG_COLORS).map(([tag, color]) => (
          <span key={tag} style={{ color }}>{tag}</span>
        ))}
      </div>
    </div>
  );
}
