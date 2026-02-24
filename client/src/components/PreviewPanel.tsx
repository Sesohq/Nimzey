/**
 * PreviewPanel - Displays the rendered output from the GPU pipeline.
 * Shows processed image, quality controls, and export options.
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

  return (
    <div
      className={`flex flex-col bg-zinc-900 border-l border-zinc-800 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={isFullscreen ? undefined : { width }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-sm font-medium text-zinc-200">Preview</span>
        <div className="flex items-center gap-1">
          {isRendering && (
            <Loader2 size={13} className="animate-spin text-blue-400" />
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Quality selector */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-zinc-800">
        {QUALITY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onQualityChange(opt.value)}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              quality === opt.value
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Canvas (hidden, used for rendering) */}
      <canvas
        ref={initCanvas}
        className="hidden"
        width={512}
        height={512}
      />

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center bg-zinc-950 p-4 overflow-auto">
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
          <div className="text-zinc-600 text-sm">
            Connect nodes to see output
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 border-t border-zinc-800">
        <button
          onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
          className="p-1 text-zinc-400 hover:text-zinc-200"
        >
          <ZoomOut size={13} />
        </button>
        <span className="text-[10px] text-zinc-500 w-10 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(z => Math.min(4, z + 0.25))}
          className="p-1 text-zinc-400 hover:text-zinc-200"
        >
          <ZoomIn size={13} />
        </button>
      </div>

      {/* Export controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-zinc-800">
        <select
          value={exportFormat}
          onChange={e => setExportFormat(e.target.value as 'png' | 'jpeg')}
          className="h-6 text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 rounded px-1.5"
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
