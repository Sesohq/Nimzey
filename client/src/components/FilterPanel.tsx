import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilterType } from '@/types';
import { Upload, FilterIcon, ImageIcon } from 'lucide-react';

// Filter categories and their available filters
const filterCategories = {
  basic: {
    name: 'Basic Filters',
    filters: [
      { name: 'Blur', type: 'blur' },
      { name: 'Sharpen', type: 'sharpen' },
      { name: 'Grayscale', type: 'grayscale' },
      { name: 'Invert', type: 'invert' }
    ]
  },
  texture: {
    name: 'Texture Filters',
    filters: [
      { name: 'Noise', type: 'noise' },
      { name: 'Dither', type: 'dither' },
      { name: 'Pixelate', type: 'pixelate' }
    ]
  }
};

interface FilterPanelProps {
  width: number;
  onAddFilter: (type: FilterType) => void;
  onUploadImage: (file: File) => void;
  sourceImage: string | null;
  onAddOutputNode?: () => void;
}

export default function FilterPanel({ width, onAddFilter, onUploadImage, sourceImage, onAddOutputNode }: FilterPanelProps) {
  const fileInputRef = useState<HTMLInputElement | null>(null);
  
  // Handle filter drag start
  const handleFilterDragStart = (e: React.DragEvent, filter: FilterType) => {
    e.dataTransfer.setData('application/reactflow', filter);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle filter click to add it directly
  const handleFilterClick = (filter: FilterType) => {
    onAddFilter(filter);
  };
  
  // Handle image upload
  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onUploadImage(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-full overflow-hidden border-r border-gray-800 bg-gray-900 text-white" style={{ width: `${width}px` }}>
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Filter Library</h2>
        
        {/* Image upload section */}
        <div className="mb-4">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleUploadClick}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
        </div>
        
        {/* Add output node button */}
        {onAddOutputNode && (
          <Button 
            variant="outline" 
            className="w-full justify-start mb-4"
            onClick={onAddOutputNode}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Add Output Node
          </Button>
        )}
        
        {/* Filter categories */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <Accordion type="multiple" defaultValue={['basic', 'texture']}>
            {Object.entries(filterCategories).map(([key, category]) => (
              <AccordionItem value={key} key={key}>
                <AccordionTrigger className="py-2">{category.name}</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2 p-1">
                    {category.filters.map((filter) => (
                      <div
                        key={filter.type}
                        className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-md cursor-pointer hover:bg-gray-700 transition-colors"
                        draggable
                        onDragStart={(e) => handleFilterDragStart(e, filter.type as FilterType)}
                        onClick={() => handleFilterClick(filter.type as FilterType)}
                      >
                        <FilterIcon className="mb-1 h-4 w-4" />
                        <span className="text-xs">{filter.name}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </div>
    </div>
  );
}