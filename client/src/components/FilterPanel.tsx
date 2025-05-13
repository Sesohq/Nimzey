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
    <div className="w-64 bg-[#11131F] text-white flex flex-col" style={{ width: `${width}px` }}>
      <div className="p-3 font-semibold text-white">Filter Library</div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
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
                      px-6 py-4 rounded-2xl text-white text-xl font-semibold
                      transition-all hover:brightness-110
                      relative overflow-hidden
                    `}
                    style={{
                      background: categoryColor,
                      border: '0.5px solid #00B6FE',
                      boxShadow: '0 0 20px rgba(0, 182, 254, 0.2)'
                    }}
                  >
                    {/* SVG Glow Effect */}
                    <div className="absolute inset-0 z-0 opacity-30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 288 56" fill="none" preserveAspectRatio="none">
                        <g filter="url(#filter0_f_26_41)">
                          <path d="M74 24.5C74 114.799 0.79855 188 -89.5 188C-179.799 188 -253 114.799 -253 24.5C-253 -65.7986 -179.799 -139 -89.5 -139C0.79855 -139 74 -65.7986 74 24.5Z" fill={categoryColor} />
                        </g>
                        <defs>
                          <filter id="filter0_f_26_41" x="-473.6" y="-359.6" width="768.2" height="768.2" filterUnits="userSpaceOnUse" colorInterpolation-filters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                            <feGaussianBlur stdDeviation="110.3" result="effect1_foregroundBlur_26_41"/>
                          </filter>
                        </defs>
                      </svg>
                    </div>
                    <span className="z-10 relative">{category.name}</span>
                  </AccordionTrigger>
                  <AccordionContent className="mt-2 space-y-2 px-1">
                    {category.filters.map(filter => {
                      return (
                        <div
                          key={filter.type}
                          className={`
                            px-6 py-4 rounded-2xl cursor-pointer
                            transition-all hover:brightness-110
                            text-white text-xl font-medium
                            relative overflow-hidden
                          `}
                          style={{
                            background: categoryColor,
                            border: '0.5px solid #00B6FE',
                            boxShadow: '0 0 10px rgba(0, 182, 254, 0.15)'
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
      
      <div className="p-3">
        <Button 
          variant="default" 
          className="w-full py-6 text-lg font-semibold relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #2A5DCE 0%, #032573 100%)',
            border: '0.5px solid #00B6FE',
            borderRadius: '16px',
            boxShadow: '0 0 15px rgba(0, 182, 254, 0.3)'
          }}
          onClick={() => document.getElementById('imageUpload')?.click()}
        >
          {/* SVG Glow Effect */}
          <div className="absolute inset-0 z-0 opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 288 56" fill="none" preserveAspectRatio="none">
              <g filter="url(#filter0_f_26_41)">
                <path d="M74 24.5C74 114.799 0.79855 188 -89.5 188C-179.799 188 -253 114.799 -253 24.5C-253 -65.7986 -179.799 -139 -89.5 -139C0.79855 -139 74 -65.7986 74 24.5Z" fill="#2A5DCE" />
              </g>
              <defs>
                <filter id="filter0_f_26_41" x="-473.6" y="-359.6" width="768.2" height="768.2" filterUnits="userSpaceOnUse" colorInterpolation-filters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                  <feGaussianBlur stdDeviation="110.3" result="effect1_foregroundBlur_26_41"/>
                </filter>
              </defs>
            </svg>
          </div>
          <div className="flex items-center justify-center z-10 relative">
            <Upload className="h-6 w-6 mr-3" />
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
