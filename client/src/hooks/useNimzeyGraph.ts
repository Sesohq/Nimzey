/**
 * useNimzeyGraph - Integration hook composing graphStore + renderController + ReactFlowAdapter.
 * Replaces both useFilterGraph.ts and useGLFilterGraph.ts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Node as RFNode,
  Edge as RFEdge,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from 'reactflow';
import { useGraphStore, GraphState } from '@/stores/graphStore';
import { useRenderController } from '@/stores/renderController';
import {
  graphStateToReactFlow,
  connectionToEdge,
} from '@/adapters/ReactFlowAdapter';
import { NodeRegistry } from '@/registry/nodes';
import { DataType, NimzeyNodeData, NodeColorTag, NodeDefinition, QualityLevel, GraphEdge } from '@/types';
import { graphTemplates } from '@/templates/graphTemplates';
import { effectPresets, EffectPreset } from '@/data/effectPresets';
import { useHistory } from './useHistory';
import { SerializedGraph } from '@/utils/graphSerializer';
import { debugLog } from '@/stores/debugLog';

// ---------------------------------------------------------------------------
// Pure helpers for auto-connect position calculation
// ---------------------------------------------------------------------------

const NODE_GAP = 280;

function computeAutoPosition(
  def: NodeDefinition,
  state: GraphState,
): { x: number; y: number } {
  const resultNode = state.nodes.get(state.resultNodeId);
  if (!resultNode) return { x: 200, y: 200 };

  // Find edge feeding Result's source
  let existingEdge: GraphEdge | undefined;
  for (const edge of state.edges.values()) {
    if (edge.targetNodeId === state.resultNodeId && edge.targetPortId === 'source') {
      existingEdge = edge;
      break;
    }
  }

  if (def.isGenerator) {
    if (!existingEdge) {
      return { x: resultNode.position.x - NODE_GAP, y: resultNode.position.y };
    }
    // Place below the existing upstream node
    const upstream = state.nodes.get(existingEdge.sourceNodeId);
    return {
      x: upstream ? upstream.position.x : resultNode.position.x - NODE_GAP,
      y: (upstream ? upstream.position.y : resultNode.position.y) + 150,
    };
  }

  // Processor
  if (!existingEdge) {
    return { x: resultNode.position.x - NODE_GAP, y: resultNode.position.y };
  }

  // Splice: place to the right of upstream with fixed spacing
  const upstreamNode = state.nodes.get(existingEdge.sourceNodeId);
  if (upstreamNode) {
    return {
      x: upstreamNode.position.x + NODE_GAP,
      y: upstreamNode.position.y,
    };
  }

  return { x: resultNode.position.x - NODE_GAP, y: resultNode.position.y };
}

export function useNimzeyGraph(options?: { quality?: QualityLevel; width?: number; height?: number }) {
  const graph = useGraphStore();
  const renderer = useRenderController(graph.state, graph.structuralVersion, {
    width: options?.width,
    height: options?.height,
    quality: options?.quality,
    onNodePreview: graph.setNodePreview,
  });
  const [lastAddedNodeId, setLastAddedNodeId] = useState<string | null>(null);
  const [lastAddedDefinitionId, setLastAddedDefinitionId] = useState<string | null>(null);

  // ---- Undo/Redo ----
  const history = useHistory();
  const isUndoRedoRef = useRef(false);
  const initializedRef = useRef(false);

  // Strip large imageUrl data from history snapshots to prevent memory bloat.
  // A 4 MB image × 50 undo states = 200 MB of duplicated data URLs.
  // Images are preserved via the renderController's uploadedImagesRef instead.
  const getHistorySnapshot = useCallback(() => {
    const state = graph.getSerializedState();
    return {
      ...state,
      nodes: state.nodes.map(n => n.imageUrl ? { ...n, imageUrl: undefined } : n),
    };
  }, [graph]);

  // Record history snapshots on structural changes (debounced 300ms)
  useEffect(() => {
    // Skip recording during undo/redo operations
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Push initial state immediately on first mount
    if (!initializedRef.current) {
      initializedRef.current = true;
      history.pushState(getHistorySnapshot());
      return;
    }

    // Debounce subsequent changes (coalesces rapid updates like node dragging)
    const timer = setTimeout(() => {
      history.pushState(getHistorySnapshot());
    }, 300);

    return () => clearTimeout(timer);
  }, [graph.structuralVersion]);

  // Re-apply imageUrls from the current live state into a restored history snapshot.
  // History snapshots strip imageUrl to save memory, so we merge them back from
  // the live graph (GPU textures are still valid — only the URL reference was stripped).
  const mergeImageUrls = useCallback((snapshot: SerializedGraph): SerializedGraph => {
    const currentNodes = graph.state.nodes;
    let changed = false;
    const mergedNodes = snapshot.nodes.map(n => {
      if (!n.imageUrl) {
        const live = currentNodes.get(n.id);
        if (live?.imageUrl) {
          changed = true;
          return { ...n, imageUrl: live.imageUrl, width: live.width, height: live.height };
        }
      }
      return n;
    });
    return changed ? { ...snapshot, nodes: mergedNodes } : snapshot;
  }, [graph.state.nodes]);

  const undo = useCallback(() => {
    const prevState = history.undo();
    if (!prevState) return;
    debugLog('EDGE', `undo: restoring state`, { nodes: prevState.nodes.length, edges: prevState.edges.length });
    isUndoRedoRef.current = true;
    graph.loadFromSerialized(mergeImageUrls(prevState));
  }, [history, graph, mergeImageUrls]);

  const redo = useCallback(() => {
    const nextState = history.redo();
    if (!nextState) return;
    debugLog('EDGE', `redo: restoring state`, { nodes: nextState.nodes.length, edges: nextState.edges.length });
    isUndoRedoRef.current = true;
    graph.loadFromSerialized(mergeImageUrls(nextState));
  }, [history, graph, mergeImageUrls]);

  // Convert internal state to ReactFlow format
  const { nodes: rfNodes, edges: rfEdges } = useMemo(
    () => graphStateToReactFlow(graph.state),
    [graph.state],
  );

  // ---- ReactFlow event handlers ----

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        graph.updateNodePosition(change.id, change.position);
      }
      if (change.type === 'remove') {
        debugLog('EDGE', `onNodesChange: node remove "${change.id}"`);
        graph.removeNode(change.id);
      }
      if (change.type === 'select') {
        if (change.selected) {
          graph.selectNode(change.id);
        }
      }
    }
  }, [graph]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    for (const change of changes) {
      if (change.type === 'remove') {
        debugLog('EDGE', `onEdgesChange: edge remove "${change.id}"`, {
          caller: new Error().stack?.split('\n')[2]?.trim() || 'unknown',
        });
        graph.disconnect(change.id);
      }
      if (change.type === 'select') {
        graph.selectEdge(change.id, change.selected);
      }
    }
  }, [graph]);

  const onConnect = useCallback((connection: Connection) => {
    const edge = connectionToEdge(connection);
    if (!edge) return;
    debugLog('EDGE', `onConnect: ${edge.sourceNodeId}:${edge.sourcePortId} → ${edge.targetNodeId}:${edge.targetPortId}`);
    graph.connect(edge.sourceNodeId, edge.sourcePortId, edge.targetNodeId, edge.targetPortId);
  }, [graph]);

  // ---- Node actions ----

  const addNode = useCallback((definitionId: string, position?: { x: number; y: number }) => {
    const pos = position || { x: 200, y: 200 };
    return graph.addNode(definitionId, pos);
  }, [graph]);

  // Smart auto-connect: adds node and wires it into the chain
  const autoConnectNode = useCallback((definitionId: string, position?: { x: number; y: number }) => {
    const def = NodeRegistry.get(definitionId);
    if (!def) return '';
    const pos = position || computeAutoPosition(def, graph.state);
    const nodeId = graph.autoInsertNode(definitionId, pos);
    if (nodeId) {
      setLastAddedNodeId(nodeId);
      setLastAddedDefinitionId(definitionId);
    }
    return nodeId;
  }, [graph]);

  // Generate texture: adds perlin noise and auto-connects
  const generateTexture = useCallback(() => {
    const def = NodeRegistry.get('perlin-noise');
    if (!def) return '';
    return graph.autoInsertNode('perlin-noise', computeAutoPosition(def, graph.state));
  }, [graph]);

  // Splice a new node into an existing edge (from filter panel drag)
  const spliceIntoEdge = useCallback((definitionId: string, edgeId: string, position: { x: number; y: number }) => {
    return graph.spliceNodeIntoEdge(definitionId, position, edgeId);
  }, [graph]);

  // Splice an existing node into an edge (from canvas drag)
  const spliceExistingIntoEdge = useCallback((nodeId: string, edgeId: string): boolean => {
    return graph.spliceExistingNodeIntoEdge(nodeId, edgeId);
  }, [graph]);

  const onParameterChange = useCallback((nodeId: string, paramId: string, value: number | string | boolean | number[]) => {
    graph.setParameter(nodeId, paramId, value);
  }, [graph]);

  const onToggleEnabled = useCallback((nodeId: string) => {
    graph.toggleEnabled(nodeId);
  }, [graph]);

  const onToggleCollapsed = useCallback((nodeId: string) => {
    graph.toggleCollapsed(nodeId);
  }, [graph]);

  const onSetColorTag = useCallback((nodeId: string, tag: NodeColorTag) => {
    graph.setColorTag(nodeId, tag);
  }, [graph]);

  const onNodeClick = useCallback((nodeId: string) => {
    if (nodeId) {
      graph.selectNode(nodeId);
    } else {
      graph.clearSelection(); // Clears both node and edge selection
    }
  }, [graph]);

  // Image upload to a specific image node
  const uploadNodeImage = useCallback((nodeId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      // Set the imageUrl directly on the GraphNode (drives NimzeyNode preview)
      graph.setNodeImage(nodeId, dataUrl);

      // Create an Image element and upload to renderer
      const img = new window.Image();
      img.onload = () => {
        renderer.uploadImage(nodeId, img);
        // Update dimensions now that the image is loaded
        graph.setNodeImage(nodeId, dataUrl, img.width, img.height);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [graph, renderer]);

  // Source image upload (creates an image node and auto-connects)
  const uploadSourceImage = useCallback((file: File) => {
    const def = NodeRegistry.get('image');
    if (!def) return;
    const pos = computeAutoPosition(def, graph.state);
    const nodeId = graph.autoInsertNode('image', pos);
    if (nodeId) {
      uploadNodeImage(nodeId, file);
    }
  }, [graph, uploadNodeImage]);

  // Drop handler for drag-and-drop from filter panel (simple placement, no auto-wiring)
  const onDrop = useCallback((definitionId: string, position: { x: number; y: number }) => {
    graph.addNode(definitionId, position);
  }, [graph]);

  // Add a new node and connect its output to a specific port on an existing node.
  // Uses the atomic addNodeAndConnect to avoid stale-closure issues with separate addNode+connect.
  const addAndConnect = useCallback((definitionId: string, targetNodeId: string, targetPortId: string) => {
    const targetNode = graph.state.nodes.get(targetNodeId);
    if (!targetNode) return;

    // Position the new node to the left of the target node
    const pos = {
      x: targetNode.position.x - NODE_GAP,
      y: targetNode.position.y,
    };

    graph.addNodeAndConnect(definitionId, pos, targetNodeId, targetPortId);
  }, [graph]);

  // Apply a starter template
  const applyTemplate = useCallback((templateId: string) => {
    const template = graphTemplates.find(t => t.id === templateId);
    if (!template) return;
    const buildResult = template.build();
    graph.applyTemplate(buildResult);
  }, [graph]);

  // Apply an effect preset (simple = insert chain, complex = replace graph)
  const applyPreset = useCallback((presetId: string) => {
    const preset = effectPresets.find(p => p.id === presetId);
    if (!preset) return;

    // Complex preset with full graph topology
    if (preset.build) {
      const buildResult = preset.build();
      graph.applyTemplate(buildResult);
      return;
    }

    // Simple linear chain preset (existing behavior)
    if (!preset.steps || preset.steps.length === 0) return;
    const firstDef = NodeRegistry.get(preset.steps[0]?.definitionId);
    const basePos = firstDef
      ? computeAutoPosition(firstDef, graph.state)
      : { x: 200, y: 200 };
    const steps = preset.steps.map((step, i) => ({
      definitionId: step.definitionId,
      position: { x: basePos.x + i * NODE_GAP, y: basePos.y },
      parameters: step.parameters,
    }));
    graph.insertChain(steps);
  }, [graph]);

  // "Bake to Image" — capture a node's output texture and create a new image node with it
  const bakeToImage = useCallback((sourceNodeId: string) => {
    const ctx = renderer.getContext();
    if (!ctx) {
      console.warn('bakeToImage: no GL context available');
      return;
    }

    const sourceNode = graph.state.nodes.get(sourceNodeId);
    if (!sourceNode) {
      console.warn('bakeToImage: source node not found:', sourceNodeId);
      return;
    }

    // Read the full-res pixels from the node's output texture
    const texName = `node_${sourceNodeId}_out`;
    const managed = ctx.getTexture(texName);
    if (!managed) {
      console.warn('bakeToImage: no output texture for node:', texName);
      return;
    }

    const pixels = ctx.readPixels(texName);
    if (pixels.length === 0) {
      console.warn('bakeToImage: readPixels returned empty');
      return;
    }

    const texW = managed.width;
    const texH = managed.height;

    // Create an offscreen canvas at the texture dimensions
    const offscreen = document.createElement('canvas');
    offscreen.width = texW;
    offscreen.height = texH;
    const ctx2d = offscreen.getContext('2d');
    if (!ctx2d) return;

    // Write pixel data, flipping Y (WebGL is bottom-up)
    const imageData = ctx2d.createImageData(texW, texH);
    for (let y = 0; y < texH; y++) {
      const srcY = texH - 1 - y; // flip
      for (let x = 0; x < texW; x++) {
        const srcIdx = (srcY * texW + x) * 4;
        const dstIdx = (y * texW + x) * 4;
        imageData.data[dstIdx] = pixels[srcIdx];
        imageData.data[dstIdx + 1] = pixels[srcIdx + 1];
        imageData.data[dstIdx + 2] = pixels[srcIdx + 2];
        imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
      }
    }
    ctx2d.putImageData(imageData, 0, 0);

    // Export as PNG data URL
    const dataUrl = offscreen.toDataURL('image/png');

    // Create a new image node positioned to the right of the source node
    const newPos = {
      x: sourceNode.position.x + NODE_GAP,
      y: sourceNode.position.y,
    };
    const newNodeId = graph.addNode('image', newPos);
    if (!newNodeId) return;

    // Set the image data on the new node
    graph.setNodeImage(newNodeId, dataUrl, texW, texH);

    // Upload the image texture to GPU
    const img = new window.Image();
    img.onload = () => {
      renderer.uploadImage(newNodeId, img);
      // Re-render to show the new image node's preview
      renderer.render();
    };
    img.src = dataUrl;

    debugLog('INIT', `Baked node ${sourceNodeId} to new image node ${newNodeId}`, {
      texSize: `${texW}x${texH}`,
    });
  }, [graph, renderer]);

  // GPU-accelerated blit: renders a node's output texture onto a target <canvas> element.
  // Uses blitTexture (passthrough shader → GL canvas) + drawImage (GPU copy → 2D canvas).
  // No readPixels, no PNG encoding, no base64 — stays on the GPU the entire way.
  const blitNodeToCanvas = useCallback((nodeId: string, targetCanvas: HTMLCanvasElement): boolean => {
    const ctx = renderer.getContext();
    if (!ctx) return false;

    const texName = `node_${nodeId}_out`;
    const managed = ctx.getTexture(texName);
    if (!managed) return false;

    // 1) Passthrough-blit the node texture to the GL canvas (GPU)
    if (!ctx.blitTexture(texName)) return false;

    // 2) GPU-accelerated copy: GL canvas → target 2D canvas (via drawImage)
    const glCanvas = ctx.getCanvas();
    if (targetCanvas.width !== glCanvas.width || targetCanvas.height !== glCanvas.height) {
      targetCanvas.width = glCanvas.width;
      targetCanvas.height = glCanvas.height;
    }
    const ctx2d = targetCanvas.getContext('2d');
    if (!ctx2d) return false;
    ctx2d.drawImage(glCanvas, 0, 0);

    return true;
  }, [renderer]);

  // Save a node's output as a full-resolution PNG
  const saveNodeImage = useCallback((nodeId: string) => {
    const dataUrl = renderer.captureNodeImage(nodeId);
    if (!dataUrl) {
      console.warn('saveNodeImage: could not capture node image for', nodeId);
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `nimzey-${nodeId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [renderer]);

  // Clear suggestion pills
  const clearSuggestion = useCallback(() => {
    setLastAddedNodeId(null);
    setLastAddedDefinitionId(null);
  }, []);

  return {
    // ReactFlow data
    nodes: rfNodes,
    edges: rfEdges,
    graphState: graph.state,

    // ReactFlow handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    commitPositionChange: graph.commitPositionChange,

    // Node actions
    addNode,
    autoConnectNode,
    generateTexture,
    spliceIntoEdge,
    spliceExistingIntoEdge,
    addAndConnect,
    bakeToImage,
    blitNodeToCanvas,
    saveNodeImage,
    endHere: graph.endHere,
    onParameterChange,
    onToggleEnabled,
    onToggleCollapsed,
    onSetColorTag,
    uploadNodeImage,
    uploadSourceImage,
    onDrop,
    applyTemplate,
    applyPreset,

    // Suggestions
    lastAddedNodeId,
    lastAddedDefinitionId,
    clearSuggestion,

    // Renderer
    initCanvas: renderer.initCanvas,
    processedImage: renderer.processedImage,
    isRendering: renderer.isRendering,
    quality: renderer.quality,
    setQuality: renderer.setQuality,
    render: renderer.render,
    exportImage: renderer.exportImage,

    // Undo/Redo
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,

    // Persistence
    getSerializedState: graph.getSerializedState,
    loadFromSerialized: graph.loadFromSerialized as (data: SerializedGraph, options?: { autoLayout?: boolean }) => void,
    resetGraph: graph.resetGraph,
    structuralVersion: graph.structuralVersion,
  };
}
