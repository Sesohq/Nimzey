/**
 * FloatParam - Slider + editable number input for float parameters.
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { ParameterDefinition } from '@/types';

interface FloatParamProps {
  param: ParameterDefinition;
  value: number;
  onChange: (value: number) => void;
}

export const FloatParam = memo(function FloatParam({ param, value, onChange }: FloatParamProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const min = param.min ?? 0;
  const max = param.max ?? 100;
  const step = param.step ?? (max - min) / 200;

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  }, [onChange]);

  const startEditing = useCallback(() => {
    setEditValue(String(Math.round(value * 1000) / 1000));
    setIsEditing(true);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
    }
    setIsEditing(false);
  }, [editValue, min, max, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setIsEditing(false);
  }, [commitEdit]);

  // Calculate percentage for slider fill
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-400 select-none">{param.label}</span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-14 h-4 text-[10px] text-right bg-zinc-700 text-zinc-200 border border-zinc-600 rounded px-1 outline-none focus:border-blue-500"
          />
        ) : (
          <span
            className="text-[10px] text-zinc-300 cursor-pointer hover:text-white select-none tabular-nums"
            onClick={startEditing}
          >
            {Math.round(value * 100) / 100}
          </span>
        )}
      </div>
      <div className="relative h-4 flex items-center group">
        <div className="absolute w-full h-[3px] bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div
          className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-zinc-900 shadow-sm pointer-events-none transition-transform group-hover:scale-110"
          style={{ left: `calc(${percent}% - 6px)` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="absolute w-full h-4 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
});
