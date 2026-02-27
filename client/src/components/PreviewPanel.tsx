/**
 * PreviewPanel - Displays the rendered output from the GPU pipeline.
 * Shows processed image, quality controls, and export options.
 * Supports collapsing to a thin sidebar for more canvas space.
 */

import { useState, useCallback, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Maximize2,
  Minimize2,
  Download,
  ZoomIn,
  ZoomOut,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { QualityLevel } from '@/types';

interface PreviewPanelProps {
  width: number;
  processedImage: string | null;
  isRendering: boolean;
  quality: QualityLevel;
  onQualityChange: (quality: QualityLevel) => void;
  onExportImage: (format?: 'png' | 'jpeg') => string | null;
  initCanvas: (canvas: HTMLCanvasElement | null) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

const QUALITY_OPTIONS: { value: QualityLevel; label: string }[] = [
  { value: 'preview', label: 'Preview' },
  { value: 'draft', label: 'Draft' },
  { value: 'full', label: 'Full' },
];

export default function PreviewPanel({
  width,
  processedImage,
  isRendering,
  quality,
  onQualityChange,
  onExportImage,
  initCanvas,
  isCollapsed,
  onToggleCollapse,
  canvasWidth = 512,
  canvasHeight = 512,
}: PreviewPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [zoom, setZoom] = useState(1);

  const handleExport = useCallback(() => {
    const dataUrl = onExportImage(exportFormat);
    if (!dataUrl) return;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `nimzey-export.${exportFormat}`;
    a.click();
  }, [exportFormat, onExportImage]);

  // Hidden canvas always renders regardless of collapse state
  const hiddenCanvas = (
    <canvas
      ref={initCanvas}
      className="hidden"
      width={canvasWidth}
      height={canvasHeight}
    />
  );

  // Collapsed state: thin vertical bar
  if (isCollapsed && !isFullscreen) {
    return (
      <div className="flex flex-col items-center bg-black border-l border-neutral-800 flex-shrink-0 py-2 gap-2"
        style={{ width: 36 }}
      >
        {hiddenCanvas}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-neutral-400 hover:text-white transition-colors"
          title="Expand preview"
        >
          <PanelRightOpen size={14} />
        </button>
        {isRendering && (
          <Loader2 size={12} className="animate-spin text-blue-400" />
        )}
        <span className="text-[9px] text-neutral-500 [writing-mode:vertical-lr] rotate-180 select-none mt-1">
          Preview
        </span>
        {processedImage && (
          <div className="mx-1 mt-auto mb-1 rounded overflow-hidden border border-neutral-700" style={{ width: 28, height: 28 }}>
            <img src={processedImage} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col bg-black border-l border-neutral-800 flex-shrink-0 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={isFullscreen ? undefined : { width }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Preview</span>
          <span className="text-[10px] text-zinc-500 tabular-nums">{canvasWidth} x {canvasHeight}</span>
        </div>
        <div className="flex items-center gap-1">
          {isRendering && (
            <Loader2 size={13} className="animate-spin text-blue-400" />
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
              title="Collapse preview"
            >
              <PanelRightClose size={13} />
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Quality selector */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-neutral-800">
        {QUALITY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onQualityChange(opt.value)}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              quality === opt.value
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-neutral-500 hover:text-neutral-300 border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Canvas (hidden, used for rendering) */}
      {hiddenCanvas}

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center bg-black p-4 overflow-auto">
        {processedImage ? (
          <div
            className="relative"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          >
            {/* Checkerboard background for transparency */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            />
            <img
              src={processedImage}
              alt="Processed output"
              className="relative max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-neutral-600 text-sm">
            Connect nodes to see output
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 border-t border-neutral-800">
        <button
          onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
          className="p-1 text-neutral-400 hover:text-white"
        >
          <ZoomOut size={13} />
        </button>
        <span className="text-[10px] text-neutral-500 w-10 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(z => Math.min(4, z + 0.25))}
          className="p-1 text-neutral-400 hover:text-white"
        >
          <ZoomIn size={13} />
        </button>
      </div>

      {/* Export controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-neutral-800">
        <select
          value={exportFormat}
          onChange={e => setExportFormat(e.target.value as 'png' | 'jpeg')}
          className="h-6 text-[10px] bg-neutral-900 text-neutral-300 border border-neutral-700 rounded px-1.5"
        >
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
        </select>
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-1.5 h-6 text-[10px] bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          <Download size={11} />
          Export
        </button>
      </div>
    </div>
  );
}
