/**
 * IntParam - Integer slider with step=1.
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { ParameterDefinition } from '@/types';
import { ParamLabel } from './ParamLabel';

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

  const min = param.min ?? 0;
  const max = param.max ?? 100;

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Math.round(parseFloat(e.target.value)));
  }, [onChange]);

  const startEditing = useCallback(() => {
    setEditValue(String(value));
    setIsEditing(true);
  }, [value]);

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

  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <ParamLabel label={param.label} hint={hint} />
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
            {value}
          </span>
        )}
      </div>
      <div className="relative h-4 flex items-center group nodrag nowheel">
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
          step={1}
          value={value}
          onChange={handleSliderChange}
          className="absolute w-full h-4 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
});
