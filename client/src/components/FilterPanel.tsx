import React, { useState, useMemo } from 'react';
import { 
  NodeStore, 
  NodeCategory,
  NodeDefinition
} from '@shared/nodeTypes';
import { 
  getNodesByCategory
} from '../lib/nodeDefinitions';

// Icons for the panel
import { 
  Search as SearchIcon,
  Filter as FilterIcon,
  Layers as LayersIcon,
  Sliders as SlidersIcon,
  Image as ImageIcon,
  Wand2 as WandIcon,
  Settings as SettingsIcon,
  Plus as PlusIcon
} from 'lucide-react';

// Interface for component props
interface FilterPanelProps {
  onAddNode: (node: NodeDefinition) => void;
  className?: string;
}

// Helper to get the correct icon for a category
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

// Main FilterPanel component
const FilterPanel: React.FC<FilterPanelProps> = ({ onAddNode, className }) => {
  // State for search and active category
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Get all node categories and their nodes
  const categories = useMemo(() => {
    return Object.values(NodeCategory).map(category => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      nodes: getNodesByCategory(category as NodeCategory)
    }));
  }, []);
  
  // Filter nodes based on search term
  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim() && !activeCategory) {
      return categories;
    }
    
    const filtered = categories.map(category => {
      let nodes = category.nodes;
      
      // Apply search filter if there's a search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        nodes = nodes.filter(node => 
          node.name.toLowerCase().includes(term) || 
          node.description?.toLowerCase().includes(term)
        );
      }
      
      // Filter by active category if selected
      if (activeCategory && category.id !== activeCategory) {
        return { ...category, nodes: [] };
      }
      
      return { ...category, nodes };
    });
    
    return filtered.filter(category => category.nodes.length > 0);
  }, [categories, searchTerm, activeCategory]);
  
  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className || ''}`}>
      {/* Header */}
      <div className="p-3 border-b">
        <h2 className="text-lg font-semibold mb-3">Filter Nodes</h2>
        
        {/* Search input */}
        <div className="relative mb-3">
          <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search filters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-gray-300 text-sm"
          />
        </div>
        
        {/* Category buttons */}
        <div className="flex flex-wrap gap-1 mb-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
              className={`px-2 py-1 text-xs rounded-md flex items-center ${
                activeCategory === category.id 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{getCategoryIcon(category.id as NodeCategory)}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Node list */}
      <div className="flex-1 overflow-y-auto">
        {filteredNodes.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No nodes match your search
          </div>
        ) : (
          <div className="p-3">
            {filteredNodes.map(category => (
              <div key={category.id} className="mb-4">
                <h3 className="text-sm font-medium mb-2 text-gray-700 flex items-center">
                  {getCategoryIcon(category.id as NodeCategory)}
                  <span className="ml-1">{category.name}</span>
                </h3>
                
                <div className="space-y-2">
                  {category.nodes.map(node => (
                    <div
                      key={node.id}
                      className="p-2 bg-white border rounded-md hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium">{node.name}</h4>
                          {node.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{node.description}</p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => onAddNode(node)}
                          className="p-1 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Upload new image button */}
      <div className="p-3 border-t mt-auto">
        <button 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          onClick={() => {
            const generators = getNodesByCategory(NodeCategory.Generator);
            if (generators.length > 0) {
              onAddNode(generators[0]);
            }
          }}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Upload Image
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;