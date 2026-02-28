/**
 * PreviewPanel - Floating navigator panel (Photoshop-style).
 * Sits in the bottom-right corner, always visible but compact.
 * Collapse to a small icon button, expand for full preview + controls.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  Eye,
} from 'lucide-react';
import { QualityLevel } from '@/types';

interface PreviewPanelProps {
  processedImage: string | null;
  isRendering: boolean;
  quality: QualityLevel;
  onQualityChange: (quality: QualityLevel) => void;
  onExportImage: (format?: 'png' | 'jpeg') => string | null;
  initCanvas: (canvas: HTMLCanvasElement | null) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

const QUALITY_OPTIONS: { value: QualityLevel; label: string; short: string }[] = [
  { value: 'preview', label: 'Preview', short: 'P' },
  { value: 'draft', label: 'Draft', short: 'D' },
  { value: 'full', label: 'Full', short: 'F' },
];

export default function PreviewPanel({
  processedImage,
  isRendering,
  quality,
  onQualityChange,
  onExportImage,
  initCanvas,
  canvasWidth = 512,
  canvasHeight = 512,
}: PreviewPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');

  // Escape key exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen]);

  const handleExport = useCallback(() => {
    const dataUrl = onExportImage(exportFormat);
    if (!dataUrl) return;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `nimzey-export.${exportFormat}`;
    a.click();
  }, [exportFormat, onExportImage]);

  // Hidden canvas always renders regardless of state
  const hiddenCanvas = (
    <canvas
      ref={initCanvas}
      className="hidden"
      width={canvasWidth}
      height={canvasHeight}
    />
  );

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
        {hiddenCanvas}
        {/* Close bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3">
          <span className="text-[11px] text-[#888] tabular-nums">{canvasWidth} × {canvasHeight}</span>
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-1.5 text-[#888] hover:text-white transition-colors"
          >
            <Minimize2 size={16} />
          </button>
        </div>
        {/* Image */}
        {processedImage ? (
          <img
            src={processedImage}
            alt="Preview"
            className="max-w-[90vw] max-h-[85vh] object-contain"
            draggable={false}
          />
        ) : (
          <span className="text-[#555] text-sm">No output</span>
        )}
      </div>
    );
  }

  // Collapsed: small floating button with tiny thumbnail
  if (isCollapsed) {
    return (
      <>
        {hiddenCanvas}
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed bottom-4 right-4 z-40 rounded-lg bg-[#1e1e1e] border border-[#2e2e2e] shadow-xl hover:border-[#444] transition-all group overflow-hidden"
          title="Show preview"
          style={{ width: 44, height: 44 }}
        >
          {processedImage ? (
            <img src={processedImage} alt="Preview" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Eye size={16} className="text-[#666] group-hover:text-[#aaa] transition-colors m-auto" />
          )}
          {isRendering && (
            <div className="absolute top-0.5 right-0.5">
              <Loader2 size={8} className="animate-spin text-[#6b8aaf]" />
            </div>
          )}
        </button>
      </>
    );
  }

  // Expanded: floating navigator panel
  return (
    <>
      {hiddenCanvas}
      <div className="fixed bottom-4 right-4 z-40 w-[280px] rounded-lg bg-[#1e1e1e] border border-[#2e2e2e] shadow-2xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#2a2a2a] cursor-default">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[#d4d4d4] select-none">Preview</span>
            <span className="text-[9px] text-[#666] tabular-nums select-none">{canvasWidth}×{canvasHeight}</span>
            {isRendering && (
              <Loader2 size={10} className="animate-spin text-[#6b8aaf]" />
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-1 text-[#555] hover:text-[#d4d4d4] transition-colors"
              title="Fullscreen"
            >
              <Maximize2 size={10} />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 text-[#555] hover:text-[#d4d4d4] transition-colors"
              title="Collapse"
            >
              <Minimize2 size={10} />
            </button>
          </div>
        </div>

        {/* Preview image */}
        <div
          className="relative bg-[#0a0a0a] cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        >
          {processedImage ? (
            <>
              {/* Checkerboard for transparency */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)',
                  backgroundSize: '12px 12px',
                  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                }}
              />
              <img
                src={processedImage}
                alt="Preview"
                className="relative w-full h-auto"
                draggable={false}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-[#444] text-[10px] select-none">
              Connect nodes to see output
            </div>
          )}
        </div>

        {/* Bottom toolbar: quality + export */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 border-t border-[#2a2a2a]">
          {/* Quality pills */}
          {QUALITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onQualityChange(opt.value)}
              className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
                quality === opt.value
                  ? 'bg-[#6b8aaf]/20 text-[#6b8aaf] border border-[#6b8aaf]/30'
                  : 'text-[#666] hover:text-[#aaa] border border-transparent'
              }`}
              title={opt.label}
            >
              {opt.label}
            </button>
          ))}

          <div className="flex-1" />

          {/* Export controls */}
          <select
            value={exportFormat}
            onChange={e => setExportFormat(e.target.value as 'png' | 'jpeg')}
            className="h-5 text-[9px] bg-[#252525] text-[#888] border border-[#333] rounded px-1 outline-none focus:border-[#6b8aaf]"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 h-5 px-2 text-[9px] bg-[#6b8aaf]/20 hover:bg-[#6b8aaf]/30 text-[#6b8aaf] rounded transition-colors"
          >
            <Download size={9} />
            Export
          </button>
        </div>
      </div>
    </>
  );
}
