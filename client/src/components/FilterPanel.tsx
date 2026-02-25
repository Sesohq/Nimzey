/**
 * FilterPanel - Registry-driven node palette with search, categories, and drag-and-drop.
 * Reads all available nodes from NodeRegistry. Shows HoverCard on hover with node description and ports.
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { NodeRegistry } from '@/registry/nodes';
import {
  NodeCategory,
  NODE_CATEGORY_LABELS,
  NODE_CATEGORY_ICONS,
  NodeDefinition,
  DATA_TYPE_COLORS,
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

function NodeInfoCard({ def }: { def: NodeDefinition }) {
  return (
    <div className="flex flex-col gap-2 max-w-[220px]">
      <div>
        <div className="text-[11px] font-semibold text-zinc-100">{def.name}</div>
        <div className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{def.description}</div>
      </div>

      {/* Ports */}
      <div className="flex gap-4">
        {def.inputs.length > 0 && (
          <div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">Inputs</div>
            {def.inputs.map(port => (
              <div key={port.id} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: DATA_TYPE_COLORS[port.dataType] }}
                />
                <span className="text-[10px] text-zinc-300">
                  {port.label}
                  {port.required && <span className="text-amber-400 ml-0.5">*</span>}
                </span>
              </div>
            ))}
          </div>
        )}
        {def.outputs.length > 0 && (
          <div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">Outputs</div>
            {def.outputs.map(port => (
              <div key={port.id} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: DATA_TYPE_COLORS[port.dataType] }}
                />
                <span className="text-[10px] text-zinc-300">{port.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      {def.tags && def.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {def.tags.slice(0, 5).map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="text-[9px] text-zinc-600">
        {def.isGenerator ? 'Generator' : 'Processor'} · Click or drag to add
      </div>
    </div>
  );
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
    <div className="flex flex-col h-full bg-black border-r border-neutral-800 flex-shrink-0" style={{ width }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-800">
        <Layers size={18} className="text-neutral-400" />
        <span className="text-sm font-medium text-white">Nodes</span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-neutral-800">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-7 pr-2 text-xs bg-neutral-900 text-white border border-neutral-700 rounded outline-none focus:border-blue-500 placeholder:text-neutral-500"
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
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white hover:bg-neutral-800/50 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <Icon size={13} className="text-neutral-400" />
                  <span className="flex-1 text-left">{label}</span>
                  <span className="text-[10px] text-neutral-500">{defs.length}</span>
                </button>

                {/* Node items */}
                {isExpanded && (
                  <div className="pb-1">
                    {defs.map(def => (
                      <HoverCard key={def.id} openDelay={300} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <div
                            draggable
                            onDragStart={e => handleDragStart(e, def.id)}
                            onClick={() => onAddNode(def.id)}
                            className="flex items-center gap-2 px-5 py-1 mx-1 rounded text-[11px] text-neutral-300 hover:bg-neutral-800 hover:text-white cursor-pointer transition-colors group"
                          >
                            <span className="flex-1 truncate">{def.name}</span>
                            <Plus size={11} className="text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="right"
                          align="start"
                          className="p-3 bg-zinc-900 border-zinc-700 shadow-xl"
                        >
                          <NodeInfoCard def={def} />
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Upload button */}
      <div className="p-2 border-t border-neutral-800">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
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
