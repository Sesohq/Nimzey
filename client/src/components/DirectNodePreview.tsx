import { memo, useEffect, useState } from 'react';
import { Node } from 'reactflow';
import { FilterNodeData } from '@/types';

// Simple direct preview component that can be included in any node
interface DirectNodePreviewProps {
  node: Node<FilterNodeData>;
  sourceImage: HTMLImageElement | null;
  onRetryClick?: () => void;
}

const DirectNodePreview = ({ node, sourceImage, onRetryClick }: DirectNodePreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate a simple preview when the component mounts or source image changes
  useEffect(() => {
    if (!sourceImage) {
      setError('No source image available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Create a canvas for the preview
      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setError('Could not create canvas context');
        setIsLoading(false);
        return;
      }
      
      // Draw the source image as a base
      ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
      
      // Apply a simple visual effect based on the filter type
      if (node.type === 'filterNode' || node.type === 'blendNode') {
        const data = node.data as FilterNodeData;
        
        // Simple preview effect based on filter type
        switch(data.filterType) {
          case 'blur':
            // Apply a blur effect
            ctx.filter = `blur(${data.params.find(p => p.name === 'radius')?.value || 5}px)`;
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
            break;
            
          case 'grayscale':
            // Apply grayscale
            ctx.filter = 'grayscale(100%)';
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
            break;
            
          case 'invert':
            // Invert colors
            ctx.filter = 'invert(100%)';
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
            break;
          
          // For more complex filters, add a visual indicator
          default:
            // Add a text overlay with the filter type
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, canvas.width, 20);
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.fillText(data.filterType, 5, 15);
            break;
        }
      }
      
      // Convert to a data URL and update state
      const dataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(dataUrl);
      setIsLoading(false);
      setError(null);
      
    } catch (err) {
      console.error('Error generating preview:', err);
      setError('Failed to generate preview');
      setIsLoading(false);
    }
  }, [node, sourceImage]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-xs text-gray-500">Generating preview...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center" onClick={onRetryClick}>
        <div className="text-center">
          <div className="text-xs text-gray-500">{error}</div>
          <button 
            className="text-xs text-blue-500 mt-1 underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onRetryClick?.();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {previewUrl ? (
        <img 
          src={previewUrl} 
          alt={`${node.data.filterType} preview`}
          className="max-w-full max-h-full object-contain"
          onError={() => setError('Failed to load preview')}
        />
      ) : (
        <div className="text-xs text-gray-500">No preview available</div>
      )}
    </div>
  );
};

export default memo(DirectNodePreview);