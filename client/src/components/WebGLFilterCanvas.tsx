/**
 * WebGLFilterCanvas.tsx
 * 
 * React component for rendering WebGL-accelerated filter graphs.
 * Integrates with the ReactFlow graph and the GPU-accelerated filter engine.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Node, Edge } from 'reactflow';
import { GLRenderer } from '@/gl/core/GLRenderer';
import { FilterNodeData, ImageNodeData } from '@/types';

interface WebGLFilterCanvasProps {
  nodes: Node[];
  edges: Edge[];
  width: number;
  height: number;
  selectedNodeId: string | null;
  onPreviewGenerated?: (dataUrl: string | null) => void;
  onProcessingStateChange?: (isProcessing: boolean) => void;
  qualityLevel?: 'preview' | 'draft' | 'full';
}

const WebGLFilterCanvas: React.FC<WebGLFilterCanvasProps> = ({
  nodes,
  edges,
  width,
  height,
  selectedNodeId,
  onPreviewGenerated,
  onProcessingStateChange,
  qualityLevel = 'draft'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GLRenderer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Initialize WebGL renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Create renderer
    rendererRef.current = new GLRenderer(canvasRef.current);
    
    // Clean up on unmount
    return () => {
      // Cancel animation frame if active
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Dispose renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);
  
  // Update canvas size when dimensions change
  useEffect(() => {
    if (!canvasRef.current) return;
    
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    
    // Update viewport in renderer
    if (rendererRef.current) {
      rendererRef.current.getGL()?.viewport(0, 0, width, height);
    }
  }, [width, height]);
  
  // Process the graph when nodes, edges, or selected node changes
  useEffect(() => {
    if (!rendererRef.current || !nodes.length) return;
    
    // Track processing state
    setIsProcessing(true);
    if (onProcessingStateChange) {
      onProcessingStateChange(true);
    }
    
    // Define the processing function
    const processGraph = async () => {
      try {
        // Compile the graph
        rendererRef.current!.compileGraph(nodes, edges);
        
        // Preload images
        await rendererRef.current!.preloadImages(nodes);
        
        // Render the graph based on quality level
        let options: any = {};
        switch (qualityLevel) {
          case 'preview':
            options = { quality: 'preview', maxDimension: 512, tileSize: 256 };
            break;
          case 'draft':
            options = { quality: 'draft', maxDimension: 1024 };
            break;
          case 'full':
            options = { quality: 'full' };
            break;
        }
        
        // Render and get the result
        const renderedImage = await rendererRef.current!.render(options);
        
        // If a selected node is provided, generate node preview
        if (selectedNodeId) {
          const nodePreview = await rendererRef.current!.getNodePreview(selectedNodeId, 300);
          if (onPreviewGenerated && nodePreview) {
            onPreviewGenerated(nodePreview);
          }
        } else if (onPreviewGenerated) {
          // Otherwise, use the full render
          onPreviewGenerated(renderedImage);
        }
      } catch (err) {
        console.error('Error processing graph:', err);
      } finally {
        // Update processing state
        setIsProcessing(false);
        if (onProcessingStateChange) {
          onProcessingStateChange(false);
        }
      }
    };
    
    // Throttle processing to avoid too frequent updates
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    // If animating, cancel previous frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // If the last update was recent, delay the next one
    if (timeSinceLastUpdate < 100) {
      animationFrameRef.current = requestAnimationFrame(() => {
        processGraph();
        lastUpdateTimeRef.current = Date.now();
      });
    } else {
      // Otherwise process immediately
      processGraph();
      lastUpdateTimeRef.current = now;
    }
    
  }, [nodes, edges, selectedNodeId, qualityLevel, onPreviewGenerated, onProcessingStateChange]);
  
  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="w-full h-full"
      />
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="text-white text-sm">Processing...</div>
        </div>
      )}
    </div>
  );
};

export default WebGLFilterCanvas;