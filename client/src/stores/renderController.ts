/**
 * RenderController - Bridges graph state changes to the GPU render pipeline.
 * Handles debouncing, progressive quality, and incremental rendering.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GLContext } from '@/gl/core/GLContext';
import { RenderPipeline } from '@/gl/pipeline/RenderPipeline';
import { GraphState } from './graphStore';
import { QualityLevel } from '@/types';

interface RenderControllerOptions {
  width?: number;
  height?: number;
  quality?: QualityLevel;
}

export function useRenderController(graphState: GraphState, options: RenderControllerOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<GLContext | null>(null);
  const pipelineRef = useRef<RenderPipeline | null>(null);
  const renderTimerRef = useRef<number | null>(null);
  const [quality, setQuality] = useState<QualityLevel>(options.quality || 'draft');
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const outputWidth = options.width || 512;
  const outputHeight = options.height || 512;

  // Initialize WebGL context when canvas is available
  const initCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    canvasRef.current = canvas;

    try {
      const ctx = new GLContext(canvas);
      ctxRef.current = ctx;
      pipelineRef.current = new RenderPipeline(ctx);
    } catch (err) {
      console.error('Failed to initialize WebGL:', err);
    }
  }, []);

  // Render the current graph
  const render = useCallback(() => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    setIsRendering(true);

    try {
      // Compute render dimensions based on quality
      let w = outputWidth;
      let h = outputHeight;
      if (quality === 'preview') {
        w = Math.max(128, outputWidth >> 2);
        h = Math.max(128, outputHeight >> 2);
      } else if (quality === 'draft') {
        w = Math.max(256, outputWidth >> 1);
        h = Math.max(256, outputHeight >> 1);
      }

      pipeline.render(graphState, w, h);
      const dataUrl = pipeline.toDataURL();
      setProcessedImage(dataUrl);
    } catch (err) {
      console.error('Render error:', err);
    } finally {
      setIsRendering(false);
    }
  }, [graphState, quality, outputWidth, outputHeight]);

  // Debounced render on graph changes
  useEffect(() => {
    if (!pipelineRef.current) return;

    if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current);
    }

    // Quick preview first
    const quickTimer = setTimeout(() => {
      const savedQuality = quality;
      setQuality('preview');
      render();
      setQuality(savedQuality);
    }, 16);

    // Then full quality after settling
    renderTimerRef.current = window.setTimeout(() => {
      render();
    }, quality === 'full' ? 500 : 200);

    return () => {
      clearTimeout(quickTimer);
      if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    };
  }, [graphState, render, quality]);

  // Force immediate render
  const renderNow = useCallback(() => {
    render();
  }, [render]);

  // Upload a source image to a node
  const uploadImage = useCallback((nodeId: string, image: HTMLImageElement) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const texName = `node_${nodeId}_out`;
    ctx.createManagedTexture(texName, image.width, image.height, 'uint8', image);
  }, []);

  // Export full resolution
  const exportImage = useCallback((format: 'png' | 'jpeg' = 'png', quality_level: number = 1): string | null => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return null;

    // Render at full resolution
    pipeline.render(graphState, outputWidth, outputHeight);
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL(`image/${format}`, quality_level);
  }, [graphState, outputWidth, outputHeight]);

  // Cleanup
  useEffect(() => {
    return () => {
      pipelineRef.current?.dispose();
    };
  }, []);

  return {
    canvasRef,
    initCanvas,
    processedImage,
    isRendering,
    quality,
    setQuality,
    render: renderNow,
    uploadImage,
    exportImage,
  };
}
