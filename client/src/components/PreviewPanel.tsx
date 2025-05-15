import React, { useState } from 'react';
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
      className={`flex flex-col bg-white ${fullscreen ? 'fixed inset-0 z-50' : ''} ${className || ''}`}
    >
      <div className="p-3 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Preview</h2>
        
        <div className="flex items-center space-x-2">
          <button 
            className="p-1.5 hover:bg-gray-100 rounded" 
            onClick={onRefresh}
          >
            <RefreshCwIcon className="h-4 w-4" />
          </button>
          
          <button 
            className="p-1.5 hover:bg-gray-100 rounded" 
            onClick={handleDownload}
          >
            <DownloadIcon className="h-4 w-4" />
          </button>
          
          <button 
            className="p-1.5 hover:bg-gray-100 rounded" 
            onClick={toggleFullscreen}
          >
            {fullscreen ? (
              <ShrinkIcon className="h-4 w-4" />
            ) : (
              <ExpandIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      
      <div className="tabs flex border-b">
        <button
          className={`px-4 py-2 text-sm ${activeTab === 'preview' 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-600'}`}
          onClick={() => setActiveTab('preview')}
        >
          <span className="flex items-center">
            <EyeIcon className="h-4 w-4 mr-1" />
            Preview
          </span>
        </button>
        
        <button
          className={`px-4 py-2 text-sm ${activeTab === 'settings' 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-600'}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="flex items-center">
            <SlidersIcon className="h-4 w-4 mr-1" />
            Settings
          </span>
        </button>
        
        <button
          className={`px-4 py-2 text-sm ${activeTab === 'layers' 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-600'}`}
          onClick={() => setActiveTab('layers')}
        >
          <span className="flex items-center">
            <LayersIcon className="h-4 w-4 mr-1" />
            Layers
          </span>
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' && (
          <div className="flex-1 relative overflow-auto p-3 bg-gray-100 h-full">
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
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">No preview available</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="p-4">
            <h3 className="font-medium mb-3 text-sm">Preview Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center mb-1">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span className="text-sm">Live Preview</span>
                </label>
                <p className="text-xs text-gray-500">
                  Automatically updates the preview when nodes or connections change
                </p>
              </div>
              
              <div>
                <label className="flex items-center mb-1">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Show Grid</span>
                </label>
                <p className="text-xs text-gray-500">
                  Display a grid in the preview background
                </p>
              </div>
              
              <div>
                <label className="flex items-center mb-1">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">High Quality</span>
                </label>
                <p className="text-xs text-gray-500">
                  Generate previews at higher quality (slower)
                </p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'layers' && (
          <div className="h-full overflow-auto p-3">
            <h3 className="font-medium mb-3 text-sm">Processing Stack</h3>
            
            {Object.keys(nodePreviews).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(nodePreviews).map(([nodeId, preview]) => (
                  <div 
                    key={nodeId} 
                    className={`border rounded-md overflow-hidden ${
                      selectedNodeId === nodeId ? 'ring-2 ring-blue-500' : ''
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
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;