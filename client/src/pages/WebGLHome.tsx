/**
 * WebGLHome.tsx
 * 
 * Main page component using the GPU-accelerated WebGL filter graph.
 * Integrates ReactFlow with the high-performance WebGL renderer.
 */

import React, { useState, useRef, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

import NodeCanvas from '@/components/NodeCanvas';
import FilterPanel from '@/components/FilterPanel';
import WebGLPreviewPanel from '@/components/WebGLPreviewPanel';
import Header from '@/components/Header';
import { useGLFilterGraph } from '@/hooks/useGLFilterGraph';
import { FilterType } from '@/types';

export default function WebGLHome() {
  // Use the useGLFilterGraph hook for GPU-accelerated processing
  const {
    nodes,
    edges,
    sourceImage,
    processedImage,
    processedImages,
    selectedNodeId,
    zoomLevel,
    nodePreview,
    isProcessing,
    activeOutputNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    uploadImage,
    addNode,
    addOutputNode,
    setSelectedNodeId,
    generateNodePreview,
    requestProcessing,
    zoomIn,
    zoomOut,
    exportImage,
    clearGraph,
    resetNodePositions,
    qualityLevel,
    setQualityLevel,
  } = useGLFilterGraph();
  
  // Track panel widths
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  
  // Handler for adding a filter from the filter panel
  const handleAddFilter = useCallback((filterType: FilterType) => {
    addNode(filterType);
  }, [addNode]);
  
  // Callback for node click
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    generateNodePreview(nodes.find(node => node.id === nodeId)!);
  }, [setSelectedNodeId, generateNodePreview, nodes]);
  
  // Quality change handler
  const handleQualityChange = useCallback((quality: 'preview' | 'draft' | 'full') => {
    setQualityLevel(quality);
    // Request processing with the new quality level
    requestProcessing(quality);
  }, [setQualityLevel, requestProcessing]);
  
  // Handler for starting a new project
  const handleNewProject = useCallback(() => {
    if (confirm('Are you sure you want to start a new project? All unsaved changes will be lost.')) {
      // Clear the graph
      clearGraph();
      
      // Reset the selected node
      setSelectedNodeId(null);
    }
  }, [clearGraph, setSelectedNodeId]);
  
  return (
    <div className="h-screen flex flex-col bg-slate-800">
      {/* Header bar */}
      <Header onNewProject={handleNewProject} />
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Filter library */}
        <FilterPanel 
          width={leftPanelWidth} 
          onAddFilter={handleAddFilter} 
          onUploadImage={uploadImage}
          sourceImage={sourceImage}
          onAddOutputNode={addOutputNode}
        />
        
        {/* Center panel - Node graph */}
        <div className="flex-1 flex flex-col">
          <ReactFlowProvider>
            <NodeCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNodeId}
              zoomIn={zoomIn}
              zoomOut={zoomOut}
              zoomLevel={zoomLevel}
              onUploadImage={uploadImage}
            />
          </ReactFlowProvider>
        </div>
        
        {/* Right panel - Preview */}
        <WebGLPreviewPanel
          width={rightPanelWidth}
          selectedNode={selectedNodeId ? nodes.find(n => n.id === selectedNodeId)! : null}
          nodePreview={nodePreview}
          processedImage={processedImage}
          processedImages={processedImages}
          onExportImage={exportImage}
          nodes={nodes}
          edges={edges}
          isProcessing={isProcessing}
          qualityLevel={qualityLevel}
          onQualityChange={handleQualityChange}
        />
      </div>
    </div>
  );
}