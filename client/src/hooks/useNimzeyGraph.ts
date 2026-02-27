/**
 * useNimzeyGraph - Integration hook composing graphStore + renderController + ReactFlowAdapter.
 * Replaces both useFilterGraph.ts and useGLFilterGraph.ts.
 */

import { useCallback, useMemo, useState } from 'react';
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

export function useNimzeyGraph(options?: { quality?: QualityLevel }) {
  const graph = useGraphStore();
  const renderer = useRenderController(graph.state, {
    ...options,
    onNodePreview: graph.setNodePreview,
  });
  const [lastAddedNodeId, setLastAddedNodeId] = useState<string | null>(null);
  const [lastAddedDefinitionId, setLastAddedDefinitionId] = useState<string | null>(null);

  // Convert internal state to ReactFlow format
  const { nodes: rfNodes, edges: rfEdges } = useMemo(
    () => graphStateToReactFlow(graph.state),
    [graph.state],
  );

  // ---- ReactFlow event handlers ----

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // Handle position changes
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        graph.updateNodePosition(change.id, change.position);
      }
      if (change.type === 'remove') {
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

  // Splice a node into an existing edge
  const spliceIntoEdge = useCallback((definitionId: string, edgeId: string, position: { x: number; y: number }) => {
    return graph.spliceNodeIntoEdge(definitionId, position, edgeId);
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

      // Update node with image URL
      graph.setParameter(nodeId, '_imageUrl', dataUrl);

      // Create an Image element and upload to renderer
      const img = new window.Image();
      img.onload = () => {
        renderer.uploadImage(nodeId, img);
        // Store dimensions on the node
        const node = graph.state.nodes.get(nodeId);
        if (node) {
          // Update node data through setNodes (we'll need to handle this)
          graph.setParameter(nodeId, '_width', img.width);
          graph.setParameter(nodeId, '_height', img.height);
        }
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

  // Drop handler for drag-and-drop from filter panel (auto-connects)
  const onDrop = useCallback((definitionId: string, position: { x: number; y: number }) => {
    graph.autoInsertNode(definitionId, position);
  }, [graph]);

  // Apply a starter template
  const applyTemplate = useCallback((templateId: string) => {
    const template = graphTemplates.find(t => t.id === templateId);
    if (!template) return;
    const buildResult = template.build();
    graph.applyTemplate(buildResult);
  }, [graph]);

  // Apply an effect preset (inserts chain of nodes)
  const applyPreset = useCallback((presetId: string) => {
    const preset = effectPresets.find(p => p.id === presetId);
    if (!preset) return;
    // Compute base position from live state, then offset each step
    // (graph.state is stale within the loop since React batches setState)
    const firstDef = NodeRegistry.get(preset.steps[0]?.definitionId);
    const basePos = firstDef
      ? computeAutoPosition(firstDef, graph.state)
      : { x: 200, y: 200 };
    for (let i = 0; i < preset.steps.length; i++) {
      const step = preset.steps[i];
      const def = NodeRegistry.get(step.definitionId);
      if (!def) continue;
      const pos = { x: basePos.x + i * NODE_GAP, y: basePos.y };
      const nodeId = graph.autoInsertNode(step.definitionId, pos);
      if (nodeId && step.parameters) {
        for (const [paramId, value] of Object.entries(step.parameters)) {
          graph.setParameter(nodeId, paramId, value);
        }
      }
    }
  }, [graph]);

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

    // Node actions
    addNode,
    autoConnectNode,
    generateTexture,
    spliceIntoEdge,
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
  };
}
