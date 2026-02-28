/**
 * FloatParam - Filled bar slider with label+value overlaid (Blender/Substance style).
 * Click-drag to adjust, double-click to type a precise value.
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { ParameterDefinition } from '@/types';

interface FloatParamProps {
  param: ParameterDefinition;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
}

export const FloatParam = memo(function FloatParam({ param, value, onChange, hint }: FloatParamProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const min = param.min ?? 0;
  const max = param.max ?? 100;
  const step = param.step ?? (max - min) / 200;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
    setIsEditing(false);
  }, [editValue, min, max, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setIsEditing(false);
  }, [commitEdit]);

  // Custom drag handler for the filled bar
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();

    const updateValue = (clientX: number) => {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + pct * (max - min);
      const stepped = Math.round(raw / step) * step;
      onChange(Math.max(min, Math.min(max, stepped)));
    };

    updateValue(e.clientX);

    const handleMouseMove = (e: MouseEvent) => updateValue(e.clientX);
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isEditing, min, max, step, onChange]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(String(Math.round(value * 1000) / 1000));
    setIsEditing(true);
  }, [value]);

  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={barRef}
      className="relative h-5 rounded bg-[#1a1a1a] overflow-hidden cursor-ew-resize nodrag nowheel"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Fill bar */}
      <div
        className="absolute inset-y-0 left-0 bg-[#4a4a4a]"
        style={{ width: `${percent}%` }}
      />
      {/* Label + Value overlaid */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <span className="text-[10px] text-[#aaa] select-none truncate">{param.label}</span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-14 h-4 text-[10px] text-right bg-[#252525] text-[#d4d4d4] border border-[#444] rounded px-1 outline-none focus:border-[#6b8aaf] pointer-events-auto"
          />
        ) : (
          <span className="text-[10px] text-[#d4d4d4] select-none tabular-nums">
            {Math.round(value * 100) / 100}
          </span>
        )}
      </div>
    </div>
  );
});
