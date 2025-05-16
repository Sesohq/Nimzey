import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { filterCategories } from '@/lib/filterCategories';
import { 
  Upload, 
  Plus, 
  FilterIcon, 
  Layers, 
  Wand2, 
  ImageIcon, 
  Move3d, 
  LucideIcon, 
  Stars,
  Sparkles,
  Brush
} from 'lucide-react';
import { NodeType, FilterType } from '@/types';

interface FilterPanelProps {
  width: number;
  onAddFilter: (type: FilterType) => void;
  onUploadImage: (file: File) => void;
  sourceImage: string | null;
  onAddOutputNode?: () => void;
}

export default function FilterPanel({ width, onAddFilter, onUploadImage, sourceImage, onAddOutputNode }: FilterPanelProps) {
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
  
  // Function to get the appropriate icon based on category
  const getCategoryIcon = (categoryId: string) => {
    switch(categoryId) {
      case 'basic':
        return <Wand2 size={16} />;
      case 'texture':
        return <Brush size={16} />;
      case 'distortion':
        return <Move3d size={16} />;
      case 'photo':
        return <ImageIcon size={16} />;
      case 'edge':
        return <FilterIcon size={16} />;
      case 'artistic':
        return <Sparkles size={16} />;
      case 'special':
        return <Stars size={16} />;
      case 'effect':
        return <Sparkles size={16} />;
      default:
        return <FilterIcon size={16} />;
    }
  };

  return (
    <div className="filter-panel flex flex-col" style={{ width: `${width}px` }}>
      <div className="filter-panel-header">
        <div className="icon-container basic-filters mr-3" style={{width: '32px', height: '32px', minWidth: '32px'}}>
          <Layers className="h-5 w-5" />
        </div>
        <span className="text-lg">Filters</span>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3">
          <Accordion type="multiple" defaultValue={Object.keys(filterCategories)} className="space-y-3">
            {Object.entries(filterCategories).map(([categoryId, category]) => (
              <AccordionItem value={categoryId} key={categoryId} className="filter-category border-0">
                <AccordionTrigger className={`filter-category-header py-2 px-3 no-underline ${categoryId}-header`}>
                  <div className="flex items-center">
                    <div className={`icon-container ${categoryId}-filters mr-3`} style={{width: '26px', height: '26px', minWidth: '26px'}}>
                      {getCategoryIcon(categoryId)}
                    </div>
                    <span>{category.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="filter-list">
                  {category.filters.map(filter => (
                    <div
                      key={filter.type}
                      className={`btn-glitch ${categoryId}-filters ${draggedFilter === filter.type ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleFilterDragStart(e, filter.type)}
                      onDragEnd={handleFilterDragEnd}
                      onClick={() => onAddFilter(filter.type)}
                    >
                      <div className="text-container">
                        // {filter.name}
                      </div>
                      <div className="icon-container">
                        <Plus size={16} />
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>
      
      <div className="p-4" style={{backgroundColor: '#000'}}>
        <div 
          className="btn-glitch special-filters"
          onClick={() => document.getElementById('imageUpload')?.click()}
          style={{marginBottom: 0}}
        >
          <div className="text-container font-semibold">
            // Upload Image
          </div>
          <div className="icon-container" style={{backgroundColor: '#FF7D00'}}>
            <Upload size={16} />
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
