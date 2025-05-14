import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilterNodeData } from '@/types';
import { RefreshCcwIcon } from 'lucide-react';

interface SimpleNodePreviewProps {
  nodeId: string;
  nodeType: string;
  nodeData: FilterNodeData;
  sourceImage: HTMLImageElement | null;
  onRetryClick?: () => void;
  size?: { width: number; height: number };
}

const SimpleNodePreview: React.FC<SimpleNodePreviewProps> = ({
  nodeId,
  nodeType,
  nodeData,
  sourceImage,
  onRetryClick,
  size = { width: 100, height: 100 }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Function to directly render the preview - using useCallback for performance
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsLoading(true);
    setHasError(false);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // If we have a preview URL in the node data, use it directly
    if (nodeData.preview && nodeData.preview.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate aspect ratio for proper display
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        const imageAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;
        
        if (imageAspect > canvasAspect) {
          // Image is wider than canvas, adjust height
          drawHeight = canvas.width / imageAspect;
        } else {
          // Image is taller than canvas, adjust width
          drawWidth = canvas.height * imageAspect;
        }
        
        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;
        
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };
      
      img.src = nodeData.preview;
    } 
    // If we have a source image but no preview yet
    else if (sourceImage) {
      // Use the source image as fallback
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate aspect ratio for proper display
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      const imageAspect = sourceImage.width / sourceImage.height;
      const canvasAspect = canvas.width / canvas.height;
      
      if (imageAspect > canvasAspect) {
        drawHeight = canvas.width / imageAspect;
      } else {
        drawWidth = canvas.height * imageAspect;
      }
      
      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;
      
      try {
        ctx.drawImage(sourceImage, x, y, drawWidth, drawHeight);
        setIsLoading(false);
      } catch (error) {
        console.error('Error drawing source image:', error);
        setIsLoading(false);
        setHasError(true);
      }
    } else {
      // No source image or preview, show placeholder
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#999';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No Preview', canvas.width / 2, canvas.height / 2);
      setIsLoading(false);
    }
  }, [nodeData.preview, sourceImage, size]);

  // Render on component mount and when dependencies change
  useEffect(() => {
    const renderTimer = setTimeout(() => {
      renderPreview();
    }, 0);
    
    // Cleanup function to cancel timer if component unmounts or dependencies change
    return () => {
      clearTimeout(renderTimer);
    };
  }, [renderPreview]);

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={size.width} 
        height={size.height}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain'
        }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70">
          <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-90">
          <div className="text-red-500 text-sm mb-2">Preview Failed</div>
          {onRetryClick && (
            <button 
              onClick={onRetryClick}
              className="flex items-center justify-center space-x-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
            >
              <RefreshCcwIcon size={12} />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleNodePreview;