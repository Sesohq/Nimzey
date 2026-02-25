/**
 * TypedHandle - Color-coded connection handle based on DataType.
 * Green for Map, Blue for Curve, Gray for Numeric.
 * Includes CSS tooltips showing port type and pulsing animation for unconnected required ports.
 *
 * Key trick: ReactFlow handles default to position:absolute which stacks them.
 * We override to position:relative so they flow with their labels, then use
 * negative margins to push dots to the node edge.
 *
 * Note: We use a pure CSS tooltip instead of Radix Tooltip because Radix's
 * event handlers conflict with ReactFlow's SVG canvas, causing
 * "target.hasAttribute is not a function" errors.
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { DataType, DATA_TYPE_COLORS } from '@/types';
import { cn } from '@/lib/utils';

const DATA_TYPE_LABELS: Record<DataType, string> = {
  [DataType.Map]: 'Map',
  [DataType.Curve]: 'Curve',
  [DataType.Numeric]: 'Numeric',
};

interface TypedHandleProps {
  type: 'source' | 'target';
  position: Position;
  id: string;
  dataType: DataType;
  label?: string;
  required?: boolean;
  isConnected?: boolean;
}

export const TypedHandle = memo(function TypedHandle({
  type,
  position,
  id,
  dataType,
  label,
  required,
  isConnected,
}: TypedHandleProps) {
  const color = DATA_TYPE_COLORS[dataType];
  const isLeft = position === Position.Left;
  const showPulse = required && !isConnected && type === 'target';

  const typeName = DATA_TYPE_LABELS[dataType] || dataType;
  const direction = type === 'target' ? 'input' : 'output';
  const tooltipText = `${typeName} ${direction}${required ? ' (required)' : ''}`;

  return (
    <div
      className={cn(
        'group/handle relative flex items-center py-[2px]',
        isLeft ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      <Handle
        type={type}
        position={position}
        id={id}
        className="!relative !transform-none"
        style={{
          // Override absolute positioning: flow inline instead
          top: 'auto',
          left: 'auto',
          right: 'auto',
          // Visual style - 12px dot with transparent 20px hit area
          width: 12,
          height: 12,
          minWidth: 12,
          minHeight: 12,
          background: isConnected ? color : '#18181b',
          border: `2px solid ${color}`,
          borderRadius: '50%',
          // Push to node edge with overlap
          marginLeft: isLeft ? -7 : 4,
          marginRight: isLeft ? 4 : -7,
          // Larger click target via box-shadow trick
          boxShadow: showPulse
            ? `0 0 0 4px transparent, 0 0 8px 2px ${color}60`
            : `0 0 0 4px transparent`,
          // Pulsing animation for unconnected required ports
          animation: showPulse ? 'portPulse 2s ease-in-out infinite' : 'none',
        }}
      />
      {label && (
        <span
          className={cn(
            'text-[10px] select-none whitespace-nowrap',
            required ? 'text-zinc-300' : 'text-zinc-500',
          )}
        >
          {label}
        </span>
      )}
      {/* Pure CSS tooltip — avoids Radix/ReactFlow conflicts */}
      <div
        className={cn(
          'pointer-events-none absolute z-50 opacity-0 group-hover/handle:opacity-100 transition-opacity duration-150',
          'text-[10px] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 whitespace-nowrap shadow-lg',
          isLeft ? 'right-full mr-2' : 'left-full ml-2',
          'top-1/2 -translate-y-1/2',
        )}
      >
        {tooltipText}
      </div>
    </div>
  );
});
