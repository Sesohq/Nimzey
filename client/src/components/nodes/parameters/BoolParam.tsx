/**
 * BoolParam - Toggle switch for boolean parameters.
 */

import { memo, useCallback } from 'react';
import { ParameterDefinition } from '@/types';

interface BoolParamProps {
  param: ParameterDefinition;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const BoolParam = memo(function BoolParam({ param, value, onChange }: BoolParamProps) {
  const toggle = useCallback(() => onChange(!value), [value, onChange]);

  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] text-zinc-400 select-none">{param.label}</span>
      <button
        onClick={toggle}
        className={`
          w-7 h-3.5 rounded-full transition-colors relative cursor-pointer
          ${value ? 'bg-blue-500' : 'bg-zinc-600'}
        `}
      >
        <div
          className={`
            absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform
            ${value ? 'translate-x-3.5' : 'translate-x-0.5'}
          `}
        />
      </button>
    </div>
  );
});
