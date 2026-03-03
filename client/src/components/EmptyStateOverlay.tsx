/**
 * EmptyStateOverlay - Shown when the graph only has the Result node.
 * Provides quick starts: Upload Image, Generate Texture, Start Blank, and starter templates.
 */

import { useRef } from 'react';
import { Upload, Sparkles, MousePointerClick, Waves, Droplets, Layers } from 'lucide-react';
import { graphTemplates } from '@/templates/graphTemplates';

const TEMPLATE_ICONS: Record<string, React.ComponentType<any>> = {
  Waves,
  Droplets,
  Layers,
  Sparkles,
};

interface EmptyStateOverlayProps {
  onUploadImage: (file: File) => void;
  onGenerateTexture: () => void;
  onDismiss: () => void;
  onApplyTemplate?: (templateId: string) => void;
}

export default function EmptyStateOverlay({
  onUploadImage,
  onGenerateTexture,
  onDismiss,
  onApplyTemplate,
}: EmptyStateOverlayProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadImage(file);
    e.target.value = '';
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-center gap-5 p-8 rounded-2xl bg-[#131312]/95 backdrop-blur-sm border border-[#333] shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-100 mb-1">Start Creating</h2>
          <p className="text-xs text-zinc-500">Choose how to begin your filter</p>
        </div>

        {/* Primary actions */}
        <div className="flex gap-3 w-full">
          {/* Upload Image */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/25 hover:border-emerald-500/50 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
              <Upload size={16} />
            </div>
            <div className="text-center">
              <div className="text-xs font-medium">Upload Image</div>
              <div className="text-[9px] text-emerald-500/70 mt-0.5">Apply effects</div>
            </div>
          </button>

          {/* Generate Texture */}
          <button
            onClick={onGenerateTexture}
            className="flex-1 flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-400 hover:bg-purple-600/25 hover:border-purple-500/50 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <Sparkles size={16} />
            </div>
            <div className="text-center">
              <div className="text-xs font-medium">Generate</div>
              <div className="text-[9px] text-purple-500/70 mt-0.5">Procedural noise</div>
            </div>
          </button>

          {/* Start Blank */}
          <button
            onClick={onDismiss}
            className="flex-1 flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-700/30 flex items-center justify-center group-hover:bg-zinc-700/50 transition-colors">
              <MousePointerClick size={16} />
            </div>
            <div className="text-center">
              <div className="text-xs font-medium">Blank</div>
              <div className="text-[9px] text-zinc-500/70 mt-0.5">From scratch</div>
            </div>
          </button>
        </div>

        {/* Templates section */}
        {onApplyTemplate && (
          <>
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">or try a template</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              {graphTemplates.filter(t => t.id !== 'noise-texture').map(template => {
                const Icon = TEMPLATE_ICONS[template.icon] || Waves;
                return (
                  <button
                    key={template.id}
                    onClick={() => onApplyTemplate(template.id)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-zinc-800/40 border border-zinc-700/40 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-left group"
                  >
                    <div className="w-7 h-7 rounded-md bg-[#E0FF29]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#E0FF29]/20 transition-colors">
                      <Icon size={14} className="text-[#E0FF29]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium truncate">{template.name}</div>
                      <div className="text-[9px] text-zinc-500 truncate">{template.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
