/**
 * NodeThumbnail.tsx
 * 
 * Component for displaying node preview thumbnails with offline canvas support.
 * Provides a consistent interface for node preview rendering across the application.
 */
import { useEffect, useRef, useState } from 'react';
import { FilterType } from '@/types';

interface NodeThumbnailProps {
  nodeId: string;
  filterType: FilterType;
  size?: number;
  className?: string;
  isLocked?: boolean;
  onToggleLock?: () => void;
  showLockControls?: boolean;
}

export default function NodeThumbnail({
  nodeId,
  filterType,
  size = 120,
  className = '',
  isLocked = false,
  onToggleLock,
  showLockControls = true
}: NodeThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Set up the canvas on mount
  useEffect(() => {
    if (canvasRef.current) {
      // Register this canvas with the global thumbnail system
      if (!window.nodeThumbnails) {
        window.nodeThumbnails = {};
      }
      window.nodeThumbnails[nodeId] = canvasRef.current;
      
      // Clean up on unmount
      return () => {
        if (window.nodeThumbnails) {
          delete window.nodeThumbnails[nodeId];
        }
      };
    }
  }, [nodeId]);
  
  // Listen for thumbnail updates
  useEffect(() => {
    const handleThumbnailUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.nodeId === nodeId && e.detail.preview) {
        setThumbnail(e.detail.preview);
      }
    };
    
    // Add event listener for our custom event
    window.addEventListener('node-preview-updated' as any, handleThumbnailUpdate);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('node-preview-updated' as any, handleThumbnailUpdate);
    };
  }, [nodeId]);
  
  const handleRequestPreview = () => {
    if (isLocked) return;
    
    // Signal for a new preview
    if (window.updateNodePreview) {
      window.updateNodePreview(nodeId);
    } else {
      // Fallback - trigger preview update through DOM events
      const event = new CustomEvent('request-node-preview', { 
        detail: { nodeId } 
      });
      window.dispatchEvent(event);
    }
  };
  
  const filterIcon = getFilterIcon(filterType);
  
  return (
    <div 
      className={`relative ${className}`} 
      style={{ width: size, height: size }}
      onClick={handleRequestPreview}
    >
      <canvas 
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        data-node-id={nodeId}
      />
      
      {thumbnail ? (
        <img 
          src={thumbnail} 
          alt={`${filterType} preview`}
          className="absolute top-0 left-0 w-full h-full object-cover"
          style={{ display: canvasRef.current ? 'none' : 'block' }}
        />
      ) : (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-700">
          <span className="text-gray-400">{filterIcon}</span>
        </div>
      )}
      
      {showLockControls && onToggleLock && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className="absolute bottom-1 right-1 bg-black/40 text-white p-1 rounded-full hover:bg-black/60"
          title={isLocked ? "Unlock preview (auto-update)" : "Lock preview (prevent auto-update)"}
        >
          <span className="text-xs material-icons">
            {isLocked ? 'lock' : 'lock_open'}
          </span>
        </button>
      )}
    </div>
  );
}

// Helper to get an icon based on filter type
function getFilterIcon(filterType: FilterType): string {
  switch (filterType) {
    case 'blur': return '●';
    case 'sharpen': return '⚡';
    case 'grayscale': return '◐';
    case 'invert': return '⟲';
    case 'noise': return '⋮';
    case 'dither': return '⋰';
    case 'pixelate': return '▦';
    case 'image': return '🖼️';
    default: return '▢';
  }
}