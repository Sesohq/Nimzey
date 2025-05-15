import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  DownloadIcon,
  ExpandIcon,
  RefreshCwIcon,
  ShrinkIcon,
  EyeIcon,
  EyeOffIcon,
  SlidersIcon,
  LayersIcon
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PreviewPanelProps {
  previewImage?: string;
  className?: string;
  onRefresh?: () => void;
  onDownload?: () => void;
  selectedNodeId?: string;
  nodePreviews?: Record<string, string>;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  previewImage,
  className,
  onRefresh,
  onDownload,
  selectedNodeId,
  nodePreviews = {}
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');
  
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (previewImage) {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = previewImage;
      link.download = 'filtered-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  return (
    <div 
      className={`preview-panel flex flex-col bg-white border-l ${fullscreen ? 'fixed inset-0 z-50' : ''} ${className || ''}`}
    >
      <div className="p-3 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Preview</h2>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
          >
            <RefreshCwIcon className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
          >
            <DownloadIcon className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleFullscreen}
          >
            {fullscreen ? (
              <ShrinkIcon className="h-4 w-4" />
            ) : (
              <ExpandIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-3 mt-2">
          <TabsTrigger value="preview" className="flex items-center">
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <SlidersIcon className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="layers" className="flex items-center">
            <LayersIcon className="h-4 w-4 mr-2" />
            Layer Stack
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="flex-1 p-0 m-0 flex flex-col">
          <div className="p-3 border-b">
            <div className="flex items-center space-x-2">
              <Switch 
                id="show-overlay" 
                checked={showOverlay}
                onCheckedChange={setShowOverlay}
              />
              <Label htmlFor="show-overlay">Show Node Overlay</Label>
            </div>
          </div>
          
          <div className="flex-1 relative overflow-auto p-3 bg-gray-100">
            {previewImage ? (
              <div className="w-full h-full flex items-center justify-center">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain shadow-lg"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No preview available
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="flex-1 p-3 m-0">
          <div className="text-sm">
            <h3 className="font-medium mb-2">Preview Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch id="live-preview" defaultChecked />
                <Label htmlFor="live-preview">Live Preview</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="show-grid" />
                <Label htmlFor="show-grid">Show Grid</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="high-quality" />
                <Label htmlFor="high-quality">High Quality</Label>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="layers" className="flex-1 p-0 m-0">
          <div className="h-full overflow-auto p-3">
            <h3 className="font-medium mb-2 text-sm">Processing Stack</h3>
            
            {Object.keys(nodePreviews).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(nodePreviews).map(([nodeId, preview]) => (
                  <div 
                    key={nodeId} 
                    className={`border rounded-md overflow-hidden ${
                      selectedNodeId === nodeId ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="p-2 bg-gray-50 border-b text-xs font-medium">
                      Node: {nodeId}
                    </div>
                    <div className="p-2">
                      <img 
                        src={preview} 
                        alt={`Node ${nodeId} Preview`} 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">
                No node previews available
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PreviewPanel;