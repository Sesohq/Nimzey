import { useState } from 'react';
import Header from '@/components/Header';
import FilterPanel from '@/components/FilterPanel';
import NodeCanvas from '@/components/NodeCanvas';
import PreviewPanel from '@/components/PreviewPanel';
import PresetPanel from '@/components/PresetPanel';
import CustomNodesPanel from '@/components/CustomNodesPanel';
import CreateCustomNodeDialog from '@/components/CreateCustomNodeDialog';
import { useFilterGraph } from '@/hooks/useFilterGraph';

export default function Home() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeSelect,
    addNode,
    addCustomNode,
    createCustomNode,
    selectedNode,
    selectedNodeId,
    processedImage,
    uploadImage,
    exportImage,
    sourceImage,
    resetCanvas,
    zoomIn,
    zoomOut,
    zoomLevel,
    nodePreview,
    loadPreset
  } = useFilterGraph();

  const [filtersPanelWidth, setFiltersPanelWidth] = useState(256);
  const [previewPanelWidth, setPreviewPanelWidth] = useState(288);
  // Add state for selected tab in the left panel
  const [activeLeftTab, setActiveLeftTab] = useState<'filters' | 'presets' | 'customNodes'>('filters');
  
  // State for custom node creation dialog
  const [createCustomNodeOpen, setCreateCustomNodeOpen] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground">
      <Header onNewProject={resetCanvas} onExportImage={exportImage} />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="h-full flex flex-col" style={{ width: `${filtersPanelWidth}px` }}>
          <div className="flex border-b">
            <button 
              className={`flex-1 py-2 px-4 text-sm font-medium ${activeLeftTab === 'filters' ? 'bg-muted border-b-2 border-primary' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveLeftTab('filters')}
            >
              Filters
            </button>
            <button 
              className={`flex-1 py-2 px-4 text-sm font-medium ${activeLeftTab === 'presets' ? 'bg-muted border-b-2 border-primary' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveLeftTab('presets')}
            >
              Presets
            </button>
            <button 
              className={`flex-1 py-2 px-4 text-sm font-medium ${activeLeftTab === 'customNodes' ? 'bg-muted border-b-2 border-primary' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveLeftTab('customNodes')}
            >
              Custom
            </button>
          </div>
          
          {/* Upload Image Button - Now at the top of the panel */}
          <div className="px-2 py-2 flex-shrink-0 bg-[#0A0D14]">
            <button 
              className="w-full flex items-center justify-center h-9 text-sm font-medium text-white relative overflow-hidden"
              style={{
                background: '#2A5DCE',
                border: 'none',
                borderRadius: '5px',
                boxShadow: '0 0 10px rgba(0, 182, 254, 0.3)'
              }}
              onClick={() => document.getElementById('imageUpload')?.click()}
            >
              <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 8L12 3L7 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Upload Image
            </button>
            <input 
              type="file" 
              id="imageUpload" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  uploadImage(e.target.files[0]);
                }
              }}
            />
          </div>
          
          <div className="flex-1 overflow-hidden">
            {activeLeftTab === 'filters' ? (
              <FilterPanel 
                width={filtersPanelWidth} 
                onAddFilter={addNode}
                onUploadImage={uploadImage}
                sourceImage={sourceImage}
              />
            ) : activeLeftTab === 'presets' ? (
              <PresetPanel
                width={filtersPanelWidth}
                nodes={nodes}
                edges={edges}
                onLoadPreset={loadPreset}
                processedImage={processedImage}
              />
            ) : (
              <CustomNodesPanel
                width={filtersPanelWidth}
                onAddCustomNode={addCustomNode}
                onCreateCustomNode={() => setCreateCustomNodeOpen(true)} 
                onDeleteCustomNode={() => {}}
              />
            )}
          </div>
        </div>
        
        <NodeCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeSelect}
          selectedNodeId={selectedNodeId}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          zoomLevel={zoomLevel}
          onUploadImage={uploadImage}
        />
        
        <PreviewPanel 
          width={previewPanelWidth}
          selectedNode={selectedNode}
          nodePreview={nodePreview}
          processedImage={processedImage}
          onExportImage={exportImage}
          nodes={nodes}
          edges={edges}
        />
      </div>
      
      {/* Custom Node Creation Dialog */}
      <CreateCustomNodeDialog
        open={createCustomNodeOpen}
        onOpenChange={setCreateCustomNodeOpen}
        selectedNodes={nodes.filter(node => node.selected)}
        allNodes={nodes}
        edges={edges}
        onCreateCustomNode={async (customNodeData) => {
          await createCustomNode(customNodeData);
          setCreateCustomNodeOpen(false);
        }}
      />
    </div>
  );
}
