/**
 * SuggestedNextPill - Floating row of suggestion pills shown on node title hover.
 * Shows recommended next nodes to connect.
 */

import { memo } from 'react';
import { Plus } from 'lucide-react';
import { suggestedConnections } from '@/data/suggestedConnections';
import { getFriendlyName } from '@/data/friendlyNames';
import { NodeRegistry } from '@/registry/nodes';

interface SuggestedNextPillProps {
  definitionId: string;
  nodePosition: { x: number; y: number };
  onSelect: (definitionId: string) => void;
}

export const SuggestedNextPill = memo(function SuggestedNextPill({
  definitionId,
  nodePosition,
  onSelect,
}: SuggestedNextPillProps) {
  const suggestions = suggestedConnections[definitionId];
  if (!suggestions || suggestions.length === 0) return null;

  // Filter to only valid nodes
  const validSuggestions = suggestions
    .filter(id => NodeRegistry.get(id))
    .slice(0, 3);

  if (validSuggestions.length === 0) return null;

  return (
    <div
      className="absolute z-40 flex items-center gap-1 animate-in fade-in duration-150"
      style={{
        left: nodePosition.x,
        top: nodePosition.y,
        pointerEvents: 'all',
      }}
      // Prevent the pills themselves from triggering hover-end on the canvas
      onMouseEnter={(e) => e.stopPropagation()}
    >
      {validSuggestions.map(sugId => {
        const def = NodeRegistry.get(sugId);
        if (!def) return null;
        return (
          <button
            key={sugId}
            onClick={() => onSelect(sugId)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[#1e1e1e]/90 border border-[#2e2e2e] text-[#aaa] hover:bg-[#252525] hover:text-[#d4d4d4] transition-colors backdrop-blur-sm whitespace-nowrap shadow-lg"
          >
            <Plus size={9} />
            {getFriendlyName(sugId, def.name)}
          </button>
        );
      })}
    </div>
  );
});
