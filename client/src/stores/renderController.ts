/**
 * RenderController - Bridges graph state changes to the GPU render pipeline.
 * Handles debouncing, progressive quality, incremental rendering, and per-node preview capture.
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
  onNodePreview?: (nodeId: string, dataUrl: string) => void;
}

// Small offscreen canvas for generating preview thumbnails
const PREVIEW_SIZE = 64;
let previewCanvas: HTMLCanvasElement | null = null;
let previewCtx2d: CanvasRenderingContext2D | null = null;

function getPreviewCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (!previewCanvas) {
    previewCanvas = document.createElement('canvas');
    previewCanvas.width = PREVIEW_SIZE;
    previewCanvas.height = PREVIEW_SIZE;
    previewCtx2d = previewCanvas.getContext('2d');
  }
  if (!previewCtx2d) return null;
  return { canvas: previewCanvas, ctx: previewCtx2d };
}

export function useRenderController(graphState: GraphState, options: RenderControllerOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<GLContext | null>(null);
  const pipelineRef = useRef<RenderPipeline | null>(null);
  const renderTimerRef = useRef<number | null>(null);
  const [quality, setQuality] = useState<QualityLevel>(options.quality || 'draft');
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const onNodePreviewRef = useRef(options.onNodePreview);
  onNodePreviewRef.current = options.onNodePreview;

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

  // Capture per-node preview thumbnails from intermediate textures
  const captureNodePreviews = useCallback(() => {
    const pipeline = pipelineRef.current;
    const ctx = ctxRef.current;
    const callback = onNodePreviewRef.current;
    if (!pipeline || !ctx || !callback || !pipeline.lastPlan) return;

    const preview = getPreviewCanvas();
    if (!preview) return;

    for (const step of pipeline.lastPlan) {
      // Skip result node (renders to canvas, not a named texture)
      if (!step.outputTexture || !step.sourceNodeId) continue;

      try {
        const pixels = ctx.readPixels(step.outputTexture);
        if (pixels.length === 0) continue;

        // Determine the texture dimensions from the viewport
        const texW = step.viewport.width;
        const texH = step.viewport.height;

        // Create ImageData from the raw pixels (flip Y since WebGL is bottom-up)
        const imageData = new ImageData(PREVIEW_SIZE, PREVIEW_SIZE);
        const scaleX = texW / PREVIEW_SIZE;
        const scaleY = texH / PREVIEW_SIZE;

        for (let y = 0; y < PREVIEW_SIZE; y++) {
          // Flip Y: preview row y corresponds to texture row (texH - 1 - y*scaleY)
          const srcY = Math.min(texH - 1, Math.floor((PREVIEW_SIZE - 1 - y) * scaleY));
          for (let x = 0; x < PREVIEW_SIZE; x++) {
            const srcX = Math.min(texW - 1, Math.floor(x * scaleX));
            const srcIdx = (srcY * texW + srcX) * 4;
            const dstIdx = (y * PREVIEW_SIZE + x) * 4;
            imageData.data[dstIdx] = pixels[srcIdx];
            imageData.data[dstIdx + 1] = pixels[srcIdx + 1];
            imageData.data[dstIdx + 2] = pixels[srcIdx + 2];
            imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
          }
        }

        preview.ctx.putImageData(imageData, 0, 0);
        const dataUrl = preview.canvas.toDataURL('image/jpeg', 0.6);
        callback(step.sourceNodeId, dataUrl);
      } catch (err) {
        // Silently skip failed previews
      }
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

    // Then full quality after settling + capture node previews
    renderTimerRef.current = window.setTimeout(() => {
      render();
      // Capture node previews after the full-quality render
      captureNodePreviews();
    }, quality === 'full' ? 500 : 200);

    return () => {
      clearTimeout(quickTimer);
      if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    };
  }, [graphState, render, quality, captureNodePreviews]);

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
