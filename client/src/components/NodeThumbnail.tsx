/**
 * NodeThumbnail.tsx
 * 
 * Component for displaying node preview thumbnails with offline canvas support.
 * Provides a consistent interface for node preview rendering across the application.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Node } from 'reactflow';
import { FilterNodeData, FilterType } from '@/types';
import { Lock, Unlock } from 'lucide-react';

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
  size = 100,
  className = '',
  isLocked = false,
  onToggleLock,
  showLockControls = false
}: NodeThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  
  // Subscribe to preview updates for this node
  useEffect(() => {
    const handlePreviewUpdate = (e: any) => {
      if (e.detail && e.detail.nodeId === nodeId && e.detail.preview) {
        setDataUrl(e.detail.preview);
      }
    };
    
    // Add event listener for our custom event
    window.addEventListener('node-preview-updated', handlePreviewUpdate);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('node-preview-updated', handlePreviewUpdate);
    };
  }, [nodeId]);
  
  // Register this canvas with the preview system
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Add data attribute for direct DOM manipulation
    canvasRef.current.setAttribute('data-node-thumbnail', nodeId);
    
    // Make the canvas globally available for the worker
    if (!(window as any).nodeThumbnails) {
      (window as any).nodeThumbnails = {};
    }
    (window as any).nodeThumbnails[nodeId] = canvasRef.current;
    
    return () => {
      // Clean up on unmount
      if ((window as any).nodeThumbnails) {
        delete (window as any).nodeThumbnails[nodeId];
      }
    };
  }, [nodeId]);
  
  return (
    <div className={`relative ${className}`}>
      {/* Canvas for direct rendering from worker */}
      <canvas
        ref={canvasRef}
        width={128}
        height={128}
        style={{ width: size, height: size }}
        className="rounded-md"
        id={`node-thumb-${nodeId}`}
      />
      
      {/* Fallback image if canvas rendering fails */}
      {dataUrl && (
        <img
          src={dataUrl}
          alt={`${filterType} preview`}
          className="absolute top-0 left-0 w-full h-full object-cover rounded-md opacity-0"
          style={{ opacity: canvasRef.current ? 0 : 1 }}
          data-node-preview-id={nodeId}
        />
      )}
      
      {/* Lock/unlock control */}
      {showLockControls && onToggleLock && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className="absolute bottom-1 right-1 bg-black/40 text-white p-1 rounded-full hover:bg-black/60"
          title={isLocked ? "Unlock preview" : "Lock preview"}
        >
          {isLocked ? (
            <Lock size={14} />
          ) : (
            <Unlock size={14} />
          )}
        </button>
      )}
    </div>
  );
}