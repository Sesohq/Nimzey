import React, { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
// Using fetch API directly for API requests
import { FilterPreset } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Save, FolderOpen, Edit, Trash2, Download } from 'lucide-react';

interface PresetPanelProps {
  nodes: Node[];
  edges: Edge[];
  onLoadPreset: (nodes: Node[], edges: Edge[]) => void;
  width: number;
  processedImage: string | null;
}

export default function PresetPanel({ nodes, edges, onLoadPreset, width, processedImage }: PresetPanelProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  
  const { toast } = useToast();

  // Fetch all presets on component mount
  useEffect(() => {
    fetchPresets();
  }, []);
  
  // Function to resize and compress a base64 image
  const resizeAndCompressImage = (base64Str: string, maxWidth = 300): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!base64Str) {
        resolve('');
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw the image with the new dimensions
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get the compressed image as JPEG with lower quality
        const compressedImage = canvas.toDataURL('image/jpeg', 0.6);
        resolve(compressedImage);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = base64Str;
    });
  };

  // Function to fetch all presets
  const fetchPresets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/presets');
      if (!response.ok) {
        throw new Error('Failed to fetch presets');
      }
      const data = await response.json();
      setPresets(data);
    } catch (error) {
      console.error('Error fetching presets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load filter presets',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save the current node setup as a preset
  const savePreset = async () => {
    if (!presetName.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a name for your preset',
        variant: 'destructive',
      });
      return;
    }

    // Filter out position data to keep only filter configuration
    const sanitizedNodes = nodes.map(node => ({
      ...node,
      position: undefined,
      positionAbsolute: undefined,
      selected: undefined,
      dragging: undefined,
    }));

    setIsLoading(true);
    try {
      // Resize and compress the thumbnail image to reduce payload size
      const thumbnailData = processedImage 
        ? await resizeAndCompressImage(processedImage, 200) 
        : '';
      
      console.log('Compressed thumbnail size:', thumbnailData.length);
      
      const preset = {
        name: presetName,
        description: presetDescription,
        nodes: sanitizedNodes,
        edges: edges,
        thumbnail: thumbnailData,
      };

      const response = await fetch('/api/presets', {
        method: 'POST',
        body: JSON.stringify(preset),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preset');
      }

      toast({
        title: 'Success',
        description: 'Filter preset saved successfully',
      });
      
      setPresetName('');
      setPresetDescription('');
      setShowSaveDialog(false);
      fetchPresets(); // Refresh the list
    } catch (error) {
      console.error('Error saving preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to save filter preset',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing preset
  const updatePreset = async () => {
    if (!selectedPresetId || !presetName.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a preset and provide a name',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const preset = presets.find(p => p.id.toString() === selectedPresetId);
      if (!preset) {
        throw new Error('Preset not found');
      }

      // Use current nodes and edges for update
      const sanitizedNodes = nodes.map(node => ({
        ...node,
        position: undefined,
        positionAbsolute: undefined,
        selected: undefined,
        dragging: undefined,
      }));

      const updatedPreset = {
        name: presetName,
        description: presetDescription,
        nodes: sanitizedNodes,
        edges: edges,
        thumbnail: processedImage || preset.thumbnail,
      };

      const response = await fetch(`/api/presets/${selectedPresetId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedPreset),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update preset');
      }

      toast({
        title: 'Success',
        description: 'Filter preset updated successfully',
      });
      
      setPresetName('');
      setPresetDescription('');
      setSelectedPresetId(null);
      setShowEditDialog(false);
      fetchPresets(); // Refresh the list
    } catch (error) {
      console.error('Error updating preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to update filter preset',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a preset
  const deletePreset = async (id: string) => {
    if (!id) return;

    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/presets/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete preset');
      }

      toast({
        title: 'Success',
        description: 'Filter preset deleted successfully',
      });
      
      fetchPresets(); // Refresh the list
    } catch (error) {
      console.error('Error deleting preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete filter preset',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load a preset
  const loadPreset = (preset: FilterPreset) => {
    try {
      // Clone the nodes and add positions
      const loadedNodes = (preset.nodes as Node[]).map((node, index) => ({
        ...node,
        position: { x: 100 + (index * 200), y: 100 + (index * 50) },
      }));
      
      // Apply the nodes and edges to the canvas
      onLoadPreset(loadedNodes, preset.edges as Edge[]);
      
      toast({
        title: 'Success',
        description: `Loaded preset: ${preset.name}`,
      });
    } catch (error) {
      console.error('Error loading preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to load filter preset',
        variant: 'destructive',
      });
    }
  };

  // Open edit dialog with preset data
  const openEditDialog = (preset: FilterPreset) => {
    setSelectedPresetId(preset.id.toString());
    setPresetName(preset.name);
    setPresetDescription(preset.description || '');
    setShowEditDialog(true);
  };

  return (
    <div style={{ width: `${width}px` }} className="bg-white border-l border-slate-200 h-full overflow-y-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Filter Presets</h2>
        <div className="space-x-2">
          <Button 
            size="sm" 
            onClick={() => setShowSaveDialog(true)}
            disabled={nodes.length === 0}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Preset
          </Button>
        </div>
      </div>

      {/* Preset List */}
      <div className="space-y-4 mt-4">
        {presets.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {isLoading ? 'Loading presets...' : 'No presets saved yet'}
          </div>
        ) : (
          presets.map((preset) => (
            <div 
              key={preset.id} 
              className="border border-slate-200 rounded-md p-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-slate-800">{preset.name}</h3>
                  {preset.description && (
                    <p className="text-sm text-slate-500 mt-1">{preset.description}</p>
                  )}
                </div>
                
                <div className="flex space-x-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => openEditDialog(preset)}
                    title="Edit preset"
                  >
                    <Edit className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => deletePreset(preset.id.toString())}
                    title="Delete preset"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              {preset.thumbnail && (
                <div className="mt-2 mb-3">
                  <img 
                    src={preset.thumbnail} 
                    alt={`Thumbnail for ${preset.name}`}
                    className="w-full h-24 object-contain rounded border border-slate-200 bg-slate-50"
                  />
                </div>
              )}
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(preset.nodes) && (
                    (preset.nodes as Node[]).map((node: any) => (
                      node.data?.label && (
                        <Badge key={node.id} variant="outline" className="text-xs">
                          {node.data.label}
                        </Badge>
                      )
                    ))
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => loadPreset(preset)}
                  className="mt-2"
                >
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Load
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Save your current filter configuration as a preset to use later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter a name for your preset"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preset-description">Description (optional)</Label>
              <Textarea
                id="preset-description"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Enter a description for your preset"
                rows={3}
              />
            </div>
            
            {processedImage && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="w-full h-32 bg-slate-50 rounded border border-slate-200 flex items-center justify-center overflow-hidden">
                  <img 
                    src={processedImage} 
                    alt="Preset preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={savePreset} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Preset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Preset Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Filter Preset</DialogTitle>
            <DialogDescription>
              Update your filter preset with the current configuration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-preset-name">Preset Name</Label>
              <Input
                id="edit-preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter a name for your preset"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-preset-description">Description (optional)</Label>
              <Textarea
                id="edit-preset-description"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Enter a description for your preset"
                rows={3}
              />
            </div>
            
            {processedImage && (
              <div className="space-y-2">
                <Label>New Preview</Label>
                <div className="w-full h-32 bg-slate-50 rounded border border-slate-200 flex items-center justify-center overflow-hidden">
                  <img 
                    src={processedImage} 
                    alt="Preset preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={updatePreset} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Preset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}