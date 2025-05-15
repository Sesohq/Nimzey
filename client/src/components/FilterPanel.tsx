import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { filterCategories } from '@/lib/filterCategories';
import { Upload, Plus, FilterIcon, Layers } from 'lucide-react';
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
    <div className="filter-panel flex flex-col" style={{ width: `${width}px` }}>
      <div className="filter-panel-header">
        <Layers className="h-5 w-5 mr-2 inline-block" />
        Filters
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3">
          <Accordion type="multiple" defaultValue={Object.keys(filterCategories)} className="space-y-3">
            {Object.entries(filterCategories).map(([categoryId, category]) => (
              <AccordionItem value={categoryId} key={categoryId} className="filter-category border-0">
                <AccordionTrigger className="filter-category-header py-2 px-3 no-underline">
                  <span>{category.name}</span>
                </AccordionTrigger>
                <AccordionContent className="filter-list">
                  {category.filters.map(filter => (
                    <div
                      key={filter.type}
                      className={`styled-button ${draggedFilter === filter.type ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleFilterDragStart(e, filter.type)}
                      onDragEnd={handleFilterDragEnd}
                      onClick={() => onAddFilter(filter.type)}
                    >
                      <span>{filter.name}</span>
                      <div className="inner-button ml-auto">
                        <Plus className="h-4 w-4 icon" />
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>
      
      <div className="p-4 bg-gray-900">
        <div 
          className="styled-button"
          onClick={() => document.getElementById('imageUpload')?.click()}
        >
          <span>Upload Image</span>
          <div className="inner-button ml-auto">
            <Upload className="h-5 w-5 icon" />
          </div>
        </div>
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
