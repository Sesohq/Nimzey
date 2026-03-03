/**
 * FilterPanel - Node palette sidebar matching the Nimzey Figma design.
 * Compact list style with colored category dots, abbreviations, and ALL CAPS headers.
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
  NODE_CATEGORY_COLORS,
} from '@/types';
import {
  Search,
  Plus,
  Minus,
  Upload,
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [presetsExpanded, setPresetsExpanded] = useState(false);
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
    <div className="flex flex-col h-full bg-[#131312] border-r border-[#333] flex-shrink-0" style={{ width }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#333]">
        <span className="text-[13px] font-medium text-[#DBDBDC] tracking-wide">Nodes</span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[#333]">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#525252]" />
          <input
            type="text"
            placeholder="Search.."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-7 pr-2 text-[11px] bg-[#0E0E0E] text-white border border-[#2a2a2a] rounded outline-none focus:border-[#E0FF29] placeholder:text-[#525252]"
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
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] hover:bg-[#1A1A19] transition-colors"
              >
                {presetsExpanded ? (
                  <Minus size={13} className="text-[#E0FF29] flex-shrink-0" />
                ) : (
                  <Plus size={13} className="text-[#E0FF29] flex-shrink-0" />
                )}
                <span className="flex-1 text-left text-[#E0FF29] font-semibold tracking-wider uppercase">Quick Effects</span>
                <span className="text-[10px] text-[#525252] flex-shrink-0">——</span>
                <span className="text-[10px] text-[#A6A6A6] tabular-nums flex-shrink-0">{String(effectPresets.length).padStart(3, '0')}</span>
              </button>
              {presetsExpanded && (
                <div className="pb-1">
                  {effectPresets.map(preset => {
                    const Icon = preset.icon;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => onApplyPreset(preset.id)}
                        className="flex items-center gap-2 px-5 py-1.5 mx-1 rounded text-[11px] text-[#A6A6A6] hover:bg-[#1A1A19] hover:text-[#E0FF29] cursor-pointer transition-colors group"
                      >
                        <Icon size={12} className="text-[#E0FF29]/40 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{preset.name}</div>
                          <div className="text-[9px] text-[#525252] truncate">{preset.description}</div>
                        </div>
                        <Plus size={11} className="text-[#525252] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Node groups */}
          {SIMPLIFIED_GROUPS.map(group => {
            const defs = groupedNodes.get(group.id);
            if (!defs || defs.length === 0) return null;

            const isExpanded = expandedGroups.has(group.id);
            const categoryColor = NODE_CATEGORY_COLORS[group.categories[0]];

            return (
              <div key={group.id}>
                {/* Category header — colored +/− toggle, ALL CAPS */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] hover:bg-[#1A1A19] transition-colors"
                >
                  {isExpanded ? (
                    <Minus size={13} style={{ color: categoryColor }} className="flex-shrink-0" />
                  ) : (
                    <Plus size={13} style={{ color: categoryColor }} className="flex-shrink-0" />
                  )}
                  <span className="flex-1 text-left text-[#DBDBDC] tracking-wider font-semibold uppercase text-[10px]">{group.label}</span>
                  <span className="text-[10px] text-[#525252] flex-shrink-0">——</span>
                  <span className="text-[10px] text-[#A6A6A6] tabular-nums flex-shrink-0">{String(defs.length).padStart(3, '0')}</span>
                </button>

                {isExpanded && (
                  <div className="pb-1">
                    {defs.map((def) => (
                      <HoverCard key={def.id} openDelay={300} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <div
                            draggable
                            onDragStart={e => handleDragStart(e, def.id)}
                            onClick={() => onAddNode(def.id)}
                            className="flex items-center gap-2.5 mx-2 px-2 py-[6px] rounded text-[11px] bg-[#1A1A19] hover:bg-[#222221] cursor-pointer transition-colors group mb-[3px]"
                          >
                            {/* Thin colored bar */}
                            <div
                              className="w-[3px] self-stretch rounded-[1px] flex-shrink-0"
                              style={{ backgroundColor: categoryColor }}
                            />
                            {/* Node name */}
                            <span className="flex-1 min-w-0 truncate text-white text-[12px]">
                              {getFriendlyName(def.id, def.name)}
                            </span>
                            {/* Category abbreviation */}
                            <span className="text-[9px] text-[#666] tracking-wider flex-shrink-0 uppercase">
                              {group.abbreviation}
                            </span>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="right"
                          align="start"
                          className="p-3 bg-[#1A1A19] border-[#333] shadow-xl"
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
      <div className="p-2 border-t border-[#333]">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] text-[#A6A6A6] bg-[#1A1A19] hover:bg-[#252524] hover:text-white rounded transition-colors"
        >
          <Upload size={12} />
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
