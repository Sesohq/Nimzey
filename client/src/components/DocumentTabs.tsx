/**
 * DocumentTabs - Horizontal tab bar for multiple open documents.
 * Similar to Photoshop/Figma document tabs.
 */

import { memo, useCallback, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export interface DocumentTab {
  id: string;
  name: string;
  width: number;
  height: number;
}

interface DocumentTabsProps {
  tabs: DocumentTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
}

export default memo(function DocumentTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}: DocumentTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view when it changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-tab-id="${activeTabId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeTabId]);

  if (tabs.length <= 1) return null;

  return (
    <div className="flex items-center bg-zinc-900 border-b border-zinc-800 h-8 flex-shrink-0">
      <div
        ref={scrollRef}
        className="flex-1 flex items-center overflow-x-auto scrollbar-none"
      >
        {tabs.map(tab => (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`group flex items-center gap-1.5 px-3 h-8 text-[11px] border-r border-zinc-800 cursor-pointer select-none whitespace-nowrap transition-colors ${
              tab.id === activeTabId
                ? 'bg-zinc-950 text-white border-b-2 border-b-blue-500'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <span className="truncate max-w-[120px]">{tab.name}</span>
            <span className="text-[9px] text-zinc-600 tabular-nums">
              {tab.width}x{tab.height}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="ml-0.5 p-0.5 rounded hover:bg-zinc-700 text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Close tab"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onNewTab}
        className="flex items-center justify-center w-8 h-8 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors border-l border-zinc-800 flex-shrink-0"
        title="New document"
      >
        <Plus size={14} />
      </button>
    </div>
  );
});
