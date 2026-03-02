/**
 * NimzeyNode - Unified node component that renders any node type.
 * Shows friendly names in header with original name as tooltip.
 */

import { memo, useCallback, useState, useEffect, useRef, useContext, createContext } from 'react';
import { NodeProps, Position } from 'reactflow';
import {
  NimzeyNodeData,
  NodeColorTag,
  DataType,
  NODE_COLOR_TAG_COLORS,
  NODE_CATEGORY_ICONS,
  NODE_CATEGORY_COLORS,
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
  Sparkles,
  SlidersHorizontal,
  Calculator,
  Move,
  Image,
  Settings,
  Star,
  Spline,
  Wand2,
  Blend,
} from 'lucide-react';

// Icon lookup by category
const CATEGORY_ICON_MAP: Record<string, React.ComponentType<any>> = {
  Sparkles,
  Layers,
  SlidersHorizontal,
  Wand2,
  Blend,
  Move,
  Calculator,
  Spline,
  Settings,
  Star,
  SplitSquareHorizontal: Layers, // fallback for channels
};

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

  // Get category icon
  const iconName = NODE_CATEGORY_ICONS[def.category];
  const IconComponent = CATEGORY_ICON_MAP[iconName] || Star;

  const headerColor = NODE_COLOR_TAG_COLORS[data.colorTag] || NODE_COLOR_TAG_COLORS.default;
  const isResult = def.id === 'result' || def.id === 'result-pbr';
  const isExternal = def.category === 'utility' && def.id === 'image';

  const friendlyName = getFriendlyName(def.id, def.name);
  const showOriginalName = friendlyName !== def.name;

  // Build header gradient style — category color when default tag, user color tag overrides
  const isDefaultTag = data.colorTag === 'default';
  const categoryColor = NODE_CATEGORY_COLORS[def.category] || '#282828';
  const headerStyle: React.CSSProperties = isDefaultTag
    ? { background: `linear-gradient(90deg, ${categoryColor}66 0%, transparent 70%), #282828` }
    : { background: `linear-gradient(90deg, ${headerColor}55 0%, transparent 70%), #282828` };

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
      {/* Header */}
      <div
        className="group/header flex items-center gap-1.5 px-2.5 py-2 cursor-grab rounded-t-lg relative"
        style={headerStyle}
        onMouseEnter={() => actions.onHeaderHover?.(id, data.definitionId)}
        onMouseLeave={() => actions.onHeaderHoverEnd?.()}
      >
        {/* Icon with subtle circle background */}
        <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
          <IconComponent size={11} className="text-[#d4d4d4]" />
        </div>
        <span className="text-[11px] font-medium text-[#d4d4d4] flex-1 truncate select-none">
          {friendlyName}
        </span>
        {/* Action buttons — visible on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleEnabled(); }}
          className="text-[#666] hover:text-[#d4d4d4] transition-colors opacity-0 group-hover/header:opacity-100"
        >
          {data.enabled ? <Eye size={11} /> : <EyeOff size={11} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
          className="text-[#666] hover:text-[#d4d4d4] transition-colors opacity-0 group-hover/header:opacity-100"
        >
          <Palette size={10} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleToggleCollapsed(); }} className="text-[#666] hover:text-[#d4d4d4] transition-colors">
          {data.collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
        </button>
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

        {/* Preview thumbnail — always visible, even when collapsed */}
        {data.preview && !isExternal && (
          <div className="mb-1 mx-2 rounded overflow-hidden border border-[#2a2a2a]">
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
    </div>
  );
});
