/**
 * OptionParam - Dropdown select for option parameters.
 */

import { memo, useCallback } from 'react';
import { ParameterDefinition } from '@/types';
import { ParamLabel } from './ParamLabel';

interface OptionParamProps {
  param: ParameterDefinition;
  value: number | string;
  onChange: (value: number | string) => void;
  hint?: string;
}

export const OptionParam = memo(function OptionParam({ param, value, onChange, hint }: OptionParamProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    // Try to parse as number for numeric options
    const num = Number(v);
    onChange(isNaN(num) ? v : num);
  }, [onChange]);

  return (
    <div className="flex items-center justify-between py-0.5">
      <ParamLabel label={param.label} hint={hint} />
      <select
        value={value}
        onChange={handleChange}
        className="h-5 text-[10px] bg-zinc-700 text-zinc-200 border border-zinc-600 rounded px-1 outline-none focus:border-blue-500 cursor-pointer max-w-[120px]"
      >
        {param.options?.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
});
