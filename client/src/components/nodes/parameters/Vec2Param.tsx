/**
 * Vec2Param - 2D coordinate input with X/Y sliders.
 */

import { memo, useCallback } from 'react';
import { ParameterDefinition } from '@/types';

interface Vec2ParamProps {
  param: ParameterDefinition;
  value: number[];
  onChange: (value: number[]) => void;
}

export const Vec2Param = memo(function Vec2Param({ param, value, onChange }: Vec2ParamProps) {
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
      <span className="text-[10px] text-zinc-400 select-none">{param.label}</span>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-500 w-2">X</span>
          <div className="relative flex-1 h-3 flex items-center">
            <div className="absolute w-full h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${percentX}%` }} />
            </div>
            <input
              type="range" min={min} max={max} step={step} value={x}
              onChange={handleXChange}
              className="absolute w-full h-3 opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-[9px] text-zinc-400 w-7 text-right tabular-nums">
            {Math.round(x * 100) / 100}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-500 w-2">Y</span>
          <div className="relative flex-1 h-3 flex items-center">
            <div className="absolute w-full h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: `${percentY}%` }} />
            </div>
            <input
              type="range" min={min} max={max} step={step} value={y}
              onChange={handleYChange}
              className="absolute w-full h-3 opacity-0 cursor-pointer"
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
