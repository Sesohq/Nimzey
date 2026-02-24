/**
 * ColorParam - Color picker for color/hdrColor parameters.
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { ParameterDefinition } from '@/types';

interface ColorParamProps {
  param: ParameterDefinition;
  value: string;
  onChange: (value: string) => void;
}

export const ColorParam = memo(function ColorParam({ param, value, onChange }: ColorParamProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleSwatchClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] text-zinc-400 select-none">{param.label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-500 tabular-nums">{value}</span>
        <button
          onClick={handleSwatchClick}
          className="w-5 h-5 rounded border border-zinc-600 cursor-pointer shadow-inner"
          style={{ backgroundColor: value }}
        />
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={handleChange}
          className="sr-only"
        />
      </div>
    </div>
  );
});
