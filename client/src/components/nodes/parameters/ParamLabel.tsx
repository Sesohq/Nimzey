/**
 * ParamLabel - Parameter label with optional hint tooltip.
 * Uses pure CSS tooltip to avoid Radix/ReactFlow conflicts.
 */

import { memo } from 'react';
import { HelpCircle } from 'lucide-react';

interface ParamLabelProps {
  label: string;
  hint?: string;
}

export const ParamLabel = memo(function ParamLabel({ label, hint }: ParamLabelProps) {
  return (
    <span className="text-[10px] text-[#888] select-none flex items-center gap-0.5">
      {label}
      {hint && (
        <span className="group/hint relative inline-flex">
          <HelpCircle size={9} className="text-[#555] group-hover/hint:text-[#888] transition-colors cursor-help" />
          <span className="pointer-events-none absolute z-50 opacity-0 group-hover/hint:opacity-100 transition-opacity duration-150 text-[9px] px-2 py-1 rounded bg-[#252525] border border-[#333] text-[#aaa] shadow-lg whitespace-normal max-w-[180px] leading-snug left-full ml-1 top-1/2 -translate-y-1/2">
            {hint}
          </span>
        </span>
      )}
    </span>
  );
});
