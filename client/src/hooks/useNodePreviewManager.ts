import { useState, useCallback, useRef, useEffect } from 'react';
import { Node } from 'reactflow';
import { FilterNodeData } from '@/types';

/**
 * Hook for managing node previews using the approach from the example
 * This follows the recursive image processing system with caching
 */
export function useNodePreviewManager(nodes: Node[], edges: any[]) {
  // Cache for storing processed node previews
  const processedImageCache = useRef<Map<string, string>>(new Map());
  
  // Update node data with new preview
  const updateNodePreview = useCallback((nodeId: string, previewUrl: string, setNodes: any) => {
    setNodes((currentNodes: Node[]) =>
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
  }, []);

  // Clear cache for a node and all downstream nodes
  const clearDownstreamCache = useCallback((nodeId: string) => {
    const downstreamNodeIds = new Set<string>();
    
    // Find all nodes that get input (directly or indirectly) from this node
    const findDownstreamNodes = (id: string) => {
      edges.forEach(edge => {
        if (edge.source === id) {
          downstreamNodeIds.add(edge.target);
          findDownstreamNodes(edge.target);
        }
      });
    };
    
    findDownstreamNodes(nodeId);
    
    // Clear cache entries
    processedImageCache.current.delete(nodeId);
    downstreamNodeIds.forEach(id => {
      processedImageCache.current.delete(id);
    });
  }, [edges]);

  // Get processed image for a specific node
  const getProcessedImage = useCallback(async (nodeId: string, setNodes: any): Promise<string | null> => {
    // Check cache first for performance
    if (processedImageCache.current.has(nodeId)) {
      return processedImageCache.current.get(nodeId) || null;
    }
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    // For image source nodes, just return the original image
    if (node.data.type === 'image') {
      return node.data.imageDataUrl || null;
    }
    
    // For filter nodes, find the input and process it
    const inputEdge = edges.find(edge => edge.target === nodeId);
    if (!inputEdge) return null;
    
    // Recursively get the source image (this handles chains of filters)
    const inputImageUrl = await getProcessedImage(inputEdge.source, setNodes);
    if (!inputImageUrl) return null;
    
    // Apply the current filter to the input image
    const filterType = node.data.type;
    const settings = node.data.settings || {};
    
    try {
      // Apply the filter and get the result
      const resultImageUrl = await applyFilter(inputImageUrl, filterType, settings);
      
      // Cache the result for better performance
      processedImageCache.current.set(nodeId, resultImageUrl);
      
      // Update the node's preview display
      updateNodePreview(nodeId, resultImageUrl, setNodes);
      
      return resultImageUrl;
    } catch (error) {
      console.error(`Error applying ${filterType} filter:`, error);
      return null;
    }
  }, [nodes, edges, updateNodePreview]);

  // Apply a filter to an image
  const applyFilter = useCallback(async (
    imageDataUrl: string,
    filterType: string,
    settings: Record<string, any>
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Create a canvas to process the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Simple filter placeholder - in production this would call your actual filter algorithms
        // You would replace this with your actual filter implementation
        switch (filterType) {
          case 'blur':
            // Apply blur filter - simple example
            ctx.filter = `blur(${(settings.intensity || 0.5) * 10}px)`;
            ctx.drawImage(img, 0, 0);
            ctx.filter = 'none';
            break;
          case 'grayscale':
            // Apply grayscale
            ctx.filter = `grayscale(${(settings.intensity || 1) * 100}%)`;
            ctx.drawImage(img, 0, 0);
            ctx.filter = 'none';
            break;
          case 'invert':
            // Invert colors
            ctx.filter = `invert(${(settings.intensity || 1) * 100}%)`;
            ctx.drawImage(img, 0, 0);
            ctx.filter = 'none';
            break;
          case 'noise':
            // Simple noise effect (would be more complex in reality)
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const noiseAmount = (settings.intensity || 0.5) * 50;
            
            for (let i = 0; i < imageData.data.length; i += 4) {
              const noise = (Math.random() * 2 - 1) * noiseAmount;
              imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] + noise));
              imageData.data[i+1] = Math.min(255, Math.max(0, imageData.data[i+1] + noise));
              imageData.data[i+2] = Math.min(255, Math.max(0, imageData.data[i+2] + noise));
            }
            
            ctx.putImageData(imageData, 0, 0);
            break;
          default:
            // For unknown filters, do nothing
            break;
        }
        
        // Return the processed image as a data URL
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageDataUrl;
    });
  }, []);

  return {
    getProcessedImage,
    clearDownstreamCache,
    updateNodePreview
  };
}