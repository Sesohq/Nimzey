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
    <div className="w-64 bg-[#0A0D14] text-white flex flex-col relative" style={{ width: `${width}px` }}>
      <div className="p-3 font-semibold text-white flex items-center border-b border-gray-800">
        <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_5px_#2A5DCE]"></div>
        <span>Filter Library</span>
      </div>
      
      {/* Main scrollable area for filters - with bottom padding to make room for sticky button */}
      <ScrollArea className="flex-1" style={{ paddingBottom: "70px" }}>
        <div className="p-2 pb-16">
          <Accordion 
            type="multiple" 
            defaultValue={Object.keys(filterCategories)}
            className="space-y-3"
          >
            {Object.entries(filterCategories).map(([categoryId, category]) => {
              const categoryColor = categoryId === 'basic' ? '#032573' : 
                                   categoryId === 'texture' ? '#2A5DCE' : 
                                   categoryId === 'distortion' ? '#B3282D' : 
                                   categoryId === 'compositing' ? '#B35F28' : 
                                   categoryId === 'blending' ? '#AB2EA3' : '#032573';
              
              return (
                <AccordionItem value={categoryId} key={categoryId} className="border-0 mb-2">
                  <AccordionTrigger 
                    className={`
                      px-6 py-3 rounded-full text-white text-lg font-semibold
                      transition-all hover:brightness-110
                      relative overflow-hidden
                    `}
                    style={{
                      background: `linear-gradient(90deg, ${categoryColor} 0%, rgba(11, 24, 49, 0.9) 100%)`,
                      border: '0.5px solid #00B6FE',
                      boxShadow: '0 0 15px rgba(0, 182, 254, 0.15)'
                    }}
                  >
                    {/* Subtle glow circle in background */}
                    <div className="absolute left-[-30px] top-[-80px] w-[120px] h-[120px] rounded-full opacity-20 blur-xl"
                         style={{background: `radial-gradient(circle, ${categoryColor} 0%, rgba(0,0,0,0) 70%)`}}>
                    </div>
                    <span className="z-10 relative">{category.name}</span>
                  </AccordionTrigger>
                  <AccordionContent className="mt-1.5 space-y-1.5 px-1">
                    {category.filters.map(filter => {
                      return (
                        <div
                          key={filter.type}
                          className={`
                            px-6 py-2.5 rounded-full cursor-pointer
                            transition-all hover:brightness-110
                            text-white text-base font-medium
                            relative overflow-hidden flex items-center
                          `}
                          style={{
                            background: 'linear-gradient(90deg, rgba(24, 49, 95, 0.8) 0%, rgba(11, 24, 49, 0.95) 100%)',
                            border: '0.5px solid rgba(0, 182, 254, 0.4)',
                            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
                          }}
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
              );
            })}
          </Accordion>
        </div>
      </ScrollArea>
      
      {/* Sticky upload button */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-[#0A0D14] border-t border-gray-800 z-10">
        <Button 
          variant="default" 
          className="w-full py-3 text-base font-semibold relative overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, #2A5DCE 0%, rgba(11, 24, 49, 0.95) 100%)',
            border: '0.5px solid #00B6FE',
            borderRadius: '999px',
            boxShadow: '0 0 15px rgba(0, 182, 254, 0.2)'
          }}
          onClick={() => document.getElementById('imageUpload')?.click()}
        >
          {/* Subtle glow circle */}
          <div className="absolute left-[-30px] top-[-80px] w-[120px] h-[120px] rounded-full opacity-20 blur-xl"
               style={{background: 'radial-gradient(circle, #2A5DCE 0%, rgba(0,0,0,0) 70%)'}}>
          </div>
          
          <div className="flex items-center justify-center z-10 relative">
            <Upload className="h-5 w-5 mr-2" />
            <span>Upload Image</span>
          </div>
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
