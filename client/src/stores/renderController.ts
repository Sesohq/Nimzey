/**
 * RenderController - Bridges graph state changes to the GPU render pipeline.
 * Handles debouncing, progressive quality, incremental rendering, and per-node preview capture.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GLContext } from '@/gl/core/GLContext';
import { RenderPipeline } from '@/gl/pipeline/RenderPipeline';
import { GraphState } from './graphStore';
import { QualityLevel, ExecutionStep } from '@/types';
import { debugLog } from './debugLog';

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

/** Max number of node previews to capture per animation frame */
const PREVIEWS_PER_FRAME = 6;

/**
 * GPU-accelerated node preview capture.
 * Old path: readPixels(full texture) → CPU pixel loop downsample → toDataURL (slow!)
 * New path: blitTexture(GPU passthrough) → drawImage with scaling (GPU) → toDataURL(64×64 = fast)
 */
function captureSinglePreview(
  step: ExecutionStep,
  ctx: GLContext,
  callback: (nodeId: string, dataUrl: string) => void,
): void {
  if (!step.outputTexture || !step.sourceNodeId) return;

  const preview = getPreviewCanvas();
  if (!preview) return;

  try {
    // 1) Blit the node texture to the GL canvas via GPU passthrough shader
    if (!ctx.blitTexture(step.outputTexture)) return;

    // 2) GPU-accelerated downscale: drawImage from GL canvas → 64×64 preview canvas
    const glCanvas = ctx.getCanvas();
    preview.ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    preview.ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    // 3) Encode the tiny 64×64 canvas (4096 pixels — near-instant JPEG encode)
    const dataUrl = preview.canvas.toDataURL('image/jpeg', 0.6);
    callback(step.sourceNodeId, dataUrl);
  } catch (err) {
    // Silently skip failed previews
  }
}

export function useRenderController(graphState: GraphState, structuralVersion: number, options: RenderControllerOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<GLContext | null>(null);
  const pipelineRef = useRef<RenderPipeline | null>(null);
  const renderTimerRef = useRef<number | null>(null);
  const [quality, setQuality] = useState<QualityLevel>(options.quality || 'draft');
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  // Bumped when the pipeline is (re)created so the render effect re-fires
  const [pipelineReady, setPipelineReady] = useState(0);
  const onNodePreviewRef = useRef(options.onNodePreview);
  onNodePreviewRef.current = options.onNodePreview;

  // Always-fresh refs to avoid stale closures in timers
  const graphStateRef = useRef(graphState);
  graphStateRef.current = graphState;
  const qualityRef = useRef(quality);
  qualityRef.current = quality;

  // Track which image textures have been uploaded (nodeId -> imageUrl)
  const uploadedImagesRef = useRef(new Map<string, string>());

  // Async preview queue
  const previewQueueRef = useRef<ExecutionStep[]>([]);
  const previewRafRef = useRef<number | null>(null);

  // Track render count for debug
  const renderCountRef = useRef(0);

  const outputWidth = options.width || 512;
  const outputHeight = options.height || 512;

  // Initialize WebGL context when canvas is available
  const initCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) {
      debugLog('INIT', 'initCanvas called with null (canvas unmounted)');
      return;
    }

    // If the same canvas is re-attached, skip re-initialization
    if (canvasRef.current === canvas && ctxRef.current) {
      debugLog('INIT', 'initCanvas called with same canvas — skipping');
      return;
    }

    // Dispose previous context and pipeline to prevent GPU memory leak
    // (e.g., fullscreen toggle remounts the canvas element)
    if (pipelineRef.current) {
      debugLog('INIT', 'Disposing previous pipeline before reinit');
      // Cancel any pending preview captures
      if (previewRafRef.current !== null) {
        cancelAnimationFrame(previewRafRef.current);
        previewRafRef.current = null;
      }
      previewQueueRef.current = [];
      pipelineRef.current.dispose();
      pipelineRef.current = null;
      ctxRef.current = null;
      uploadedImagesRef.current.clear();
    }

    canvasRef.current = canvas;

    try {
      const ctx = new GLContext(canvas);
      ctxRef.current = ctx;
      pipelineRef.current = new RenderPipeline(ctx);
      debugLog('INIT', 'Pipeline created successfully', {
        canvasW: canvas.width,
        canvasH: canvas.height,
      });
      // Signal that pipeline is ready so the render effect re-fires
      setPipelineReady(v => v + 1);
    } catch (err) {
      debugLog('INIT', 'FAILED to create pipeline', { error: String(err) });
      console.error('Failed to initialize WebGL:', err);
    }
  }, []);

  // Process the preview queue: capture at most PREVIEWS_PER_FRAME per frame
  const processPreviewQueue = useCallback(() => {
    const ctx = ctxRef.current;
    const callback = onNodePreviewRef.current;
    if (!ctx || !callback) {
      previewQueueRef.current = [];
      return;
    }

    const queue = previewQueueRef.current;
    const batch = queue.splice(0, PREVIEWS_PER_FRAME);

    for (const step of batch) {
      captureSinglePreview(step, ctx, callback);
    }

    // Schedule next batch if queue isn't empty
    if (queue.length > 0) {
      previewRafRef.current = requestAnimationFrame(processPreviewQueue);
    } else {
      previewRafRef.current = null;
    }
  }, []);

  // Kick off async preview capture: fill the queue from the render plan
  const captureNodePreviews = useCallback(() => {
    const pipeline = pipelineRef.current;
    if (!pipeline || !pipeline.lastPlan || !onNodePreviewRef.current) return;

    // Cancel any pending preview frame
    if (previewRafRef.current !== null) {
      cancelAnimationFrame(previewRafRef.current);
      previewRafRef.current = null;
    }

    // Fill queue with all steps that have output textures
    previewQueueRef.current = pipeline.lastPlan.filter(
      step => step.outputTexture && step.sourceNodeId
    );

    // Start processing on the next frame
    if (previewQueueRef.current.length > 0) {
      debugLog('RENDER', `Queued ${previewQueueRef.current.length} GPU-accelerated thumbnail captures`);
      previewRafRef.current = requestAnimationFrame(processPreviewQueue);
    }
  }, [processPreviewQueue]);

  // Core render function — always reads from refs so it's never stale
  const doRender = useCallback((qualityOverride?: QualityLevel) => {
    const pipeline = pipelineRef.current;
    if (!pipeline) {
      debugLog('RENDER', 'doRender skipped — no pipeline');
      return;
    }

    const currentGraph = graphStateRef.current;
    const q = qualityOverride || qualityRef.current;

    let w = outputWidth;
    let h = outputHeight;
    if (q === 'preview') {
      w = Math.max(128, outputWidth >> 2);
      h = Math.max(128, outputHeight >> 2);
    } else if (q === 'draft') {
      w = Math.max(256, outputWidth >> 1);
      h = Math.max(256, outputHeight >> 1);
    }

    renderCountRef.current++;
    const renderNum = renderCountRef.current;

    try {
      const nodeCount = currentGraph.nodes.size;
      const edgeCount = currentGraph.edges.size;
      pipeline.render(currentGraph, w, h);
      const planSteps = pipeline.lastPlan?.length ?? 0;
      const dataUrl = pipeline.toDataURL();
      const hasImage = dataUrl.length > 100; // data:image/png;base64, is ~22 chars for blank
      setProcessedImage(dataUrl);
      debugLog('RENDER', `#${renderNum} OK`, {
        quality: q,
        size: `${w}x${h}`,
        nodes: nodeCount,
        edges: edgeCount,
        planSteps,
        dataUrlLen: dataUrl.length,
        hasImage,
      });
    } catch (err) {
      debugLog('RENDER', `#${renderNum} FAILED`, { error: String(err) });
      console.error('Render error:', err);
    }
  }, [outputWidth, outputHeight]);

  // Debounced render on structural changes (NOT on preview/thumbnail updates).
  // doRender reads from graphStateRef so it always has the latest state.
  // structuralVersion is bumped by addNode/removeNode/connect/disconnect/setParameter.
  // pipelineReady is bumped when the GL pipeline is (re)created.
  useEffect(() => {
    if (!pipelineRef.current) {
      debugLog('EFFECT', 'Render effect — no pipeline, skipping', {
        pipelineReady,
        structuralVersion,
      });
      return;
    }

    debugLog('EFFECT', 'Render effect triggered — scheduling render', {
      pipelineReady,
      structuralVersion,
      nodeCount: graphStateRef.current.nodes.size,
      edgeCount: graphStateRef.current.edges.size,
    });

    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);

    renderTimerRef.current = window.setTimeout(() => {
      debugLog('TIMER', 'Debounce timer fired — calling doRender');
      doRender();
      captureNodePreviews();
    }, 50);

    return () => {
      if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    };
  }, [structuralVersion, pipelineReady, doRender, captureNodePreviews]);

  // Restore image textures on document load or pipeline recreation
  // When pipelineReady changes, a new GL context exists — old textures are gone
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) {
      debugLog('IMAGE', 'Image restore effect — no ctx, skipping');
      return;
    }

    // New GL context means all previous uploads are invalid
    uploadedImagesRef.current.clear();

    const imageNodes: string[] = [];
    for (const [nodeId, node] of graphState.nodes) {
      if (node.definitionId === 'image' && node.imageUrl) {
        imageNodes.push(nodeId);
        uploadedImagesRef.current.set(nodeId, node.imageUrl);

        const img = new window.Image();
        img.onload = () => {
          const texName = `node_${nodeId}_out`;
          ctx.createManagedTexture(texName, img.width, img.height, 'uint8', img);
          debugLog('IMAGE', `Restored texture for ${nodeId}`, {
            texName,
            imgW: img.width,
            imgH: img.height,
          });
          doRender();
        };
        img.onerror = () => {
          debugLog('IMAGE', `FAILED to load image for ${nodeId}`);
        };
        img.src = node.imageUrl;
      }
    }
    debugLog('IMAGE', `Pipeline recreation — restoring ${imageNodes.length} image(s)`, {
      pipelineReady,
      imageNodes,
    });
  }, [pipelineReady, doRender]);

  // Re-upload new images added after initial load.
  // Triggered by structuralVersion (setNodeImage calls bumpVersion), not graphState
  // to avoid the render loop from setNodePreview.
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const currentGraph = graphStateRef.current;
    for (const [nodeId, node] of currentGraph.nodes) {
      if (node.definitionId === 'image' && node.imageUrl) {
        const prevUrl = uploadedImagesRef.current.get(nodeId);
        if (prevUrl === node.imageUrl) continue;
        uploadedImagesRef.current.set(nodeId, node.imageUrl);

        debugLog('IMAGE', `New image detected for ${nodeId}`);
        const img = new window.Image();
        img.onload = () => {
          const texName = `node_${nodeId}_out`;
          ctx.createManagedTexture(texName, img.width, img.height, 'uint8', img);
          debugLog('IMAGE', `Uploaded new texture for ${nodeId}`, {
            texName,
            imgW: img.width,
            imgH: img.height,
          });
          doRender();
        };
        img.src = node.imageUrl;
      }
    }
  }, [structuralVersion, doRender]);

  // Force immediate render
  const renderNow = useCallback(() => {
    debugLog('RENDER', 'renderNow called');
    doRender();
  }, [doRender]);

  // Upload a source image to a node
  const uploadImage = useCallback((nodeId: string, image: HTMLImageElement) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const texName = `node_${nodeId}_out`;
    ctx.createManagedTexture(texName, image.width, image.height, 'uint8', image);
    debugLog('IMAGE', `uploadImage called for ${nodeId}`, {
      texName,
      imgW: image.width,
      imgH: image.height,
    });
  }, []);

  // Export full resolution
  const exportImage = useCallback((format: 'png' | 'jpeg' = 'png', quality_level: number = 1): string | null => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return null;

    // Render at full resolution using latest graph state
    pipeline.render(graphStateRef.current, outputWidth, outputHeight);
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL(`image/${format}`, quality_level);
  }, [outputWidth, outputHeight]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (previewRafRef.current !== null) {
        cancelAnimationFrame(previewRafRef.current);
      }
      pipelineRef.current?.dispose();
      debugLog('INIT', 'Pipeline disposed (cleanup)');
    };
  }, []);

  // Expose GL context for reading node textures (used by bakeToImage)
  const getContext = useCallback(() => ctxRef.current, []);

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
    getContext,
  };
}
