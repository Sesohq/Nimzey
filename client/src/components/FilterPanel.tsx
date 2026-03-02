/**
 * FilterPanel - Simplified node palette with 6 groups, friendly names, and effect presets.
 * Uses simplified category groups instead of 13 raw categories.
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
  NodeDefinition,
  DATA_TYPE_COLORS,
} from '@/types';
import {
  Search,
  Plus,
  Upload,
  ChevronDown,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { SIMPLIFIED_GROUPS } from '@/data/simplifiedGroups';
import { getFriendlyName, getFriendlyDescription } from '@/data/friendlyNames';
import { effectPresets } from '@/data/effectPresets';

interface FilterPanelProps {
  width: number;
  onAddNode: (definitionId: string, position?: { x: number; y: number }) => void;
  onUploadImage?: (file: File) => void;
  onApplyPreset?: (presetId: string) => void;
}

function NodeInfoCard({ def }: { def: NodeDefinition }) {
  const friendlyDesc = getFriendlyDescription(def.id, def.description);
  return (
    <div className="flex flex-col gap-2 max-w-[220px]">
      <div>
        <div className="text-[11px] font-semibold text-zinc-100">
          {getFriendlyName(def.id, def.name)}
        </div>
        <div className="text-[10px] text-zinc-500 italic">{def.name}</div>
        <div className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{friendlyDesc}</div>
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

export default function FilterPanel({ width, onAddNode, onUploadImage, onApplyPreset }: FilterPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['generators', 'filters', 'adjustments'])
  );
  const [presetsExpanded, setPresetsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allCategories = useMemo(() => NodeRegistry.getAllCategories(), []);

  // Build nodes grouped by simplified group
  const groupedNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const groups = new Map<string, NodeDefinition[]>();

    for (const group of SIMPLIFIED_GROUPS) {
      const defs: NodeDefinition[] = [];
      for (const cat of group.categories) {
        const catDefs = allCategories.get(cat);
        if (!catDefs) continue;
        for (const def of catDefs) {
          // Filter out special/result nodes
          if (def.id === 'result' || def.id === 'result-pbr') continue;

          if (query) {
            const friendly = getFriendlyName(def.id, def.name).toLowerCase();
            const friendlyDesc = getFriendlyDescription(def.id, def.description).toLowerCase();
            const matches =
              def.name.toLowerCase().includes(query) ||
              friendly.includes(query) ||
              def.description.toLowerCase().includes(query) ||
              friendlyDesc.includes(query) ||
              def.tags?.some(t => t.toLowerCase().includes(query));
            if (!matches) continue;
          }

          defs.push(def);
        }
      }
      // Sort alphabetically by friendly name
      defs.sort((a, b) =>
        getFriendlyName(a.id, a.name).localeCompare(getFriendlyName(b.id, b.name))
      );
      if (defs.length > 0) {
        groups.set(group.id, defs);
      }
    }
    return groups;
  }, [searchQuery, allCategories]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
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
        <Zap size={16} className="text-amber-400" />
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

      <ScrollArea className="flex-1">
        <div className="py-1">
          {/* Effect Presets section */}
          {!searchQuery && onApplyPreset && (
            <div>
              <button
                onClick={() => setPresetsExpanded(!presetsExpanded)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-300 hover:bg-neutral-800/50 transition-colors"
              >
                {presetsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <Zap size={13} className="text-amber-400" />
                <span className="flex-1 text-left font-medium">Quick Effects</span>
                <span className="text-[10px] text-neutral-500">{effectPresets.length}</span>
              </button>
              {presetsExpanded && (
                <div className="pb-1">
                  {effectPresets.map(preset => {
                    const Icon = preset.icon;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => onApplyPreset(preset.id)}
                        className="flex items-center gap-2 px-5 py-1.5 mx-1 rounded text-[11px] text-neutral-300 hover:bg-amber-500/10 hover:text-amber-200 cursor-pointer transition-colors group"
                      >
                        <Icon size={12} className="text-amber-500/60 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{preset.name}</div>
                          <div className="text-[9px] text-neutral-500 truncate">{preset.description}</div>
                        </div>
                        <Plus size={11} className="text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Simplified node groups */}
          {SIMPLIFIED_GROUPS.map(group => {
            const defs = groupedNodes.get(group.id);
            if (!defs || defs.length === 0) return null;

            const isExpanded = expandedGroups.has(group.id);
            const Icon = group.icon;

            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white hover:bg-neutral-800/50 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <Icon size={13} className="text-neutral-400" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <span className="text-[10px] text-neutral-500">{defs.length}</span>
                </button>

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
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{getFriendlyName(def.id, def.name)}</div>
                              <div className="text-[9px] text-neutral-600 truncate">{def.name}</div>
                            </div>
                            <Plus size={11} className="text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
