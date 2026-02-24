/**
 * Home - Main application page.
 * Uses the unified GPU-accelerated pipeline with registry-driven node system.
 */

import { useState, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

import Header from '@/components/Header';
import FilterPanel from '@/components/FilterPanel';
import NodeCanvas from '@/components/NodeCanvas';
import PreviewPanel from '@/components/PreviewPanel';
import { useNimzeyGraph } from '@/hooks/useNimzeyGraph';

function HomeContent() {
  const graph = useNimzeyGraph({ quality: 'draft' });
  const [leftPanelWidth] = useState(260);
  const [rightPanelWidth] = useState(320);

  const handleNewProject = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-950 text-zinc-100">
      <Header onNewProject={handleNewProject} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left - Node palette */}
        <FilterPanel
          width={leftPanelWidth}
          onAddNode={graph.addNode}
          onUploadImage={graph.uploadSourceImage}
        />

        {/* Center - Graph editor */}
        <NodeCanvas
          nodes={graph.nodes}
          edges={graph.edges}
          graphState={graph.graphState}
          onNodesChange={graph.onNodesChange}
          onEdgesChange={graph.onEdgesChange}
          onConnect={graph.onConnect}
          onNodeClick={graph.onNodeClick}
          onParameterChange={graph.onParameterChange}
          onToggleEnabled={graph.onToggleEnabled}
          onToggleCollapsed={graph.onToggleCollapsed}
          onSetColorTag={graph.onSetColorTag}
          onUploadImage={graph.uploadNodeImage}
          onDrop={graph.onDrop}
        />

        {/* Right - Preview */}
        <PreviewPanel
          width={rightPanelWidth}
          processedImage={graph.processedImage}
          isRendering={graph.isRendering}
          quality={graph.quality}
          onQualityChange={graph.setQuality}
          onExportImage={graph.exportImage}
          initCanvas={graph.initCanvas}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <HomeContent />
    </ReactFlowProvider>
  );
}
