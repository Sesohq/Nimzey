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
  onAddResultNode?: () => void;
  sourceImage: string | null;
}

export default function FilterPanel({ width, onAddFilter, onUploadImage, onAddResultNode, sourceImage }: FilterPanelProps) {
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
    <div className="h-full flex flex-col bg-[#0A0D14] text-white" style={{ width: `${width}px` }}>
      <div className="p-3 font-semibold text-white flex items-center border-b border-gray-800">
        <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_5px_#2A5DCE]"></div>
        <span>Filter Library</span>
      </div>
        
      {/* Scrollable area for filters */}
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
          
          {/* Utility Nodes Section */}
          <div className="mt-4 mb-2">
            <div className="px-2 py-1 text-sm text-gray-300 font-semibold">Utility Nodes</div>
            <div className="bg-[#111827] p-3 rounded-lg shadow-inner">
              {/* Result Node */}
              <div 
                className="group flex items-center mb-2 p-2 rounded-md bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 transition-colors cursor-pointer"
                onClick={() => onAddResultNode && onAddResultNode()}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-black bg-opacity-20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-white font-medium">Result</div>
                  <div className="text-xs text-gray-200">Displays final output</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {/* Upload button always visible at the bottom */}
      <div className="p-3 border-t border-gray-800">
        <label
          htmlFor="image-upload"
          className="flex items-center justify-center p-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 transition-opacity cursor-pointer text-white"
        >
          <Upload className="mr-2 h-4 w-4" />
          <span>Upload Image</span>
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
    </div>
  );
}
