/**
 * FilterPanel - Registry-driven node palette with search, categories, and drag-and-drop.
 * Reads all available nodes from NodeRegistry.
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NodeRegistry } from '@/registry/nodes';
import {
  NodeCategory,
  NODE_CATEGORY_LABELS,
  NODE_CATEGORY_ICONS,
  NodeDefinition,
} from '@/types';
import {
  Search,
  Plus,
  Upload,
  Waves,
  Palette,
  Grid3x3,
  Layers,
  SlidersHorizontal,
  Calculator,
  Move,
  Image,
  Settings,
  Cpu,
  Star,
  GitBranch,
  Spline,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<any>> = {
  Waves, Palette, Grid3x3, Layers, SlidersHorizontal, Calculator,
  Move, Image, Settings, Cpu, Star, GitBranch, Spline,
  SplitSquareHorizontal: Layers,
};

// Category display order
const CATEGORY_ORDER: NodeCategory[] = [
  'noise', 'gradient', 'pattern', 'processing', 'adjustment',
  'channel', 'math', 'transform', 'curve-generator', 'curve-operation',
  'external', 'control', 'advanced',
];

interface FilterPanelProps {
  width: number;
  onAddNode: (definitionId: string, position?: { x: number; y: number }) => void;
  onUploadImage?: (file: File) => void;
}

export default function FilterPanel({ width, onAddNode, onUploadImage }: FilterPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORY_ORDER.slice(0, 5))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allCategories = useMemo(() => NodeRegistry.getAllCategories(), []);

  // Filter by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return allCategories;
    const results = NodeRegistry.search(searchQuery);
    const map = new Map<NodeCategory, NodeDefinition[]>();
    for (const def of results) {
      let list = map.get(def.category);
      if (!list) { list = []; map.set(def.category, list); }
      list.push(def);
    }
    return map;
  }, [searchQuery, allCategories]);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, defId: string) => {
    e.dataTransfer.setData('application/nimzey-node', defId);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      onUploadImage(file);
    }
    e.target.value = '';
  }, [onUploadImage]);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800" style={{ width }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <Layers size={18} className="text-zinc-400" />
        <span className="text-sm font-medium text-zinc-200">Nodes</span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-zinc-800">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-7 pr-2 text-xs bg-zinc-800 text-zinc-200 border border-zinc-700 rounded outline-none focus:border-blue-500 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Category list */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {CATEGORY_ORDER.map(category => {
            const defs = filteredCategories.get(category);
            if (!defs || defs.length === 0) return null;

            const isExpanded = expandedCategories.has(category);
            const iconName = NODE_CATEGORY_ICONS[category];
            const Icon = CATEGORY_ICON_MAP[iconName] || Star;
            const label = NODE_CATEGORY_LABELS[category] || category;

            return (
              <div key={category}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <Icon size={13} className="text-zinc-500" />
                  <span className="flex-1 text-left">{label}</span>
                  <span className="text-[10px] text-zinc-600">{defs.length}</span>
                </button>

                {/* Node items */}
                {isExpanded && (
                  <div className="pb-1">
                    {defs.map(def => (
                      <div
                        key={def.id}
                        draggable
                        onDragStart={e => handleDragStart(e, def.id)}
                        onClick={() => onAddNode(def.id)}
                        className="flex items-center gap-2 px-5 py-1 mx-1 rounded text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer transition-colors group"
                      >
                        <span className="flex-1 truncate">{def.name}</span>
                        <Plus size={11} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Upload button */}
      <div className="p-2 border-t border-zinc-800">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          <Upload size={13} />
          <span>Upload Image</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
