import React, { useMemo, useState } from 'react';
import { 
  NodeDefinition, 
  NodeCategory,
  NodeStore
} from '@shared/nodeTypes';
import { 
  getNodesByCategory, 
  createNodeInstance 
} from '@/lib/nodeDefinitions';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  SearchIcon, 
  FilterIcon, 
  LayersIcon, 
  SlidersIcon, 
  ImageIcon,
  WandIcon,
  SettingsIcon
} from 'lucide-react';

interface FilterPanelProps {
  onAddNode?: (node: NodeStore) => void;
  className?: string;
}

// Get the icon for a category
const getCategoryIcon = (category: NodeCategory) => {
  switch (category) {
    case NodeCategory.Generator:
      return <ImageIcon className="h-4 w-4" />;
    case NodeCategory.Filter:
      return <FilterIcon className="h-4 w-4" />;
    case NodeCategory.Compositing:
      return <LayersIcon className="h-4 w-4" />;
    case NodeCategory.Adjustment:
      return <SlidersIcon className="h-4 w-4" />;
    case NodeCategory.Output:
      return <WandIcon className="h-4 w-4" />;
    default:
      return <SettingsIcon className="h-4 w-4" />;
  }
};

const FilterPanel: React.FC<FilterPanelProps> = ({ onAddNode, className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>(NodeCategory.Filter);
  
  // Get all available node definitions by category
  const nodeCategories = useMemo(() => {
    return Object.values(NodeCategory).map(category => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      nodes: getNodesByCategory(category as NodeCategory)
    }));
  }, []);
  
  // Filter nodes based on search term
  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) {
      return nodeCategories;
    }
    
    const term = searchTerm.toLowerCase();
    
    return nodeCategories.map(category => ({
      ...category,
      nodes: category.nodes.filter(node => 
        node.name.toLowerCase().includes(term) || 
        node.description?.toLowerCase().includes(term)
      )
    })).filter(category => category.nodes.length > 0);
  }, [nodeCategories, searchTerm]);
  
  // Handle adding a node
  const handleAddNode = (definition: NodeDefinition) => {
    if (!onAddNode) return;
    
    // Create a new node instance
    const newNode = createNodeInstance(definition, { x: 100, y: 100 });
    onAddNode(newNode);
  };
  
  return (
    <div className={`filter-panel flex flex-col h-full bg-gray-50 border-r ${className || ''}`}>
      <div className="p-3 border-b">
        <h2 className="text-lg font-semibold mb-3">Filters</h2>
        
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search filters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid grid-cols-5">
          {nodeCategories.map(category => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex flex-col items-center p-1"
            >
              {getCategoryIcon(category.id as NodeCategory)}
              <span className="text-xs mt-1">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="flex-1 overflow-y-auto p-2">
          {filteredNodes.map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              {category.nodes.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 text-center">
                  No filters found in this category.
                </div>
              ) : (
                <Accordion type="multiple" defaultValue={[category.id]}>
                  <AccordionItem value={category.id}>
                    <AccordionTrigger className="py-2 text-sm font-medium">
                      {category.name} Filters ({category.nodes.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-2">
                        {category.nodes.map(node => (
                          <Card key={node.id} className="filter-card hover:shadow-md transition-shadow">
                            <CardHeader className="p-3 pb-2">
                              <CardTitle className="text-sm font-medium">{node.name}</CardTitle>
                              {node.description && (
                                <CardDescription className="text-xs">{node.description}</CardDescription>
                              )}
                            </CardHeader>
                            <CardFooter className="p-3 pt-0 flex justify-end">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleAddNode(node)}
                              >
                                Add
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
      
      <div className="p-3 border-t mt-auto">
        <Button 
          className="w-full"
          onClick={() => handleAddNode(getNodesByCategory(NodeCategory.Generator)[0])}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;