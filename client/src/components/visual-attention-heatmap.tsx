import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Info, Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import HeatMapCanvas from './heatmap-canvas';

interface AttentionPoint {
  x: number;
  y: number;
  intensity: number;
}

interface HeatmapData {
  highAttention?: AttentionPoint[];
  mediumAttention?: AttentionPoint[];
  lowAttention?: AttentionPoint[];
}

interface VisualAttentionHeatmapProps {
  originalImageUrl: string;
  heatmapUrl?: string;
  alt: string;
}

export default function VisualAttentionHeatmap({ 
  originalImageUrl, 
  heatmapUrl, 
  alt 
}: VisualAttentionHeatmapProps) {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (originalImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 600;
        const aspectRatio = img.width / img.height;
        
        let displayWidth = img.width;
        let displayHeight = img.height;
        
        if (displayWidth > maxWidth) {
          displayWidth = maxWidth;
          displayHeight = displayWidth / aspectRatio;
        }
        
        if (displayHeight > maxHeight) {
          displayHeight = maxHeight;
          displayWidth = displayHeight * aspectRatio;
        }
        
        setImageDimensions({ width: displayWidth, height: displayHeight });
        setImageObj(img);
        setImageLoaded(true);
      };
      img.src = originalImageUrl;
    }
  }, [originalImageUrl]);

  useEffect(() => {
    if (heatmapUrl) {
      try {
        const parsedData = JSON.parse(heatmapUrl);
        setHeatmapData(parsedData);
      } catch (error) {
        console.error('Failed to parse heatmap data:', error);
        setHeatmapData(null);
      }
    }
  }, [heatmapUrl]);

  if (!heatmapUrl && !heatmapData) {
    return (
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center mb-3">
            <Flame className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-white/50">Heatmap generation failed</p>
          <p className="text-xs text-slate-400 dark:text-white/30 mt-1">Unable to generate visual attention data</p>
        </div>
      </div>
    );
  }

  if (!imageLoaded || !imageObj) {
    return (
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-sm text-slate-500 dark:text-white/50">Loading heatmap...</span>
        </div>
      </div>
    );
  }

  const getAllHeatmapPoints = () => {
    if (!heatmapData) return [];
    
    const allPoints = [
      ...(heatmapData.highAttention || []),
      ...(heatmapData.mediumAttention || []),
      ...(heatmapData.lowAttention || [])
    ];

    return allPoints.filter(point => 
      typeof point.x === 'number' && 
      typeof point.y === 'number' && 
      typeof point.intensity === 'number'
    );
  };

  return (
    <div className="space-y-0 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Visual Attention</h4>
            <p className="text-xs text-slate-500 dark:text-white/50">Eye-tracking simulation</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-slate-400 dark:text-white/40" />
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 border-white/10">
                <p className="max-w-xs text-xs">Shows where viewers will look first. Red/bright areas get more attention.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="flex items-center gap-2 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
          data-testid="button-toggle-heatmap"
        >
          {showHeatmap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showHeatmap ? 'Hide' : 'Show'}
        </Button>
      </div>

      <div className="flex justify-center bg-slate-100 dark:bg-slate-800/30">
        <div className="relative overflow-hidden">
          <img
            src={originalImageUrl}
            alt={alt}
            className="block"
            style={{ 
              width: imageDimensions.width, 
              height: imageDimensions.height 
            }}
          />
          
          {showHeatmap && (
            <HeatMapCanvas
              points={getAllHeatmapPoints()}
              width={imageDimensions.width}
              height={imageDimensions.height}
            />
          )}

          {showHeatmap && (
            <div 
              className="absolute right-3 bottom-3 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500"></div>
                  <span className="text-white/80">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500"></div>
                  <span className="text-white/80">Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <span className="text-white/80">Low</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
