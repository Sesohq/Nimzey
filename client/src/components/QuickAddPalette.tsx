/**
 * QuickAddPalette - Command palette for quickly adding nodes.
 * Opens on double-click or Space key, searchable, grouped by category.
 */

import { useEffect, useRef } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { NodeRegistry } from '@/registry/nodes';
import { NODE_CATEGORY_LABELS, NodeCategory } from '@/types';

const CATEGORY_ORDER: NodeCategory[] = [
  'noise', 'gradient', 'pattern', 'processing', 'adjustment',
  'channel', 'math', 'transform', 'curve-generator', 'curve-operation',
  'external', 'control', 'advanced',
];

interface QuickAddPaletteProps {
  position: { x: number; y: number };
  onSelect: (definitionId: string) => void;
  onClose: () => void;
}

export default function QuickAddPalette({ position, onSelect, onClose }: QuickAddPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input on mount
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-quick-add-palette]')) {
        onClose();
      }
    };
    // Delay to avoid closing from the same event that opened it
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  const allCategories = NodeRegistry.getAllCategories();

  const handleSelect = (definitionId: string) => {
    onSelect(definitionId);
    onClose();
  };

  // Position the palette, clamping to viewport
  const style: React.CSSProperties = {
    position: 'absolute',
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.min(position.y, window.innerHeight - 400),
    zIndex: 50,
  };

  return (
    <div style={style} data-quick-add-palette>
      <CommandPrimitive
        className="w-[280px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden"
        loop
      >
        <div className="flex items-center border-b border-zinc-800 px-3">
          <CommandPrimitive.Input
            ref={inputRef}
            placeholder="Add node..."
            className="flex h-9 w-full bg-transparent py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>
        <CommandPrimitive.List className="max-h-[300px] overflow-y-auto p-1">
          <CommandPrimitive.Empty className="py-4 text-center text-xs text-zinc-500">
            No nodes found
          </CommandPrimitive.Empty>

          {CATEGORY_ORDER.map(category => {
            const defs = allCategories.get(category);
            if (!defs || defs.length === 0) return null;

            // Filter out special/result nodes
            const filtered = defs.filter(d => d.id !== 'result' && d.id !== 'result-pbr');
            if (filtered.length === 0) return null;

            const label = NODE_CATEGORY_LABELS[category] || category;

            return (
              <CommandPrimitive.Group
                key={category}
                heading={label}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
              >
                {filtered.map(def => (
                  <CommandPrimitive.Item
                    key={def.id}
                    value={`${def.name} ${def.tags?.join(' ') || ''} ${def.description}`}
                    onSelect={() => handleSelect(def.id)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-zinc-300 cursor-pointer data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{def.name}</div>
                      <div className="text-[9px] text-zinc-500 truncate">{def.description}</div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      def.isGenerator
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-blue-500/15 text-blue-400'
                    }`}>
                      {def.isGenerator ? 'Gen' : 'Proc'}
                    </span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            );
          })}
        </CommandPrimitive.List>
      </CommandPrimitive>
    </div>
  );
}
