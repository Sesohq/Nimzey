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
          {Object.entries(filterCategories).map(([categoryId, category]) => (
            <div className="filter-category mb-4" key={categoryId}>
              <div className="filter-category-header">
                <span>{category.name}</span>
                <FilterIcon className="h-4 w-4" />
              </div>
              <div className="filter-list">
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
                      <Plus className="h-5 w-5 icon" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
