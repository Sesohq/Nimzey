/**
 * NimzeyNode - Unified node component that renders any node type.
 * Shows friendly names in header with original name as tooltip.
 */

import { memo, useCallback, useState, useEffect, useRef, useContext, createContext } from 'react';
import { NodeProps, Position, useEdges } from 'reactflow';
import {
  NimzeyNodeData,
  NodeColorTag,
  NODE_COLOR_TAG_COLORS,
  NODE_CATEGORY_ICONS,
} from '@/types';
import { NodeRegistry } from '@/registry/nodes';
import { TypedHandle } from './TypedHandle';
import { ParameterRenderer } from './parameters/ParameterRenderer';
import { cn } from '@/lib/utils';
import { getFriendlyName } from '@/data/friendlyNames';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  Palette,
  Upload,
  Waves,
  Grid3x3,
  SlidersHorizontal,
  Calculator,
  Move,
  Image,
  Settings,
  Cpu,
  Star,
  GitBranch,
  Spline,
} from 'lucide-react';

// Icon lookup by category
const CATEGORY_ICON_MAP: Record<string, React.ComponentType<any>> = {
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
  SplitSquareHorizontal: Layers, // fallback
};

// ---------- Context for graph actions passed from parent ----------

export interface NimzeyNodeActions {
  onParameterChange: (nodeId: string, paramId: string, value: number | string | boolean | number[]) => void;
  onToggleEnabled: (nodeId: string) => void;
  onToggleCollapsed: (nodeId: string) => void;
  onSetColorTag: (nodeId: string, tag: NodeColorTag) => void;
  onUploadImage?: (nodeId: string, file: File) => void;
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
  const edges = useEdges();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close color picker when node is deselected
  useEffect(() => {
    if (!selected) setShowColorPicker(false);
  }, [selected]);

  // Connected port IDs for this node
  const connectedInputs = new Set<string>();
  const connectedOutputs = new Set<string>();
  for (const edge of edges) {
    if (edge.target === id) connectedInputs.add(edge.targetHandle || '');
    if (edge.source === id) connectedOutputs.add(edge.sourceHandle || '');
  }

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

  // Get category icon
  const iconName = NODE_CATEGORY_ICONS[def.category];
  const IconComponent = CATEGORY_ICON_MAP[iconName] || Star;

  const headerColor = NODE_COLOR_TAG_COLORS[data.colorTag] || NODE_COLOR_TAG_COLORS.default;
  const isResult = def.id === 'result' || def.id === 'result-pbr';
  const isExternal = def.category === 'external' && def.id === 'image';

  const friendlyName = getFriendlyName(def.id, def.name);
  const showOriginalName = friendlyName !== def.name;

  return (
    <div
      className={cn(
        'rounded-lg shadow-lg border transition-all',
        'bg-zinc-900 min-w-[220px] max-w-[280px]',
        selected ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-zinc-700',
        !data.enabled && 'opacity-50',
      )}
    >
      {/* Header */}
      <div
        className="group/header flex items-center gap-1.5 px-2 py-1.5 cursor-grab rounded-t-lg relative"
        style={{ backgroundColor: headerColor }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleEnabled(); }}
          className="text-white/70 hover:text-white transition-colors"
        >
          {data.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        <IconComponent size={12} className="text-white/80" />
        <span className="text-[11px] font-medium text-white flex-1 truncate select-none">
          {friendlyName}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
          className="text-white/60 hover:text-white"
        >
          <Palette size={10} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleToggleCollapsed(); }} className="text-white/60 hover:text-white">
          {data.collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
        {/* Tooltip showing original technical name */}
        {showOriginalName && (
          <div className="pointer-events-none absolute z-50 opacity-0 group-hover/header:opacity-100 transition-opacity duration-150 text-[10px] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 whitespace-nowrap shadow-lg left-1/2 -translate-x-1/2 -top-7">
            {def.name}
          </div>
        )}
      </div>

      {/* Color tag picker */}
      {showColorPicker && (
        <div className="bg-zinc-800 border-b border-zinc-700">
          <ColorTagPicker current={data.colorTag} onChange={handleColorTag} />
        </div>
      )}

      {/* Body */}
      <div className="py-1.5">
        {/* Input Ports */}
        {def.inputs.length > 0 && (
          <div className="flex flex-col mb-1">
            {def.inputs.map(port => (
              <TypedHandle
                key={port.id}
                type="target"
                position={Position.Left}
                id={port.id}
                dataType={port.dataType}
                label={port.label}
                required={port.required}
                isConnected={connectedInputs.has(port.id)}
              />
            ))}
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
                className="w-full h-16 border border-dashed border-zinc-600 rounded flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
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

        {/* Preview thumbnail — always visible, even when collapsed */}
        {data.preview && !isExternal && (
          <div className="mb-1 mx-2 rounded overflow-hidden border border-zinc-700/50">
            <img
              src={data.preview}
              alt="Preview"
              className="w-full h-auto max-h-16 object-cover"
              draggable={false}
            />
          </div>
        )}

        {/* Parameters (when expanded) */}
        {!data.collapsed && def.parameters.length > 0 && (
          <div className="flex flex-col gap-1.5 py-1 px-2">
            {def.parameters.map(param => (
              <ParameterRenderer
                key={param.id}
                param={param}
                value={data.parameters[param.id] ?? param.defaultValue}
                onChange={handleParamChange}
                definitionId={data.definitionId}
              />
            ))}
          </div>
        )}

        {/* Output Ports */}
        {def.outputs.length > 0 && (
          <div className="flex flex-col mt-1">
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
    </div>
  );
});
