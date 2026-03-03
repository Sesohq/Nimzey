/**
 * NimzeyNode - Unified node component matching Figma design.
 * Thin colored top bar, category label (GEN-004), large node name.
 */

import { memo, useCallback, useState, useEffect, useRef, useContext, createContext } from 'react';
import { NodeProps, Position } from 'reactflow';
import {
  NimzeyNodeData,
  NodeColorTag,
  DataType,
  NODE_COLOR_TAG_COLORS,
  NODE_CATEGORY_COLORS,
} from '@/types';
import { NodeRegistry } from '@/registry/nodes';
import { TypedHandle } from './TypedHandle';
import { ParameterRenderer } from './parameters/ParameterRenderer';
import { cn } from '@/lib/utils';
import { getFriendlyName } from '@/data/friendlyNames';
import { SIMPLIFIED_GROUPS } from '@/data/simplifiedGroups';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Palette,
  Upload,
} from 'lucide-react';

// ---------- Node label lookup (lazy singleton) ----------

let _nodeLabels: Map<string, { abbreviation: string; index: number }> | null = null;

function getNodeLabel(definitionId: string): { abbreviation: string; index: number } {
  if (!_nodeLabels) {
    _nodeLabels = new Map();
    const allCategories = NodeRegistry.getAllCategories();
    for (const group of SIMPLIFIED_GROUPS) {
      const defs: { id: string; name: string }[] = [];
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
        getFriendlyName(a.id, a.name).localeCompare(getFriendlyName(b.id, b.name)),
      );
      defs.forEach((def, i) => {
        _nodeLabels!.set(def.id, { abbreviation: group.abbreviation, index: i + 1 });
      });
    }
  }
  return _nodeLabels.get(definitionId) || { abbreviation: 'NOD', index: 0 };
}

// ---------- Context for graph actions passed from parent ----------

export interface NimzeyNodeActions {
  onParameterChange: (nodeId: string, paramId: string, value: number | string | boolean | number[]) => void;
  onToggleEnabled: (nodeId: string) => void;
  onToggleCollapsed: (nodeId: string) => void;
  onSetColorTag: (nodeId: string, tag: NodeColorTag) => void;
  onUploadImage?: (nodeId: string, file: File) => void;
  onPortContextMenu?: (nodeId: string, portId: string, dataType: DataType, screenPos: { x: number; y: number }) => void;
  onHeaderHover?: (nodeId: string, definitionId: string) => void;
  onHeaderHoverEnd?: () => void;
}

export const NimzeyNodeContext = createContext<NimzeyNodeActions>({
  onParameterChange: () => {},
  onToggleEnabled: () => {},
  onToggleCollapsed: () => {},
  onSetColorTag: () => {},
});

// ---------- Color tag picker ----------

const COLOR_TAGS: NodeColorTag[] = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

function ColorTagPicker({ current, onChange }: { current: NodeColorTag; onChange: (tag: NodeColorTag) => void }) {
  return (
    <div className="flex gap-0.5 px-1 py-0.5">
      {COLOR_TAGS.map(tag => (
        <button
          key={tag}
          onClick={(e) => { e.stopPropagation(); onChange(tag); }}
          className={cn(
            'w-3 h-3 rounded-full border transition-transform',
            current === tag ? 'border-white scale-125' : 'border-transparent hover:scale-110',
          )}
          style={{ backgroundColor: NODE_COLOR_TAG_COLORS[tag] }}
        />
      ))}
    </div>
  );
}

// ---------- Main NimzeyNode Component ----------

export const NimzeyNode = memo(function NimzeyNode({ id, data, selected }: NodeProps<NimzeyNodeData>) {
  const def = NodeRegistry.get(data.definitionId);
  const actions = useContext(NimzeyNodeContext);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close color picker when node is deselected
  useEffect(() => {
    if (!selected) setShowColorPicker(false);
  }, [selected]);

  // Connected port IDs - pre-computed in ReactFlowAdapter via edge index
  const connectedInputs = data.connectedInputs || new Set<string>();
  const connectedOutputs = data.connectedOutputs || new Set<string>();

  const handleParamChange = useCallback(
    (paramId: string, value: number | string | boolean | number[]) => {
      actions.onParameterChange(id, paramId, value);
    },
    [id, actions],
  );

  const handleToggleEnabled = useCallback(() => actions.onToggleEnabled(id), [id, actions]);
  const handleToggleCollapsed = useCallback(() => actions.onToggleCollapsed(id), [id, actions]);
  const handleColorTag = useCallback((tag: NodeColorTag) => {
    actions.onSetColorTag(id, tag);
    setShowColorPicker(false);
  }, [id, actions]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && actions.onUploadImage) {
      actions.onUploadImage(id, file);
    }
    e.target.value = '';
  }, [id, actions]);

  if (!def) {
    return (
      <div className="bg-red-900/50 border border-red-500 rounded-lg p-2 text-[10px] text-red-300">
        Unknown node: {data.definitionId}
      </div>
    );
  }

  const isResult = def.id === 'result' || def.id === 'result-pbr';
  const isExternal = def.category === 'utility' && def.id === 'image';
  const categoryColor = NODE_CATEGORY_COLORS[def.category] || '#282828';
  const nodeLabel = getNodeLabel(data.definitionId);

  const friendlyName = getFriendlyName(def.id, def.name);
  const showOriginalName = friendlyName !== def.name;

  // When user sets a custom color tag, use it for the top bar
  const isDefaultTag = data.colorTag === 'default';
  const topBarColor = isDefaultTag
    ? categoryColor
    : (NODE_COLOR_TAG_COLORS[data.colorTag] || categoryColor);

  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        'bg-[#1e1e1e] min-w-[220px] max-w-[280px]',
        selected ? 'border-[#555] ring-1 ring-white/[0.04]' : 'border-[#2e2e2e]',
        !data.enabled && 'opacity-50',
      )}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
    >
      {/* Thin colored top bar */}
      <div
        className="h-[3px] rounded-t-lg"
        style={{ backgroundColor: topBarColor }}
      />

      {/* Header */}
      <div
        className="group/header px-2.5 pt-2 pb-1.5 cursor-grab relative"
        onMouseEnter={() => actions.onHeaderHover?.(id, data.definitionId)}
        onMouseLeave={() => actions.onHeaderHoverEnd?.()}
      >
        {/* Top row: category label + output indicator dots */}
        <div className="flex items-center justify-between mb-0.5">
          <span
            className="text-[10px] font-medium tracking-wide select-none"
            style={{ color: categoryColor }}
          >
            {isResult ? 'OUTPUT' : `${nodeLabel.abbreviation}-${String(nodeLabel.index).padStart(3, '0')}`}
          </span>
          {/* Output indicator dots */}
          <div className="flex items-center gap-1">
            {def.outputs.map(port => (
              <div
                key={port.id}
                className="w-[6px] h-[6px] rounded-[1px]"
                style={{ backgroundColor: categoryColor }}
              />
            ))}
          </div>
        </div>

        {/* Node name */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-white flex-1 truncate select-none">
            {friendlyName}
          </span>
          {/* Action buttons — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleEnabled(); }}
              className="text-[#555] hover:text-white transition-colors p-0.5"
            >
              {data.enabled ? <Eye size={11} /> : <EyeOff size={11} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
              className="text-[#555] hover:text-white transition-colors p-0.5"
            >
              <Palette size={10} />
            </button>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleCollapsed(); }}
            className="text-[#555] hover:text-white transition-colors p-0.5 ml-0.5"
          >
            {data.collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          </button>
        </div>

        {/* Tooltip showing original technical name */}
        {showOriginalName && (
          <div className="pointer-events-none absolute z-50 opacity-0 group-hover/header:opacity-100 transition-opacity duration-150 text-[10px] px-2 py-1 rounded bg-[#252525] border border-[#333] text-[#888] whitespace-nowrap shadow-lg left-1/2 -translate-x-1/2 -top-7">
            {def.name}
          </div>
        )}
      </div>

      {/* Color tag picker */}
      {showColorPicker && (
        <div className="bg-[#252525] border-b border-[#2a2a2a]">
          <ColorTagPicker current={data.colorTag} onChange={handleColorTag} />
        </div>
      )}

      {/* Body */}
      <div className="py-1.5">
        {/* Input Ports */}
        {def.inputs.length > 0 && (
          <div className="flex flex-col border-b border-[#2a2a2a] pb-1 mb-1">
            {def.inputs.map(port => {
              const isConnected = connectedInputs.has(port.id);
              return (
                <div
                  key={port.id}
                  onClick={(e) => {
                    if (!isConnected && actions.onPortContextMenu) {
                      e.stopPropagation();
                      actions.onPortContextMenu(id, port.id, port.dataType, { x: e.clientX, y: e.clientY });
                    }
                  }}
                  className={!isConnected ? 'cursor-pointer' : ''}
                >
                  <TypedHandle
                    type="target"
                    position={Position.Left}
                    id={port.id}
                    dataType={port.dataType}
                    label={port.label}
                    required={port.required}
                    isConnected={isConnected}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Image upload area for external/image nodes */}
        {isExternal && (
          <div className="mb-1.5 px-2">
            {data.imageUrl ? (
              <div
                className="relative group cursor-pointer rounded overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                <img src={data.imageUrl} alt="Source" className="w-full h-auto rounded" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload size={16} className="text-white" />
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-16 border border-dashed border-[#333] rounded flex flex-col items-center justify-center gap-1 text-[#666] hover:text-[#888] hover:border-[#444] transition-colors"
              >
                <Upload size={14} />
                <span className="text-[9px]">Upload Image</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Parameters (when expanded) */}
        {!data.collapsed && def.parameters.length > 0 && (
          <div className="flex flex-col gap-1.5 py-1 px-2">
            {def.parameters.map(param => {
              const isMapConnected = param.mappable && connectedInputs.has(`map_${param.id}`);
              return (
                <div key={param.id} className="relative flex items-center">
                  {/* Map input handle — absolutely positioned to sit on the node edge, vertically centered */}
                  {param.mappable && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                      <TypedHandle
                        type="target"
                        position={Position.Left}
                        id={`map_${param.id}`}
                        dataType={DataType.Map}
                        label=""
                        required={false}
                        isConnected={isMapConnected || false}
                      />
                    </div>
                  )}
                  <div className={cn('flex-1', isMapConnected && 'opacity-40 pointer-events-none')}>
                    <ParameterRenderer
                      param={param}
                      value={data.parameters[param.id] ?? param.defaultValue}
                      onChange={handleParamChange}
                      definitionId={data.definitionId}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Output Ports */}
        {def.outputs.length > 0 && (
          <div className="flex flex-col mt-1 border-t border-[#2a2a2a] pt-1">
            {def.outputs.map(port => (
              <TypedHandle
                key={port.id}
                type="source"
                position={Position.Right}
                id={port.id}
                dataType={port.dataType}
                label={port.label}
                isConnected={connectedOutputs.has(port.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview thumbnail — at the bottom, edge-to-edge, no bleed */}
      {data.preview && !isExternal && (
        <div className="overflow-hidden rounded-b-lg max-h-[120px]">
          <img
            src={data.preview}
            alt="Preview"
            className="w-full h-full object-cover block"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
});
