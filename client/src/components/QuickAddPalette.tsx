/**
 * QuickAddPalette - Command palette for quickly adding nodes.
 * Opens on double-click or Space key, searchable, grouped by simplified categories.
 * Shows friendly names with original names as secondary text.
 *
 * Uses plain HTML (no Radix/cmdk) to avoid ReactFlow SVG `hasAttribute` conflict.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { NodeRegistry } from '@/registry/nodes';
import { NodeDefinition } from '@/types';
import { SIMPLIFIED_GROUPS } from '@/data/simplifiedGroups';
import { getFriendlyName, getFriendlyDescription } from '@/data/friendlyNames';

interface QuickAddPaletteProps {
  position: { x: number; y: number };
  onSelect: (definitionId: string) => void;
  onClose: () => void;
}

interface FlatItem {
  def: NodeDefinition;
  friendly: string;
  friendlyDesc: string;
  searchText: string;
  groupLabel: string;
}

export default function QuickAddPalette({ position, onSelect, onClose }: QuickAddPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest && !target.closest('[data-quick-add-palette]')) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  const allCategories = NodeRegistry.getAllCategories();

  // Build flat item list grouped by simplified categories
  const allItems = useMemo(() => {
    const items: FlatItem[] = [];
    for (const group of SIMPLIFIED_GROUPS) {
      const defs: NodeDefinition[] = [];
      for (const cat of group.categories) {
        const catDefs = allCategories.get(cat);
        if (catDefs) {
          for (const def of catDefs) {
            if (def.id !== 'result' && def.id !== 'result-pbr') {
              defs.push(def);
            }
          }
        }
      }
      defs.sort((a, b) =>
        getFriendlyName(a.id, a.name).localeCompare(getFriendlyName(b.id, b.name))
      );
      for (const def of defs) {
        const friendly = getFriendlyName(def.id, def.name);
        const friendlyDesc = getFriendlyDescription(def.id, def.description);
        items.push({
          def,
          friendly,
          friendlyDesc,
          searchText: `${friendly} ${def.name} ${def.tags?.join(' ') || ''} ${friendlyDesc} ${def.description}`.toLowerCase(),
          groupLabel: group.label,
        });
      }
    }
    return items;
  }, [allCategories]);

  // Filter items by query
  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase().trim();
    return allItems.filter(item => item.searchText.includes(q));
  }, [allItems, query]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback((definitionId: string) => {
    onSelect(definitionId);
    onClose();
  }, [onSelect, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(filtered.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].def.id);
      }
    }
  }, [onClose, filtered, selectedIndex, handleSelect]);

  // Group filtered items for display
  const groupedItems = useMemo(() => {
    const groups: { label: string; items: (FlatItem & { flatIndex: number })[] }[] = [];
    let currentLabel = '';
    let currentGroup: (FlatItem & { flatIndex: number })[] = [];
    for (let i = 0; i < filtered.length; i++) {
      const item = filtered[i];
      if (item.groupLabel !== currentLabel) {
        if (currentGroup.length > 0) {
          groups.push({ label: currentLabel, items: currentGroup });
        }
        currentLabel = item.groupLabel;
        currentGroup = [];
      }
      currentGroup.push({ ...item, flatIndex: i });
    }
    if (currentGroup.length > 0) {
      groups.push({ label: currentLabel, items: currentGroup });
    }
    return groups;
  }, [filtered]);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.min(position.y, window.innerHeight - 400),
    zIndex: 50,
  };

  return (
    <div style={style} data-quick-add-palette onKeyDown={handleKeyDown}>
      <div className="w-[280px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
        <div className="flex items-center border-b border-zinc-800 px-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Add node..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex h-9 w-full bg-transparent py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>
        <div ref={listRef} className="max-h-[300px] overflow-y-auto p-1">
          {filtered.length === 0 && (
            <div className="py-4 text-center text-xs text-zinc-500">
              No nodes found
            </div>
          )}

          {groupedItems.map(({ label, items }) => (
            <div key={label}>
              <div className="px-2 py-1 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                {label}
              </div>
              {items.map(({ def, friendly, friendlyDesc, flatIndex }) => (
                <div
                  key={def.id}
                  data-selected={flatIndex === selectedIndex ? 'true' : 'false'}
                  onClick={() => handleSelect(def.id)}
                  onMouseEnter={() => setSelectedIndex(flatIndex)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                    flatIndex === selectedIndex
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-300'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{friendly}</div>
                    <div className="text-[9px] text-zinc-500 truncate">
                      {def.name !== friendly ? `${def.name} · ` : ''}{friendlyDesc}
                    </div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    def.isGenerator
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    {def.isGenerator ? 'Gen' : 'Proc'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
