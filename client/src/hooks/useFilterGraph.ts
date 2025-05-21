import { useState, useCallback, useRef } from 'react';
import { 
  Node, 
  Edge, 
  Connection, 
  NodeChange, 
  applyNodeChanges, 
  EdgeChange, 
  applyEdgeChanges,
  addEdge 
} from 'reactflow';
import { FilterNodeData, BlendMode, NodeColorTag, FilterType } from '@/types';
import { applyFilter } from '@/lib/filters';
import { v4 as uuidv4 } from 'uuid';

export function useFilterGraph() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Store processed images in a cache
  const processedImageCache = useRef<Map<string, string>>(new Map());
  
  // Handle node changes
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );
  
  // Update a node's data
  const updateNodeData = useCallback((nodeId: string, newData: Partial<FilterNodeData>) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...newData } } 
          : node
      )
    );
    
    // Clear downstream cache so previews will be recalculated
    clearDownstreamCache(nodeId);
  }, []);
  
  // Clears cache for this node and all nodes that depend on it
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
    
    // Clear their cache entries so they'll be reprocessed
    processedImageCache.current.delete(nodeId);
    downstreamNodeIds.forEach(id => {
      processedImageCache.current.delete(id);
    });
  }, [edges]);
  
  // When a node needs to show a preview, it calls getProcessedImage
  const getProcessedImage = useCallback(async (nodeId: string): Promise<string | null> => {
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
    const inputImageUrl = await getProcessedImage(inputEdge.source);
    if (!inputImageUrl) return null;
    
    // Apply the current filter to the input image
    const filterType = node.data.type as FilterType;
    const settings = node.data.settings || {};
    
    try {
      // Apply the filter and get the result
      const resultImageUrl = await applyFilter(inputImageUrl, filterType, settings);
      
      // Cache the result for better performance
      processedImageCache.current.set(nodeId, resultImageUrl);
      
      // Update the node's preview display
      updateNodeData(nodeId, { preview: resultImageUrl });
      
      return resultImageUrl;
    } catch (error) {
      console.error(`Error applying ${filterType} filter:`, error);
      return null;
    }
  }, [nodes, edges, updateNodeData]);
  
  // Handle node selection
  const onNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Add a new node to the graph
  const addFilterNode = useCallback((filterType: FilterType) => {
    const id = uuidv4();
    const capitalizedType = filterType.charAt(0).toUpperCase() + filterType.slice(1);
    
    // Create the new node
    const newNode: Node = {
      id,
      type: 'filterNode',
      position: { x: 250, y: 250 },
      data: {
        label: `${capitalizedType}`,
        filterType,
        enabled: true,
        colorTag: 'default' as NodeColorTag,
        blendMode: 'normal' as BlendMode,
        opacity: 100,
        settings: {},
        onSettingsChange: (nodeId: string, settings: Record<string, any>) => {
          // Update the node data with new settings
          updateNodeData(nodeId, { settings });
          
          // Clear cached results for this node and any downstream nodes
          clearDownstreamCache(nodeId);
        }
      }
    };
    
    setNodes(nodes => [...nodes, newNode]);
    return id;
  }, [updateNodeData, clearDownstreamCache]);

  // Handle connections between nodes  
  const onConnect = useCallback((connection: Connection) => {
    // Check if connection would create a cycle
    if (checkForCycles(edges, nodes, connection)) {
      console.warn('Cannot create connection: would create a cycle');
      return;
    }
    
    setEdges(eds => addEdge(connection, eds));
    
    // Clear downstream cache for the target node
    if (connection.target) {
      clearDownstreamCache(connection.target);
    }
  }, [edges, nodes, clearDownstreamCache]);
  
  // Check for cycles in the graph
  const checkForCycles = (currentEdges: Edge[], allNodes: Node[], newConnection: Connection): boolean => {
    // Create a directed graph representation
    const graph: Record<string, string[]> = {};
    
    // Add all existing edges
    currentEdges.forEach(edge => {
      if (!graph[edge.source]) {
        graph[edge.source] = [];
      }
      graph[edge.source].push(edge.target);
    });
    
    // Add the new connection
    if (newConnection.source && newConnection.target) {
      if (!graph[newConnection.source]) {
        graph[newConnection.source] = [];
      }
      graph[newConnection.source].push(newConnection.target);
    }
    
    // DFS to check for cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      if (!graph[nodeId]) return false;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      for (const neighbor of graph[nodeId]) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    // Start DFS from all nodes
    for (const node of allNodes) {
      if (!visited.has(node.id) && hasCycle(node.id)) {
        return true;
      }
    }
    
    return false;
  };
  
  // Upload an image and create an image node
  const uploadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      
      // Create a new image node
      const id = uuidv4();
      const newNode: Node = {
        id,
        type: 'imageNode',
        position: { x: 100, y: 100 },
        data: {
          label: 'Image',
          src: imageUrl,
          enabled: true
        }
      };
      
      setNodes(nodes => [...nodes, newNode]);
      
      // Also set as selected node
      setSelectedNodeId(id);
    };
    reader.readAsDataURL(file);
  }, []);
  
  // Process the entire graph to get the final output
  const processGraph = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Find the output node or the last node in the graph
      const outputNodeId = findOutputNodeId();
      
      if (outputNodeId) {
        const result = await getProcessedImage(outputNodeId);
        setProcessedImage(result);
      } else {
        console.warn('No output node found');
        setProcessedImage(null);
      }
    } catch (error) {
      console.error('Error processing graph:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [getProcessedImage]);
  
  // Find the output node or the last node in the graph
  const findOutputNodeId = useCallback((): string | null => {
    // First, try to find any nodes that have no outgoing connections
    // These are potential output nodes
    const nodeIdsWithOutgoing = new Set<string>();
    edges.forEach(edge => {
      nodeIdsWithOutgoing.add(edge.source);
    });
    
    const endNodes = nodes.filter(node => !nodeIdsWithOutgoing.has(node.id));
    
    if (endNodes.length === 0) return null;
    
    // If there's only one end node, use it
    if (endNodes.length === 1) return endNodes[0].id;
    
    // If there are multiple, use the selected one if it's an end node
    if (selectedNodeId && endNodes.some(node => node.id === selectedNodeId)) {
      return selectedNodeId;
    }
    
    // Otherwise, just use the first end node
    return endNodes[0].id;
  }, [nodes, edges, selectedNodeId]);
  
  // Export the processed image
  const exportImage = useCallback((format: string = 'png') => {
    if (!processedImage) {
      console.warn('No processed image to export');
      return;
    }
    
    const link = document.createElement('a');
    link.download = `image-export.${format.toLowerCase()}`;
    link.href = processedImage;
    link.click();
  }, [processedImage]);
  
  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedNodeId,
    onNodeClick,
    addFilterNode,
    uploadImage,
    processedImage,
    processGraph,
    isProcessing,
    exportImage,
    getProcessedImage
  };
}