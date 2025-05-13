import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusIcon, Trash2Icon, StarIcon, PackageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DbCustomNodeData } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface CustomNodesPanelProps {
  width: number;
  onAddCustomNode: (customNode: DbCustomNodeData) => void;
  onCreateCustomNode: () => void;
  onDeleteCustomNode: (id: number) => void;
}

export default function CustomNodesPanel({ 
  width, 
  onAddCustomNode, 
  onCreateCustomNode,
  onDeleteCustomNode
}: CustomNodesPanelProps) {
  const [customNodes, setCustomNodes] = useState<DbCustomNodeData[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Fetch custom nodes from the server
    const fetchCustomNodes = async () => {
      try {
        const response = await fetch('/api/custom-nodes');
        if (response.ok) {
          const data = await response.json();
          setCustomNodes(data);
        }
      } catch (error) {
        console.error('Failed to fetch custom nodes:', error);
      }
    };
    
    fetchCustomNodes();
  }, []);
  
  const handleNodeDragStart = (e: React.DragEvent, customNode: DbCustomNodeData) => {
    // Store the custom node information in the drag event
    e.dataTransfer.setData('application/reactflow', JSON.stringify({ type: 'customNode', node: customNode }));
    e.dataTransfer.effectAllowed = 'move';
    
    // Notify parent component to add the node
    onAddCustomNode(customNode);
  };
  
  const confirmDelete = (id: number) => {
    setSelectedNodeId(id);
    setDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (selectedNodeId !== null) {
      try {
        const response = await fetch(`/api/custom-nodes/${selectedNodeId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Remove the node from the local state
          setCustomNodes(nodes => nodes.filter(node => node.id !== selectedNodeId));
          
          toast({
            title: "Custom node deleted",
            description: "Your custom node has been deleted successfully.",
          });
          
          // Notify parent component
          onDeleteCustomNode(selectedNodeId);
        } else {
          throw new Error('Failed to delete custom node');
        }
      } catch (error) {
        console.error('Error deleting custom node:', error);
        toast({
          title: "Error",
          description: "Failed to delete the custom node.",
          variant: "destructive",
        });
      }
      
      setDeleteDialogOpen(false);
      setSelectedNodeId(null);
    }
  };
  
  return (
    <div className="flex flex-col h-full" style={{ width: `${width}px` }}>
      <div className="border-b p-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center">
          <StarIcon className="h-4 w-4 mr-2 text-amber-500" />
          Custom Nodes
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8"
          onClick={onCreateCustomNode}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Create New
        </Button>
      </div>
      
      {customNodes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <PackageIcon className="h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-sm font-medium mb-1">No custom nodes yet</h3>
          <p className="text-xs text-gray-500 mb-4">
            Select multiple nodes on your canvas and click "Create New" to save them as a reusable custom node.
          </p>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onCreateCustomNode}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Create Custom Node
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 gap-2">
          {customNodes.map((customNode) => (
            <Card 
              key={customNode.id}
              className="relative group cursor-grab bg-black border border-zinc-800"
              draggable
              onDragStart={(e) => handleNodeDragStart(e, customNode)}
            >
              <div className="flex items-center">
                {/* Thumbnail on the left */}
                <div 
                  className="w-10 h-10 m-2 rounded flex-shrink-0 bg-white"
                  style={{
                    backgroundImage: customNode.thumbnail ? `url(${customNode.thumbnail})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!customNode.thumbnail && (
                    <div className="w-full h-full flex items-center justify-center">
                      <StarIcon className="h-5 w-5 text-amber-400" />
                    </div>
                  )}
                </div>
                
                {/* Title and badge */}
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium text-white">
                    {customNode.name}
                  </h3>
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 w-fit">
                    Custom
                  </span>
                </div>
                
                {/* Delete button */}
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-900 text-red-500 absolute top-1 right-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(customNode.id);
                  }}
                >
                  <Trash2Icon className="h-3 w-3" />
                </button>
              </div>
              
              {/* Description area - fixed height and ellipsis for overflow */}
              {customNode.description && (
                <p className="text-xs text-white/60 px-2 pb-1 line-clamp-1 max-w-[200px]">
                  {customNode.description}
                </p>
              )}
              
              <div className="bg-amber-100/90 px-3 py-1 text-xs text-amber-900 font-medium">
                Custom Filter Node
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this custom node. You won't be able to recover it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}