/**
 * Vec2Param - Dual filled bar sliders for X/Y coordinates (Blender/Substance style).
 * Click-drag to adjust, double-click to type a precise value.
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { ParameterDefinition } from '@/types';
import { ParamLabel } from './ParamLabel';

interface Vec2ParamProps {
  param: ParameterDefinition;
  value: number[];
  onChange: (value: number[]) => void;
  hint?: string;
}

export const Vec2Param = memo(function Vec2Param({ param, value, onChange, hint }: Vec2ParamProps) {
  const x = value[0] ?? 0.5;
  const y = value[1] ?? 0.5;
  const min = param.min ?? 0;
  const max = param.max ?? 1;
  const step = param.step ?? 0.01;

  const [editingAxis, setEditingAxis] = useState<'x' | 'y' | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const xBarRef = useRef<HTMLDivElement>(null);
  const yBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingAxis && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingAxis]);

  const commitEdit = useCallback(() => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      if (editingAxis === 'x') onChange([clamped, y]);
      else if (editingAxis === 'y') onChange([x, clamped]);
    }
    setEditingAxis(null);
  }, [editValue, editingAxis, min, max, x, y, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditingAxis(null);
  }, [commitEdit]);

  // Custom drag handlers for each axis bar
  const makeMouseDown = useCallback((axis: 'x' | 'y', barRef: React.RefObject<HTMLDivElement>) => (e: React.MouseEvent) => {
    if (editingAxis) return;
    e.preventDefault();

    const updateValue = (clientX: number) => {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + pct * (max - min);
      const stepped = Math.round(raw / step) * step;
      const clamped = Math.max(min, Math.min(max, stepped));
      if (axis === 'x') onChange([clamped, y]);
      else onChange([x, clamped]);
    };

    updateValue(e.clientX);

    const handleMouseMove = (e: MouseEvent) => updateValue(e.clientX);
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [editingAxis, min, max, step, x, y, onChange]);

  const makeDoubleClick = useCallback((axis: 'x' | 'y') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(String(Math.round((axis === 'x' ? x : y) * 1000) / 1000));
    setEditingAxis(axis);
  }, [x, y]);

  const percentX = ((x - min) / (max - min)) * 100;
  const percentY = ((y - min) / (max - min)) * 100;

  const renderBar = (axis: 'x' | 'y', val: number, percent: number, barRef: React.RefObject<HTMLDivElement>, fillColor: string) => (
    <div
      ref={barRef}
      className="relative h-5 rounded bg-[#1a1a1a] overflow-hidden cursor-ew-resize nodrag nowheel"
      onMouseDown={makeMouseDown(axis, barRef)}
      onDoubleClick={makeDoubleClick(axis)}
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{ width: `${percent}%`, backgroundColor: fillColor }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <span className="text-[10px] text-[#888] select-none">{axis.toUpperCase()}</span>
        {editingAxis === axis ? (
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
            {Math.round(val * 100) / 100}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-1">
      <ParamLabel label={param.label} hint={hint} />
      {renderBar('x', x, percentX, xBarRef, '#5a4a4a')}
      {renderBar('y', y, percentY, yBarRef, '#4a4a5a')}
    </div>
  );
});
