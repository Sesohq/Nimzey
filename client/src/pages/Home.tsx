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
        <div className="h-full" style={{ width: `${filtersPanelWidth}px` }}>
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
              onAddCustomNode={() => {}}
              onCreateCustomNode={() => setCreateCustomNodeOpen(true)} 
              onDeleteCustomNode={() => {}}
            />
          )}
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
        edges={edges}
        onCreateCustomNode={(customNodeData) => {
          // TODO: Implement actual custom node creation logic
          console.log('Creating custom node:', customNodeData);
          setCreateCustomNodeOpen(false);
        }}
      />
    </div>
  );
}
