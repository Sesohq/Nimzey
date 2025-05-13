import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { filterCategories, categoryColors, getFilterCategory } from '@/lib/filterCategories';
import { Upload } from 'lucide-react';
import { NodeType, FilterType } from '@/types';

interface FilterPanelProps {
  width: number;
  onAddFilter: (type: FilterType) => void;
  onUploadImage: (file: File) => void;
  sourceImage: string | null;
}

export default function FilterPanel({ width, onAddFilter, onUploadImage, sourceImage }: FilterPanelProps) {
  const [draggedFilter, setDraggedFilter] = useState<FilterType | null>(null);

  const handleFilterDragStart = (e: React.DragEvent, filter: FilterType) => {
    e.dataTransfer.setData('application/reactflow', filter);
    setDraggedFilter(filter);
  };

  const handleFilterDragEnd = () => {
    setDraggedFilter(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  return (
    <div className="w-64 bg-darkBg text-white flex flex-col" style={{ width: `${width}px` }}>
      <div className="p-3 bg-gray-900 font-semibold text-white">Filter Library</div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          <Accordion 
            type="multiple" 
            defaultValue={Object.keys(filterCategories)}
            className="space-y-3 bg-gray-900 rounded-lg p-1"
          >
            {Object.entries(filterCategories).map(([categoryId, category]) => (
              <AccordionItem value={categoryId} key={categoryId} className="border-0 mb-2">
                <AccordionTrigger 
                  className={`px-2 py-2 rounded ${categoryColors[categoryId as keyof typeof categoryColors].color} ${categoryColors[categoryId as keyof typeof categoryColors].textColor} bg-opacity-90`}
                >
                  {category.name}
                </AccordionTrigger>
                <AccordionContent className="mt-1 pl-2">
                  {category.filters.map(filter => {
                    const filterCategory = getFilterCategory(filter.type);
                    const style = categoryColors[filterCategory as keyof typeof categoryColors];
                    
                    return (
                      <div
                        key={filter.type}
                        className={`p-2 rounded cursor-pointer my-1 transition-colors ${style.color} ${style.textColor} bg-opacity-70 hover:bg-opacity-90`}
                        draggable
                        onDragStart={(e) => handleFilterDragStart(e, filter.type)}
                        onDragEnd={handleFilterDragEnd}
                        onClick={() => onAddFilter(filter.type)}
                      >
                        {filter.name}
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>
      
      <div className="p-3 bg-gray-900 border-t border-gray-800">
        <Button 
          variant="default" 
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          onClick={() => document.getElementById('imageUpload')?.click()}
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Image
        </Button>
        <input 
          type="file" 
          id="imageUpload" 
          className="hidden" 
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>
    </div>
  );
}
