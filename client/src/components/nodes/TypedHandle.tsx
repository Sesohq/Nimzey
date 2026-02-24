/**
 * TypedHandle - Color-coded connection handle based on DataType.
 * Green for Map, Blue for Curve, Gray for Numeric.
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { DataType, DATA_TYPE_COLORS } from '@/types';
import { cn } from '@/lib/utils';

interface TypedHandleProps {
  type: 'source' | 'target';
  position: Position;
  id: string;
  dataType: DataType;
  label?: string;
  required?: boolean;
  isConnected?: boolean;
  className?: string;
}

export const TypedHandle = memo(function TypedHandle({
  type,
  position,
  id,
  dataType,
  label,
  required,
  isConnected,
  className,
}: TypedHandleProps) {
  const color = DATA_TYPE_COLORS[dataType];
  const isLeft = position === Position.Left;

  return (
    <div
      className={cn(
        'relative flex items-center',
        isLeft ? 'flex-row' : 'flex-row-reverse',
        'group/handle py-0.5',
        className,
      )}
    >
      <Handle
        type={type}
        position={position}
        id={id}
        className="!w-2.5 !h-2.5 !rounded-full !border-2 !border-zinc-800 transition-all"
        style={{
          backgroundColor: isConnected ? color : 'transparent',
          borderColor: color,
        }}
      />
      {label && (
        <span
          className={cn(
            'text-[10px] text-zinc-400 select-none whitespace-nowrap',
            isLeft ? 'ml-2' : 'mr-2',
            required && 'text-zinc-300',
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
});
