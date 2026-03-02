/**
 * NodeFocusOverlay - Split-screen focus mode for a single node.
 * Left panel: node header + parameter controls at comfortable size.
 * Right panel: live preview with zoom/pan of the node's output texture.
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { NodeRegistry } from '@/registry/nodes';
import { getFriendlyName } from '@/data/friendlyNames';
import { ParameterRenderer } from './nodes/parameters/ParameterRenderer';
import { GraphState } from '@/stores/graphStore';
import {
  NODE_CATEGORY_ICONS,
  NODE_CATEGORY_COLORS,
} from '@/types';
import {
  X,
  Eye,
  EyeOff,
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
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

// Same icon map used by NimzeyNode
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
  SplitSquareHorizontal: Layers,
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 16;

interface NodeFocusOverlayProps {
  nodeId: string;
  graphState: GraphState;
  onParameterChange: (nodeId: string, paramId: string, value: number | string | boolean | number[]) => void;
  onToggleEnabled: (nodeId: string) => void;
  blitNodeToCanvas: (nodeId: string, targetCanvas: HTMLCanvasElement) => boolean;
  structuralVersion: number;
  onClose: () => void;
}

export const NodeFocusOverlay = memo(function NodeFocusOverlay({
  nodeId,
  graphState,
  onParameterChange,
  onToggleEnabled,
  blitNodeToCanvas,
  structuralVersion,
  onClose,
}: NodeFocusOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [hasContent, setHasContent] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Zoom/pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const node = graphState.nodes.get(nodeId);
  const def = node ? NodeRegistry.get(node.definitionId) : null;

  // Auto-close if the node is deleted
  useEffect(() => {
    if (!node) onClose();
  }, [node, onClose]);

  // GPU-accelerated preview: blit node texture directly to our canvas (no readPixels)
  useEffect(() => {
    if (!node || !canvasRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (canvasRef.current) {
        const t0 = performance.now();
        const ok = blitNodeToCanvas(nodeId, canvasRef.current);
        if (ok) {
          console.debug(`[FocusPreview] GPU blit: ${(performance.now() - t0).toFixed(1)}ms`);
          setHasContent(true);
        }
      }
    }, 50);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nodeId, structuralVersion, blitNodeToCanvas, node]);

  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  // Scroll-to-zoom (centered on mouse position)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const container = previewContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    // Mouse position relative to container center
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;

    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;

    setZoom(prev => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor));
      const scale = next / prev;
      // Adjust pan so zoom centers on mouse position
      setPan(p => ({
        x: mx - scale * (mx - p.x),
        y: my - scale * (my - p.y),
      }));
      return next;
    });
  }, []);

  // Drag-to-pan
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only pan on left-click or middle-click
    if (e.button > 1) return;
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  if (!node || !def) return null;

  const friendlyName = getFriendlyName(def.id, def.name);
  const iconName = NODE_CATEGORY_ICONS[def.category];
  const IconComponent = CATEGORY_ICON_MAP[iconName] || Star;
  const categoryColor = NODE_CATEGORY_COLORS[def.category] || '#282828';

  const handleParamChange = useCallback(
    (paramId: string, value: number | string | boolean | number[]) => {
      onParameterChange(nodeId, paramId, value);
    },
    [nodeId, onParameterChange],
  );

  const handleToggle = useCallback(() => {
    onToggleEnabled(nodeId);
  }, [nodeId, onToggleEnabled]);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.80)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] rounded-xl border border-[#333] shadow-2xl flex overflow-hidden"
        style={{ width: '90vw', maxWidth: '1200px', height: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Panel — Controls */}
        <div className="flex flex-col border-r border-[#2a2a2a]" style={{ width: '40%' }}>
          {/* Header */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 border-b border-[#2a2a2a]"
            style={{ background: `linear-gradient(90deg, ${categoryColor}44 0%, transparent 70%), #222` }}
          >
            <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
              <IconComponent size={15} className="text-[#d4d4d4]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-[#d4d4d4] truncate">{friendlyName}</div>
              {friendlyName !== def.name && (
                <div className="text-[10px] text-[#666] truncate">{def.name}</div>
              )}
            </div>
            <button
              onClick={handleToggle}
              className="text-[#888] hover:text-[#d4d4d4] transition-colors p-1 rounded hover:bg-white/5"
            >
              {node.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>

          {/* Parameters */}
          <div className="flex-1 overflow-y-auto p-4">
            {def.parameters.length > 0 ? (
              <div className="flex flex-col gap-3">
                {def.parameters.map(param => (
                  <ParameterRenderer
                    key={param.id}
                    param={param}
                    value={node.parameters[param.id] ?? param.defaultValue}
                    onChange={handleParamChange}
                    definitionId={node.definitionId}
                  />
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[#555] text-center py-8">
                No adjustable parameters
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Preview */}
        <div className="flex-1 flex flex-col bg-[#111]">
          {/* Preview header with zoom controls and close button */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#666]">Node Output Preview</span>
              {zoom !== 1 && (
                <span className="text-[10px] text-[#555] font-mono">{zoomPercent}%</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(z => Math.max(MIN_ZOOM, z / 1.5))}
                className="text-[#555] hover:text-[#d4d4d4] transition-colors p-1 rounded hover:bg-white/5"
                title="Zoom out"
              >
                <ZoomOut size={13} />
              </button>
              <button
                onClick={() => setZoom(z => Math.min(MAX_ZOOM, z * 1.5))}
                className="text-[#555] hover:text-[#d4d4d4] transition-colors p-1 rounded hover:bg-white/5"
                title="Zoom in"
              >
                <ZoomIn size={13} />
              </button>
              {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
                <button
                  onClick={resetView}
                  className="text-[#555] hover:text-[#d4d4d4] transition-colors p-1 rounded hover:bg-white/5"
                  title="Reset zoom (double-click preview)"
                >
                  <RotateCcw size={13} />
                </button>
              )}
              <div className="w-px h-3 bg-[#333] mx-1" />
              <button
                onClick={onClose}
                className="text-[#666] hover:text-[#d4d4d4] transition-colors p-1 rounded hover:bg-white/5"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Preview canvas with zoom/pan (GPU-accelerated) */}
          <div
            ref={previewContainerRef}
            className="flex-1 overflow-hidden relative"
            style={{
              backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              backgroundColor: '#151515',
              cursor: isDraggingRef.current ? 'grabbing' : 'grab',
            }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={resetView}
          >
            {/* Centered canvas with transform for zoom/pan */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ pointerEvents: 'none' }}
            >
              <canvas
                ref={canvasRef}
                className="max-w-[90%] max-h-[90%] rounded"
                style={{
                  objectFit: 'contain',
                  display: hasContent ? 'block' : 'none',
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  imageRendering: zoom > 3 ? 'pixelated' : 'auto',
                }}
              />
            </div>
            {!hasContent && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[12px] text-[#555]">Rendering...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
