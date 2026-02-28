/**
 * IntParam - Filled bar slider for integer parameters (Blender/Substance style).
 * Click-drag to adjust, double-click to type a precise value.
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { ParameterDefinition } from '@/types';

interface IntParamProps {
  param: ParameterDefinition;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
}

export const IntParam = memo(function IntParam({ param, value, onChange, hint }: IntParamProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const min = param.min ?? 0;
  const max = param.max ?? 100;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const parsed = parseInt(editValue, 10);
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
      onChange(Math.max(min, Math.min(max, Math.round(min + pct * (max - min)))));
    };

    updateValue(e.clientX);

    const handleMouseMove = (e: MouseEvent) => updateValue(e.clientX);
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isEditing, min, max, onChange]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(String(value));
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
            {value}
          </span>
        )}
      </div>
    </div>
  );
});
