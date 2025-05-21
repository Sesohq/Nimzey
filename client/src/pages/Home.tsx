import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import FilterPanel from '@/components/FilterPanel';
import NodeCanvas from '@/components/NodeCanvas';
import PreviewPanel from '@/components/PreviewPanel';
import StateBasedNodePreviewContainer from '@/components/StateBasedNodePreviewContainer';
import { useFilterGraph } from '@/hooks/useFilterGraph';
import '@/App.css';

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
    isProcessing,
    setNodes
  } = useFilterGraph();
  
  // Handler to update node previews via React state
  const handleUpdatePreview = useCallback((nodeId: string, previewUrl: string) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                preview: previewUrl
              }
            }
          : node
      )
    );
  }, [setNodes]);

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

      {/* State-based node preview container to update node previews via React state */}
      <StateBasedNodePreviewContainer 
        nodes={nodes} 
        onUpdatePreview={handleUpdatePreview} 
      />
    </div>
  );
}
