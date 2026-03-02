/**
 * PortContextMenu - Right-click menu for unconnected input ports.
 * Shows compatible nodes that can be created and auto-connected to the port.
 */

import { useCallback, useEffect, useRef } from 'react';
import { DataType, NODE_CATEGORY_ICONS, NODE_CATEGORY_COLORS } from '@/types';
import { NodeRegistry } from '@/registry/nodes';
import { getFriendlyName } from '@/data/friendlyNames';
import {
  Sparkles, Layers, SlidersHorizontal, Wand2, Blend,
  Move, Calculator, Spline, Settings, Star,
} from 'lucide-react';

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<any>> = {
  Sparkles, Layers, SlidersHorizontal, Wand2, Blend,
  Move, Calculator, Spline, Settings, Star,
  SplitSquareHorizontal: Layers,
};

interface PortContextMenuProps {
  /** Screen-relative position of the menu */
  position: { x: number; y: number };
  /** The DataType of the unconnected port */
  dataType: DataType;
  /** The target node ID that owns the unconnected port */
  targetNodeId: string;
  /** The target port ID that is unconnected */
  targetPortId: string;
  /** Called when a node is selected to create and connect */
  onSelect: (definitionId: string, targetNodeId: string, targetPortId: string) => void;
  /** Called when menu should close */
  onClose: () => void;
}

/** Get suggestions for a given DataType */
function getSuggestions(dataType: DataType): { id: string; name: string; category: string }[] {
  const suggestions: { id: string; name: string; category: string }[] = [];
  const allDefs = NodeRegistry.getAll();

  for (const def of allDefs) {
    // Skip result/special nodes
    if (def.id === 'result' || def.id === 'result-pbr') continue;

    // Check if this node has an output with matching DataType
    const hasMatchingOutput = def.outputs.some(o => o.dataType === dataType);
    if (!hasMatchingOutput) continue;

    // Prefer generators (no required Map inputs) — they're the best suggestions
    // Also include processing nodes since they can be useful too
    suggestions.push({
      id: def.id,
      name: getFriendlyName(def.id, def.name),
      category: def.category,
    });
  }

  // Sort: generators first, then by category, then alphabetically
  return suggestions.sort((a, b) => {
    const aDef = NodeRegistry.get(a.id);
    const bDef = NodeRegistry.get(b.id);
    const aIsGen = aDef?.isGenerator ? 0 : 1;
    const bIsGen = bDef?.isGenerator ? 0 : 1;
    if (aIsGen !== bIsGen) return aIsGen - bIsGen;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });
}

/** Category display names */
const CATEGORY_NAMES: Record<string, string> = {
  generator: 'Generators',
  filter: 'Filters',
  adjustment: 'Adjustments',
  effect: 'Effects',
  blender: 'Blenders',
  transform: 'Transforms',
  channel: 'Channels',
  math: 'Math',
  curve: 'Curves',
  utility: 'Utility',
};

export default function PortContextMenu({
  position,
  dataType,
  targetNodeId,
  targetPortId,
  onSelect,
  onClose,
}: PortContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Delay to avoid the contextmenu event from closing immediately
    requestAnimationFrame(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEscape);
    });
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position so menu doesn't overflow viewport
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw - 8) {
      menuRef.current.style.left = `${Math.max(8, vw - rect.width - 8)}px`;
    }
    if (rect.bottom > vh - 8) {
      menuRef.current.style.top = `${Math.max(8, vh - rect.height - 8)}px`;
    }
  }, []);

  const suggestions = getSuggestions(dataType);

  const handleSelect = useCallback((definitionId: string) => {
    onSelect(definitionId, targetNodeId, targetPortId);
    onClose();
  }, [onSelect, targetNodeId, targetPortId, onClose]);

  if (suggestions.length === 0) {
    return (
      <div
        ref={menuRef}
        className="fixed z-[100] bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl py-2 px-3 text-[11px] text-[#888]"
        style={{ left: position.x, top: position.y }}
      >
        No compatible nodes available
      </div>
    );
  }

  // Group by category
  const grouped = new Map<string, typeof suggestions>();
  for (const s of suggestions) {
    const group = grouped.get(s.category) || [];
    group.push(s);
    grouped.set(s.category, group);
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl py-1.5 min-w-[180px] max-w-[220px] max-h-[320px] overflow-y-auto"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#666] border-b border-[#2a2a2a] mb-1">
        Add & Connect
      </div>

      {Array.from(grouped.entries()).map(([category, items]) => {
        const iconName = (NODE_CATEGORY_ICONS as Record<string, string>)[category];
        const Icon = CATEGORY_ICON_MAP[iconName] || Star;
        const catColor = (NODE_CATEGORY_COLORS as Record<string, string>)[category] || '#888';
        const catName = CATEGORY_NAMES[category] || category;

        return (
          <div key={category}>
            <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-[#555] flex items-center gap-1.5 mt-0.5">
              <Icon size={9} style={{ color: catColor }} />
              {catName}
            </div>
            {items.map(item => (
              <button
                key={item.id}
                className="w-full text-left px-3 py-1.5 text-[11px] text-[#ccc] hover:bg-[#2a2a2a] hover:text-white transition-colors flex items-center gap-2"
                onClick={() => handleSelect(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
