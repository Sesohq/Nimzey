/**
 * BoolParam - Toggle switch for boolean parameters.
 */

import { memo, useCallback } from 'react';
import { ParameterDefinition } from '@/types';
import { ParamLabel } from './ParamLabel';

interface BoolParamProps {
  param: ParameterDefinition;
  value: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}

export const BoolParam = memo(function BoolParam({ param, value, onChange, hint }: BoolParamProps) {
  const toggle = useCallback(() => onChange(!value), [value, onChange]);

  return (
    <div className="flex items-center justify-between py-0.5">
      <ParamLabel label={param.label} hint={hint} />
      <button
        onClick={toggle}
        className={`
          w-7 h-3.5 rounded-full transition-colors relative cursor-pointer
          ${value ? 'bg-[#6b8aaf]' : 'bg-[#333]'}
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
