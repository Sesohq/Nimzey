/**
 * NodeContextMenu - Right-click context menu for nodes.
 * Shows "Bake to Image" to capture the node's output and create an image node.
 */

import { useEffect, useRef } from 'react';
import { ImagePlus, Maximize2, Trash2 } from 'lucide-react';

interface NodeContextMenuProps {
  /** Screen-relative position of the menu */
  position: { x: number; y: number };
  /** The node ID that was right-clicked */
  nodeId: string;
  /** The definition ID of the right-clicked node */
  definitionId: string;
  /** Called when "Bake to Image" is selected */
  onBakeToImage: (nodeId: string) => void;
  /** Called when "Focus Node" is selected */
  onFocus?: (nodeId: string) => void;
  /** Called when "Delete" is selected */
  onDelete: (nodeId: string) => void;
  /** Called when menu should close */
  onClose: () => void;
}

export default function NodeContextMenu({
  position,
  nodeId,
  definitionId,
  onBakeToImage,
  onFocus,
  onDelete,
  onClose,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Delay to avoid the contextmenu event from closing immediately
    requestAnimationFrame(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEscape);
    });
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position so menu doesn't overflow viewport
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw - 8) {
      menuRef.current.style.left = `${Math.max(8, vw - rect.width - 8)}px`;
    }
    if (rect.bottom > vh - 8) {
      menuRef.current.style.top = `${Math.max(8, vh - rect.height - 8)}px`;
    }
  }, []);

  // Don't show "Bake to Image" on result nodes (nothing to bake) or image nodes (already an image)
  const canBake = definitionId !== 'result' && definitionId !== 'result-pbr';
  // Don't allow deleting the result node
  const canDelete = definitionId !== 'result' && definitionId !== 'result-pbr';

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl py-1.5 min-w-[170px]"
      style={{ left: position.x, top: position.y }}
    >
      {canBake && (
        <button
          className="w-full text-left px-3 py-2 text-[11px] text-[#ccc] hover:bg-[#2a2a2a] hover:text-white transition-colors flex items-center gap-2.5"
          onClick={() => {
            onBakeToImage(nodeId);
            onClose();
          }}
        >
          <ImagePlus size={13} className="text-emerald-400" />
          Bake to Image
        </button>
      )}

      {canBake && onFocus && (
        <button
          className="w-full text-left px-3 py-2 text-[11px] text-[#ccc] hover:bg-[#2a2a2a] hover:text-white transition-colors flex items-center gap-2.5"
          onClick={() => {
            onFocus(nodeId);
            onClose();
          }}
        >
          <Maximize2 size={13} className="text-blue-400/70" />
          Focus Node
        </button>
      )}

      {canDelete && (
        <button
          className="w-full text-left px-3 py-2 text-[11px] text-[#ccc] hover:bg-[#2a2a2a] hover:text-red-400 transition-colors flex items-center gap-2.5"
          onClick={() => {
            onDelete(nodeId);
            onClose();
          }}
        >
          <Trash2 size={13} className="text-red-400/60" />
          Delete Node
        </button>
      )}

      {!canBake && !canDelete && (
        <div className="px-3 py-2 text-[11px] text-[#666]">
          No actions available
        </div>
      )}
    </div>
  );
}
