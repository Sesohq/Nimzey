import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Node, Edge } from 'reactflow';
import { CustomNodeData } from '@/types';

interface CreateCustomNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNodes: Node[];
  edges: Edge[];
  onCreateCustomNode: (customNode: Omit<CustomNodeData, 'id'>) => void;
}

export default function CreateCustomNodeDialog({
  open,
  onOpenChange,
  selectedNodes,
  edges,
  onCreateCustomNode
}: CreateCustomNodeDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [description, setDescription] = useState('');
  
  // Filter only the edges that connect the selected nodes
  const relevantEdges = edges.filter(edge => 
    selectedNodes.some(node => node.id === edge.source) && 
    selectedNodes.some(node => node.id === edge.target)
  );

  const handleCreateNode = () => {
    if (!name) return;
    
    // Create a simplified thumbnail based on node connections
    const thumbnailCanvas = document.createElement('canvas');
    const ctx = thumbnailCanvas.getContext('2d');
    thumbnailCanvas.width = 100;
    thumbnailCanvas.height = 100;
    
    if (ctx) {
      // Draw a simplified representation of nodes
      ctx.fillStyle = '#ffa500';
      ctx.fillRect(0, 0, 100, 100);
      
      // Draw connecting lines between nodes
      relevantEdges.forEach(() => {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 50);
        ctx.lineTo(70, 50);
        ctx.stroke();
      });
      
      // Draw node circles
      selectedNodes.forEach((_, index) => {
        const x = 20 + (index * 60) % 80;
        const y = 30 + Math.floor(index / 2) * 40;
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Extract parameters from the selected nodes to expose in the custom node
    const params = selectedNodes.flatMap(node => {
      if ('params' in node.data) {
        // Take the top 3 parameters from each node to keep it manageable
        return node.data.params.slice(0, 3).map((param: any) => ({
          ...param,
          name: `${node.id}_${param.name}`, // Make the param name unique
          label: `${node.data.label || 'Node'} - ${param.label}` // Include node name in label
        }));
      }
      return [];
    }).slice(0, 5); // Limit to 5 total parameters
    
    const customNode: Omit<CustomNodeData, 'id'> = {
      name,
      category,
      description,
      thumbnail: thumbnailCanvas.toDataURL(),
      params,
      enabled: true,
      blendMode: 'normal',
      opacity: 1,
      internalNodes: selectedNodes,
      internalEdges: relevantEdges,
      onParamChange: undefined,
      onToggleEnabled: undefined,
      onBlendModeChange: undefined,
      onOpacityChange: undefined,
      onRemoveNode: undefined
    };
    
    onCreateCustomNode(customNode);
    
    // Reset form
    setName('');
    setCategory('Custom');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Custom Node</DialogTitle>
          <DialogDescription>
            Create a reusable custom node from your selected nodes.
            {selectedNodes.length === 0 && (
              <p className="text-red-500 mt-2">Please select at least one node to create a custom node.</p>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="My Custom Filter"
              disabled={selectedNodes.length === 0}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={selectedNodes.length === 0}
            >
              <SelectTrigger className="col-span-3" id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Custom">Custom</SelectItem>
                <SelectItem value="Effects">Effects</SelectItem>
                <SelectItem value="Texture">Texture</SelectItem>
                <SelectItem value="Color">Color</SelectItem>
                <SelectItem value="Distortion">Distortion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Describe what this custom node does"
              disabled={selectedNodes.length === 0}
            />
          </div>
          
          <div className="col-span-4">
            <h4 className="text-sm font-medium mb-2">Selected Nodes ({selectedNodes.length})</h4>
            <ul className="text-sm text-gray-500 space-y-1">
              {selectedNodes.map(node => (
                <li key={node.id}>
                  • {node.data.label || node.id}
                </li>
              ))}
              {selectedNodes.length === 0 && (
                <li className="italic">No nodes selected</li>
              )}
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleCreateNode}
            disabled={!name || selectedNodes.length === 0}
          >
            Create Custom Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}