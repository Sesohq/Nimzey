import { useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text, Rect, Group } from 'react-konva';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { Annotation } from '@shared/schema';

interface AnnotatedImageProps {
  imageUrl: string;
  annotations?: Annotation[];
  alt: string;
}

export default function AnnotatedImage({ imageUrl, annotations = [], alt }: AnnotatedImageProps) {
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [hoveredAnnotation, setHoveredAnnotation] = useState<number | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setImageDimensions({ width: img.width, height: img.height });
      
      const aspectRatio = img.width / img.height;
      const maxWidth = 800;
      const maxHeight = 600;
      
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
      
      setDisplayDimensions({ width: displayWidth, height: displayHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  if (!imageObj || !imageDimensions.width || !displayDimensions.width) {
    return (
      <div className="flex items-center justify-center w-full h-96 bg-slate-100 dark:bg-slate-800/50">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-white/50">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading image...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-white/80">
              {annotations.length} issue{annotations.length !== 1 ? 's' : ''} detected
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnnotations(!showAnnotations)}
            className="flex items-center gap-2 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
            data-testid="button-toggle-annotations"
          >
            {showAnnotations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAnnotations ? 'Hide' : 'Show'}
          </Button>
        </div>
      </div>
      <div className="flex justify-center dark:bg-slate-800/30 relative bg-[#0f0f0f4d]">
        <div className="overflow-hidden relative">
          <Stage 
            width={displayDimensions.width} 
            height={displayDimensions.height}
          >
            <Layer>
              <KonvaImage
                image={imageObj}
                width={displayDimensions.width}
                height={displayDimensions.height}
              />
              
              {showAnnotations && annotations.map((annotation, index) => {
                const x = (annotation.x / 100) * displayDimensions.width;
                const y = (annotation.y / 100) * displayDimensions.height;
                const isHovered = hoveredAnnotation === index;

                const tooltipWidth = Math.max(annotation.label.length * 8, 200);
                const tooltipHeight = 80;
                
                let tooltipX = x + 18;
                let tooltipY = y - 20;
                
                if (tooltipX + tooltipWidth > displayDimensions.width) {
                  tooltipX = x - tooltipWidth - 18;
                }
                
                if (tooltipY < 0) {
                  tooltipY = y + 18;
                }
                
                if (tooltipY + tooltipHeight > displayDimensions.height) {
                  tooltipY = y - tooltipHeight - 18;
                }

                return (
                  <Group key={index}>
                    <Circle
                      x={x}
                      y={y}
                      radius={isHovered ? 14 : 12}
                      fill="#8B5CF6"
                      stroke="#6D28D9"
                      strokeWidth={isHovered ? 3 : 2}
                      opacity={isHovered ? 1 : 0.95}
                      shadowColor="black"
                      shadowBlur={8}
                      shadowOpacity={0.3}
                      onMouseEnter={() => setHoveredAnnotation(index)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    />
                    
                    <Text
                      x={x}
                      y={y}
                      text={String(index + 1)}
                      fontSize={isHovered ? 13 : 11}
                      fontFamily="Inter, Arial"
                      fontStyle="bold"
                      fill="white"
                      align="center"
                      verticalAlign="middle"
                      offsetX={isHovered ? 4 : 3}
                      offsetY={isHovered ? 5 : 4}
                      onMouseEnter={() => setHoveredAnnotation(index)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    />
                    
                    {isHovered && (
                      <Group>
                        <Rect
                          x={tooltipX}
                          y={tooltipY}
                          width={tooltipWidth}
                          height={tooltipHeight}
                          fill="rgba(15, 23, 42, 0.95)"
                          cornerRadius={10}
                          stroke="rgba(139, 92, 246, 0.5)"
                          strokeWidth={1}
                          shadowColor="black"
                          shadowBlur={12}
                          shadowOpacity={0.4}
                        />
                        <Text
                          x={tooltipX + 10}
                          y={tooltipY + 10}
                          text={annotation.label}
                          fontSize={12}
                          fontFamily="Inter, Arial"
                          fontStyle="bold"
                          fill="white"
                          width={tooltipWidth - 20}
                          wrap="word"
                        />
                        <Text
                          x={tooltipX + 10}
                          y={tooltipY + 28}
                          text={annotation.description}
                          fontSize={10}
                          fontFamily="Inter, Arial"
                          fill="rgba(255, 255, 255, 0.75)"
                          width={tooltipWidth - 20}
                          wrap="word"
                          height={45}
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
