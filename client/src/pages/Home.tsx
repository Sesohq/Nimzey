import { useState } from 'react';
import Header from '@/components/Header';
import FilterPanel from '@/components/FilterPanel';
import NodeCanvas from '@/components/NodeCanvas';
import PreviewPanel from '@/components/PreviewPanel';
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
    addOutputNode,
    selectedNode,
    selectedNodeId,
    processedImage,
    processedImages,
    uploadImage,
    exportImage,
    sourceImage,
    resetCanvas,
    zoomIn,
    zoomOut,
    zoomLevel,
    nodePreview,
    isProcessing
  } = useFilterGraph();

  const [filtersPanelWidth, setFiltersPanelWidth] = useState(256);
  const [previewPanelWidth, setPreviewPanelWidth] = useState(288);

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground">
      <Header onNewProject={resetCanvas} />
      
      <div className="flex flex-1 overflow-hidden">
        <FilterPanel 
          width={filtersPanelWidth} 
          onAddFilter={addNode}
          onUploadImage={uploadImage}
          sourceImage={sourceImage}
          onAddOutputNode={addOutputNode}
        />
        
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
          processedImages={processedImages}
          onExportImage={exportImage}
          nodes={nodes}
          edges={edges}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}
