/**
 * useNimzeyGraph - Integration hook composing graphStore + renderController + ReactFlowAdapter.
 * Replaces both useFilterGraph.ts and useGLFilterGraph.ts.
 */

import { useCallback, useMemo } from 'react';
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
import { useGraphStore } from '@/stores/graphStore';
import { useRenderController } from '@/stores/renderController';
import {
  graphStateToReactFlow,
  connectionToEdge,
} from '@/adapters/ReactFlowAdapter';
import { NimzeyNodeData, NodeColorTag, QualityLevel } from '@/types';

export function useNimzeyGraph(options?: { quality?: QualityLevel }) {
  const graph = useGraphStore();
  const renderer = useRenderController(graph.state, options);

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
    }
  }, [graph]);

  const onConnect = useCallback((connection: Connection) => {
    const edge = connectionToEdge(connection);
    if (!edge) return;
    graph.connect(edge.sourceNodeId, edge.sourcePortId, edge.targetNodeId, edge.targetPortId);
  }, [graph]);

  // ---- Node actions ----

  const addNode = useCallback((definitionId: string, position?: { x: number; y: number }) => {
    const pos = position || { x: 400, y: 300 };
    return graph.addNode(definitionId, pos);
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
      graph.clearSelection();
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

  // Source image upload (creates an image node and connects to result)
  const uploadSourceImage = useCallback((file: File) => {
    const nodeId = graph.addNode('image', { x: 200, y: 300 });
    if (nodeId) {
      uploadNodeImage(nodeId, file);
      // Auto-connect to result node if nothing else is connected
      graph.connect(nodeId, 'out', graph.state.resultNodeId, 'source');
    }
  }, [graph, uploadNodeImage]);

  // Drop handler for drag-and-drop from filter panel
  const onDrop = useCallback((definitionId: string, position: { x: number; y: number }) => {
    graph.addNode(definitionId, position);
  }, [graph]);

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
    onParameterChange,
    onToggleEnabled,
    onToggleCollapsed,
    onSetColorTag,
    uploadNodeImage,
    uploadSourceImage,
    onDrop,

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
