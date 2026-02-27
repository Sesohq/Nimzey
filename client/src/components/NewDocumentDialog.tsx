/**
 * NewDocumentDialog - Photoshop-style "New Document" dialog with dimension presets.
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link2, Link2Off } from 'lucide-react';

export interface NewDocumentResult {
  name: string;
  width: number;
  height: number;
}

interface NewDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (result: NewDocumentResult) => void;
}

const PRESETS = [
  { label: '256 x 256', w: 256, h: 256 },
  { label: '512 x 512', w: 512, h: 512 },
  { label: '1024 x 1024', w: 1024, h: 1024 },
  { label: '2048 x 2048', w: 2048, h: 2048 },
  { label: '1920 x 1080', w: 1920, h: 1080 },
  { label: '3840 x 2160', w: 3840, h: 2160 },
];

export default function NewDocumentDialog({ open, onClose, onCreate }: NewDocumentDialogProps) {
  const [name, setName] = useState('Untitled');
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [lockAspect, setLockAspect] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);

  const handleWidthChange = useCallback((val: number) => {
    const w = Math.max(64, Math.min(4096, val));
    setWidth(w);
    if (lockAspect) {
      setHeight(Math.round(w / aspectRatio));
    }
  }, [lockAspect, aspectRatio]);

  const handleHeightChange = useCallback((val: number) => {
    const h = Math.max(64, Math.min(4096, val));
    setHeight(h);
    if (lockAspect) {
      setWidth(Math.round(h * aspectRatio));
    }
  }, [lockAspect, aspectRatio]);

  const toggleLock = useCallback(() => {
    if (!lockAspect) {
      setAspectRatio(width / height);
    }
    setLockAspect(prev => !prev);
  }, [lockAspect, width, height]);

  const handlePreset = useCallback((w: number, h: number) => {
    setWidth(w);
    setHeight(h);
    setAspectRatio(w / h);
  }, []);

  const handleCreate = useCallback(() => {
    onCreate({ name: name.trim() || 'Untitled', width, height });
    // Reset for next time
    setName('Untitled');
    setWidth(512);
    setHeight(512);
  }, [name, width, height, onCreate]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">New Document</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Set your canvas dimensions and name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Document Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={e => e.target.select()}
              className="h-8 px-3 text-sm bg-zinc-800 border border-zinc-700 rounded-md text-white outline-none focus:border-blue-500"
              placeholder="Untitled"
            />
          </div>

          {/* Dimensions */}
          <div className="flex items-end gap-2">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Width</label>
              <input
                type="number"
                value={width}
                onChange={e => handleWidthChange(parseInt(e.target.value) || 64)}
                className="h-8 px-3 text-sm bg-zinc-800 border border-zinc-700 rounded-md text-white outline-none focus:border-blue-500 tabular-nums"
                min={64}
                max={4096}
              />
            </div>
            <button
              onClick={toggleLock}
              className={`h-8 w-8 flex items-center justify-center rounded-md border transition-colors ${
                lockAspect
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
              }`}
              title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            >
              {lockAspect ? <Link2 size={14} /> : <Link2Off size={14} />}
            </button>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Height</label>
              <input
                type="number"
                value={height}
                onChange={e => handleHeightChange(parseInt(e.target.value) || 64)}
                className="h-8 px-3 text-sm bg-zinc-800 border border-zinc-700 rounded-md text-white outline-none focus:border-blue-500 tabular-nums"
                min={64}
                max={4096}
              />
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400">Presets</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p.w, p.h)}
                  className={`h-7 text-[11px] rounded border transition-colors ${
                    width === p.w && height === p.h
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
