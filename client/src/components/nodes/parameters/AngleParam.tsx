/**
 * AngleParam - Circular dial for angle parameters (0-360).
 */

import { memo, useState, useCallback, useRef } from 'react';
import { ParameterDefinition } from '@/types';

interface AngleParamProps {
  param: ParameterDefinition;
  value: number;
  onChange: (value: number) => void;
}

export const AngleParam = memo(function AngleParam({ param, value, onChange }: AngleParamProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const updateAngle = (clientX: number, clientY: number) => {
      const rect = dialRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      onChange(Math.round(angle));
    };

    updateAngle(e.clientX, e.clientY);

    const handleMouseMove = (e: MouseEvent) => updateAngle(e.clientX, e.clientY);
    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [onChange]);

  const rad = (value - 90) * (Math.PI / 180);
  const needleX = 10 + Math.cos(rad) * 7;
  const needleY = 10 + Math.sin(rad) * 7;

  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] text-zinc-400 select-none">{param.label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-300 tabular-nums">{value}&deg;</span>
        <div
          ref={dialRef}
          onMouseDown={handleMouseDown}
          className="w-5 h-5 rounded-full border border-zinc-600 bg-zinc-700 cursor-pointer relative"
        >
          <svg width="20" height="20" className="absolute inset-0">
            <circle cx="10" cy="10" r="7" fill="none" stroke="#52525b" strokeWidth="0.5" />
            <line
              x1="10" y1="10"
              x2={needleX} y2={needleY}
              stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"
            />
            <circle cx="10" cy="10" r="1.5" fill="#3b82f6" />
          </svg>
        </div>
      </div>
    </div>
  );
});
