/**
 * Vec2Param - 2D coordinate input with X/Y sliders.
 */

import { memo, useCallback } from 'react';
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

  const handleXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange([parseFloat(e.target.value), y]);
  }, [y, onChange]);

  const handleYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange([x, parseFloat(e.target.value)]);
  }, [x, onChange]);

  const percentX = ((x - min) / (max - min)) * 100;
  const percentY = ((y - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1">
      <ParamLabel label={param.label} hint={hint} />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-500 w-2">X</span>
          <div className="relative flex-1 h-4 flex items-center group">
            <div className="absolute w-full h-[3px] bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${percentX}%` }} />
            </div>
            <div
              className="absolute w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-zinc-900 shadow-sm pointer-events-none transition-transform group-hover:scale-110"
              style={{ left: `calc(${percentX}% - 5px)` }}
            />
            <input
              type="range" min={min} max={max} step={step} value={x}
              onChange={handleXChange}
              className="absolute w-full h-4 opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-[9px] text-zinc-400 w-7 text-right tabular-nums">
            {Math.round(x * 100) / 100}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-500 w-2">Y</span>
          <div className="relative flex-1 h-4 flex items-center group">
            <div className="absolute w-full h-[3px] bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: `${percentY}%` }} />
            </div>
            <div
              className="absolute w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-zinc-900 shadow-sm pointer-events-none transition-transform group-hover:scale-110"
              style={{ left: `calc(${percentY}% - 5px)` }}
            />
            <input
              type="range" min={min} max={max} step={step} value={y}
              onChange={handleYChange}
              className="absolute w-full h-4 opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-[9px] text-zinc-400 w-7 text-right tabular-nums">
            {Math.round(y * 100) / 100}
          </span>
        </div>
      </div>
    </div>
  );
});
