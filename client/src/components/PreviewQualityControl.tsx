/**
 * PreviewQualityControl.tsx
 * 
 * A simpler, more compatible approach to manage preview quality settings
 * across the application without relying on complex worker architectures.
 */
import React, { useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { usePreviewStore } from '@/store/previewStore';

interface PreviewQualityControlProps {
  className?: string;
}

export default function PreviewQualityControl({ className = '' }: PreviewQualityControlProps) {
  const qualityLevel = usePreviewStore(state => state.qualityLevel);
  const setQualityLevel = usePreviewStore(state => state.setQualityLevel);

  // Quality level descriptions for tooltips
  const qualityDescriptions = {
    preview: 'Fastest rendering, lower quality - best for quick adjustments',
    draft: 'Balanced quality and speed - good for most editing tasks',
    full: 'Highest quality, slower rendering - best for final review'
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-xs mr-2 text-gray-400">Quality:</span>
      <Select 
        value={qualityLevel} 
        onValueChange={(value: 'preview' | 'draft' | 'full') => setQualityLevel(value)}
      >
        <SelectTrigger className="h-7 w-28 text-xs bg-gray-800 border-gray-700">
          <SelectValue placeholder="Quality" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="preview" title={qualityDescriptions.preview}>
            Fast
          </SelectItem>
          <SelectItem value="draft" title={qualityDescriptions.draft}>
            Balanced
          </SelectItem>
          <SelectItem value="full" title={qualityDescriptions.full}>
            High Quality
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}