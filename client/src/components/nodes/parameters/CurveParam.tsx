/**
 * CurveParam - Simple bezier curve editor for curve parameters.
 * Displays a small interactive curve widget with draggable control points.
 */

import { memo, useState, useCallback, useRef } from 'react';
import { ParameterDefinition } from '@/types';
import { ParamLabel } from './ParamLabel';

interface CurveParamProps {
  param: ParameterDefinition;
  value: number[];
  onChange: (value: number[]) => void;
  hint?: string;
}

// Default identity curve: [x1, y1, x2, y2] = [0.25, 0.25, 0.75, 0.75]
const DEFAULT_CURVE = [0.25, 0.25, 0.75, 0.75];

export const CurveParam = memo(function CurveParam({ param, value, onChange, hint }: CurveParamProps) {
  const v = (value && value.length >= 4) ? value : DEFAULT_CURVE;
  const [dragging, setDragging] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 80;
  const H = 60;
  const PAD = 4;

  const toSvg = (nx: number, ny: number) => ({
    x: PAD + nx * (W - 2 * PAD),
    y: H - PAD - ny * (H - 2 * PAD),
  });

  const fromSvg = (sx: number, sy: number) => ({
    x: Math.max(0, Math.min(1, (sx - PAD) / (W - 2 * PAD))),
    y: Math.max(0, Math.min(1, (H - PAD - sy) / (H - 2 * PAD))),
  });

  const p0 = toSvg(0, 0);
  const p1 = toSvg(v[0], v[1]);
  const p2 = toSvg(v[2], v[3]);
  const p3 = toSvg(1, 1);

  const handleMouseDown = useCallback((pointIndex: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(pointIndex);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { x, y } = fromSvg(e.clientX - rect.left, e.clientY - rect.top);
      const next = [...v];
      if (pointIndex === 0) { next[0] = x; next[1] = y; }
      else { next[2] = x; next[3] = y; }
      onChange(next);
    };

    const handleMouseUp = () => {
      setDragging(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [v, onChange]);

  return (
    <div className="flex flex-col gap-1">
      <ParamLabel label={param.label} hint={hint} />
      <svg
        ref={svgRef}
        width={W}
        height={H}
        className="bg-zinc-800 rounded border border-zinc-700 cursor-crosshair"
      >
        {/* Grid */}
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#3f3f46" strokeWidth="0.5" />
        <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} stroke="#3f3f46" strokeWidth="0.5" />
        {/* Identity line */}
        <line x1={p0.x} y1={p0.y} x2={p3.x} y2={p3.y} stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2,2" />
        {/* Control lines */}
        <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="#52525b" strokeWidth="0.5" />
        <line x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} stroke="#52525b" strokeWidth="0.5" />
        {/* Curve */}
        <path
          d={`M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
        {/* Control points */}
        <circle
          cx={p1.x} cy={p1.y} r={3}
          fill={dragging === 0 ? '#60a5fa' : '#3b82f6'}
          stroke="#1e3a5f"
          strokeWidth="1"
          className="cursor-grab"
          onMouseDown={handleMouseDown(0)}
        />
        <circle
          cx={p2.x} cy={p2.y} r={3}
          fill={dragging === 1 ? '#60a5fa' : '#3b82f6'}
          stroke="#1e3a5f"
          strokeWidth="1"
          className="cursor-grab"
          onMouseDown={handleMouseDown(1)}
        />
      </svg>
    </div>
  );
});
