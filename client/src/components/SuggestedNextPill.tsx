/**
 * SuggestedNextPill - Floating row of suggestion pills shown after adding a node.
 * Shows recommended next nodes to connect, auto-dismisses after 5 seconds.
 */

import { useEffect, useState, memo } from 'react';
import { Plus } from 'lucide-react';
import { suggestedConnections } from '@/data/suggestedConnections';
import { getFriendlyName } from '@/data/friendlyNames';
import { NodeRegistry } from '@/registry/nodes';

interface SuggestedNextPillProps {
  nodeId: string;
  definitionId: string;
  nodePosition: { x: number; y: number };
  onSelect: (definitionId: string) => void;
  onDismiss: () => void;
}

export const SuggestedNextPill = memo(function SuggestedNextPill({
  nodeId,
  definitionId,
  nodePosition,
  onSelect,
  onDismiss,
}: SuggestedNextPillProps) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const suggestions = suggestedConnections[definitionId];
  if (!suggestions || suggestions.length === 0 || !visible) return null;

  // Filter to only valid nodes
  const validSuggestions = suggestions
    .filter(id => NodeRegistry.get(id))
    .slice(0, 4);

  if (validSuggestions.length === 0) return null;

  return (
    <div
      className="absolute z-40 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200"
      style={{
        // Position below the node (approximate)
        left: nodePosition.x,
        top: nodePosition.y + 120,
        pointerEvents: 'all',
      }}
    >
      <span className="text-[9px] text-zinc-500 mr-0.5 select-none whitespace-nowrap">Add next:</span>
      {validSuggestions.map(sugId => {
        const def = NodeRegistry.get(sugId);
        if (!def) return null;
        return (
          <button
            key={sugId}
            onClick={() => {
              onSelect(sugId);
              onDismiss();
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-zinc-800/90 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors backdrop-blur-sm whitespace-nowrap"
          >
            <Plus size={9} />
            {getFriendlyName(sugId, def.name)}
          </button>
        );
      })}
    </div>
  );
});
