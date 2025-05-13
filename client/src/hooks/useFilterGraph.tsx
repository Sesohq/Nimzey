import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Node, 
  Edge,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { FilterNodeData, FilterType, Filter, BlendMode, ImageNodeData, CustomNodeData, DbCustomNodeData } from '@/types';
import { applyFilters } from '@/lib/filterAlgorithms';
import { filterCategories } from '@/lib/filterCategories';

export function useFilterGraph() {
  // State for nodes and edges
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // State for selected node
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // State for source image and processed image
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  
  // State for node preview when a node is selected
  const [nodePreview, setNodePreview] = useState<string | null>(null);
  
  // State for tracking zoom level
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Refs for elements we need to track
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const uploadFunctionRef = useRef<((file: File) => void)>(() => {});
  
  // Handle node changes (position, selection, etc.)
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);
  
  // Handle edge changes (connections between nodes)
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);
  
  // Handle node click
  const onNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId((currentSelectedId) => (currentSelectedId === nodeId ? null : nodeId));
  }, []);
  
  // Handle parameter changes on filter nodes
  const handleParamChange = useCallback((nodeId: string, paramName: string, value: number | string) => {
    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              params: node.data.params.map((param: any) => 
                param.name === paramName ? { ...param, value } : param
              ),
            },
          };
        }
        return node;
      });
    });
  }, []);
  
  // Handle toggling filter nodes on/off
  const handleToggleEnabled = useCallback((nodeId: string, enabled: boolean) => {
    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              enabled,
            },
          };
        }
        return node;
      });
    });
  }, []);
  
  // Handle changing blend mode on filter nodes
  const handleBlendModeChange = useCallback((nodeId: string, blendMode: BlendMode) => {
    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              blendMode,
            },
          };
        }
        return node;
      });
    });
  }, []);
  
  // Handle changing opacity on filter nodes
  const handleOpacityChange = useCallback((nodeId: string, opacity: number) => {
    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              opacity,
            },
          };
        }
        return node;
      });
    });
  }, []);
  
  // Handle removing nodes
  const handleRemoveNode = useCallback((nodeId: string) => {
    setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
    setEdges(prevEdges => prevEdges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNodeId(null);
  }, []);
  
  // Handle zoom in/out
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2)); // Cap at 2x zoom
  }, []);
  
  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5)); // Min at 0.5x zoom
  }, []);
  
  // Process image through a node chain and generate a thumbnail
  const generateThumbnail = useCallback(async (nodesToProcess: Node[], edgesToProcess: Edge[]): Promise<string | null> => {
    if (!sourceImageRef.current) return null;
    
    // Create a temporary canvas for thumbnail generation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 100;
    tempCanvas.height = 100;
    
    // Process the image through the selected node chain
    const result = applyFilters(
      sourceImageRef.current, 
      nodesToProcess, 
      edgesToProcess, 
      tempCanvas
    );
    
    return result;
  }, [sourceImageRef]);

  // Create simplified parameters for custom node
  const createCustomNodeParams = useCallback((selectedNodes: Node[]) => {
    // Create a single "strength" parameter that controls the overall effect
    const params = [
      {
        name: "strength",
        label: "Effect Strength",
        type: "range" as const,
        min: 0,
        max: 100,
        step: 1,
        value: 100,
        unit: "%"
      }
    ];
    
    // Also extract one key parameter from each node to expose (up to 2 additional params)
    const additionalParams = selectedNodes
      .filter(node => 'params' in node.data && node.data.params?.length > 0)
      .slice(0, 2)  // Limit to 2 nodes
      .map(node => {
        // Get the first parameter that's a range type
        const param = node.data.params.find((p: any) => p.type === 'range');
        if (!param) return null;
        
        return {
          name: `${node.id}_${param.name}`,
          label: `${node.data.label} - ${param.label}`,
          type: "range" as const,
          min: param.min || 0,
          max: param.max || 100,
          step: param.step || 1,
          value: param.value,
          unit: param.unit || ''
        };
      })
      .filter(Boolean);
    
    return [...params, ...additionalParams];
  }, []);

  // Create a custom node from selected nodes
  const createCustomNode = useCallback(async (customNodeData: Omit<CustomNodeData, 'id'>) => {
    try {
      // Generate a thumbnail of the effect
      const thumbnail = await generateThumbnail(
        customNodeData.internalNodes,
        customNodeData.internalEdges
      );
      
      // Create simplified params
      const simplifiedParams = createCustomNodeParams(customNodeData.internalNodes);
      
      // First save to backend
      const response = await fetch('/api/custom-nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customNodeData.name,
          category: customNodeData.category,
          description: customNodeData.description || '',
          thumbnail: thumbnail || '',
          nodesData: JSON.stringify(customNodeData.internalNodes),
          edgesData: JSON.stringify(customNodeData.internalEdges),
          paramsData: JSON.stringify(simplifiedParams),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save custom node');
      }

      const savedNode = await response.json();
      return savedNode;
    } catch (error) {
      console.error('Failed to create custom node:', error);
      return null;
    }
  }, [generateThumbnail, createCustomNodeParams]);

  // Load a custom node from the server and add it to the canvas
  const addCustomNode = useCallback((dbCustomNode: DbCustomNodeData) => {
    try {
      // Parse the stored data from strings to objects
      const internalNodes = JSON.parse(dbCustomNode.nodesData);
      const internalEdges = JSON.parse(dbCustomNode.edgesData);
      const params = JSON.parse(dbCustomNode.paramsData);
      
      // Create a new node ID
      const nodeId = uuidv4();
      
      // Create the node with the internal structure
      const newNode: Node<CustomNodeData> = {
        id: nodeId,
        type: 'customNode',
        position: { x: 250, y: 250 },
        data: {
          id: dbCustomNode.id.toString(),
          name: dbCustomNode.name,
          category: dbCustomNode.category,
          description: dbCustomNode.description || '',
          thumbnail: dbCustomNode.thumbnail || '',
          internalNodes,
          internalEdges,
          params,
          enabled: true,
          blendMode: 'normal',
          opacity: 1,
          onParamChange: handleParamChange,
          onToggleEnabled: handleToggleEnabled,
          onBlendModeChange: handleBlendModeChange,
          onOpacityChange: handleOpacityChange,
          onRemoveNode: () => handleRemoveNode(nodeId)
        },
      };
      
      // Add to canvas
      setNodes((nds) => [...nds, newNode]);
      
      // Update processed image
      setTimeout(() => {
        processImage();
      }, 100);
      
      return nodeId;
    } catch (error) {
      console.error('Failed to add custom node:', error);
      return null;
    }
  }, [handleParamChange, handleToggleEnabled, handleBlendModeChange, handleOpacityChange, handleRemoveNode, processImage]);

  // Selected node data
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;

  // Generate node preview for the selected node
  const generateNodePreview = useCallback((targetNode: Node) => {
    if (!sourceImageRef.current) return;
    
    try {
      // Find all nodes and edges in the chain leading to the selected node
      const nodeChain = getNodeChain(targetNode.id, nodes, edges);
      
      // Create a temporary canvas for the preview
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 300;
      tempCanvas.height = 300;
      
      // Process the image through the selected node chain
      const result = applyFilters(
        sourceImageRef.current, 
        nodeChain.nodes, 
        nodeChain.edges, 
        tempCanvas
      );
      
      // Set the preview
      setNodePreview(result);
    } catch (error) {
      console.error('Error generating node preview:', error);
      setNodePreview(null);
    }
  }, [nodes, edges, sourceImageRef]);
  
  // Gets all nodes and edges in a chain leading to a specific node
  const getNodeChain = (nodeId: string, allNodes: Node[], allEdges: Edge[]) => {
    // Start with the target node
    const resultNodes = [allNodes.find(node => node.id === nodeId)!];
    const resultEdges: Edge[] = [];
    const visited = new Set<string>([nodeId]);
    
    // Queue for BFS
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      
      // Find all edges pointing to this node
      const incomingEdges = allEdges.filter(edge => edge.target === currentNodeId);
      
      for (const edge of incomingEdges) {
        resultEdges.push(edge);
        
        // If we haven't visited the source node yet, add it to the queue
        if (!visited.has(edge.source)) {
          const sourceNode = allNodes.find(node => node.id === edge.source);
          if (sourceNode) {
            resultNodes.push(sourceNode);
            visited.add(edge.source);
            queue.push(edge.source);
          }
        }
      }
    }
    
    return { nodes: resultNodes, edges: resultEdges };
  };
  
  // Find all nodes that can be reached from a given starting node
  const getDownstreamNodes = (startNodeId: string, allNodes: Node[], allEdges: Edge[]) => {
    const resultNodes = new Set<Node>();
    const visited = new Set<string>([startNodeId]);
    
    // Queue for BFS
    const queue = [startNodeId];
    
    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      const currentNode = allNodes.find(node => node.id === currentNodeId);
      if (currentNode) {
        resultNodes.add(currentNode);
      }
      
      // Find all edges going out from this node
      const outgoingEdges = allEdges.filter(edge => edge.source === currentNodeId);
      
      for (const edge of outgoingEdges) {
        // If we haven't visited the target node yet, add it to the queue
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
        }
      }
    }
    
    return Array.from(resultNodes);
  };
  
  // Process the entire image with all filter nodes
  const processImage = useCallback(() => {
    if (!sourceImageRef.current) return;
    
    // Create a canvas for the processed image
    if (!exportCanvasRef.current) {
      exportCanvasRef.current = document.createElement('canvas');
    }
    
    try {
      // If a node is selected, only process nodes in that chain
      if (selectedNodeId) {
        const selectedNode = nodes.find(node => node.id === selectedNodeId);
        if (selectedNode) {
          const downstreamNodes = getDownstreamNodes(selectedNodeId, nodes, edges);
          
          // Include the selected node and all downstream nodes
          const allNodesToProcess = [selectedNode, ...downstreamNodes];
          
          // Find edges connecting these nodes
          const relevantEdges = edges.filter(edge => 
            allNodesToProcess.find(node => node.id === edge.source) && 
            allNodesToProcess.find(node => node.id === edge.target)
          );
          
          // Process the image
          const result = applyFilters(
            sourceImageRef.current,
            allNodesToProcess,
            relevantEdges,
            exportCanvasRef.current
          );
          
          setProcessedImage(result);
        }
      } else {
        // Process the full graph
        const result = applyFilters(
          sourceImageRef.current,
          nodes,
          edges,
          exportCanvasRef.current
        );
        
        setProcessedImage(result);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setProcessedImage(null);
    }
  }, [nodes, edges, selectedNodeId, sourceImageRef, exportCanvasRef]);
  
  // Effect to generate preview when a node is selected
  useEffect(() => {
    if (selectedNodeId && sourceImageRef.current) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) {
        generateNodePreview(node);
      }
    } else {
      setNodePreview(null);
    }
  }, [selectedNodeId, nodes, sourceImageRef, generateNodePreview]);
  
  // Effect to update the source image ref when the image changes
  useEffect(() => {
    if (sourceImage) {
      const img = new Image();
      img.onload = () => {
        sourceImageRef.current = img;
        processImage();
      };
      img.src = sourceImage;
    }
  }, [sourceImage, sourceImageRef, processImage]);
  
  // Find a filter by type
  const findFilterByType = useCallback((filterType: FilterType) => {
    for (const category of filterCategories) {
      const filter = category.filters.find((f) => f.type === filterType);
      if (filter) {
        return filter;
      }
    }
    return null;
  }, []);
  
  // Add a new filter node
  const addNode = useCallback((filterType: FilterType) => {
    const filter = findFilterByType(filterType);
    if (!filter) return;
    
    const id = uuidv4();
    const nodeData: FilterNodeData = {
      label: filter.name,
      filterType,
      params: JSON.parse(JSON.stringify(filter.params)), // Deep copy
      enabled: true,
      blendMode: 'normal',
      opacity: 1,
      onParamChange: handleParamChange,
      onToggleEnabled: handleToggleEnabled,
      onBlendModeChange: handleBlendModeChange,
      onOpacityChange: handleOpacityChange,
      onRemoveNode: () => handleRemoveNode(id)
    };
    
    const newNode: Node<FilterNodeData> = {
      id,
      type: 'filterNode',
      position: { x: 250, y: 150 },
      data: nodeData,
    };
    
    setNodes(prevNodes => [...prevNodes, newNode]);
    
    return id;
  }, [findFilterByType, handleParamChange, handleToggleEnabled, handleBlendModeChange, handleOpacityChange, handleRemoveNode]);
  
  // Connect two nodes
  const onConnect = useCallback((connection: Connection) => {
    const newEdge = {
      ...connection,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#888',
      },
      animated: true
    };
    
    setEdges(prevEdges => addEdge(newEdge, prevEdges));
  }, []);
  
  // Upload an image
  const uploadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSourceImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, []);
  
  // Export the processed image
  const exportImage = useCallback((format = 'png', quality = 1) => {
    if (!exportCanvasRef.current) return null;
    
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    return exportCanvasRef.current.toDataURL(mimeType, quality);
  }, [exportCanvasRef]);
  
  // Add a source image node if needed
  const addSourceNodeIfNeeded = useCallback(() => {
    if (!nodes.some(node => node.type === 'imageNode')) {
      const id = 'source-image';
      const nodeData: ImageNodeData = {
        src: sourceImage,
        onUploadImage: uploadImage
      };
      
      const newNode: Node<ImageNodeData> = {
        id,
        type: 'imageNode',
        position: { x: 100, y: 100 },
        data: nodeData,
      };
      
      setNodes(prevNodes => [...prevNodes, newNode]);
    }
  }, [nodes, sourceImage, uploadImage]);
  
  // Initialize the graph with a source image node
  useEffect(() => {
    if (sourceImage && nodes.length === 0) {
      addSourceNodeIfNeeded();
    }
  }, [sourceImage, nodes, addSourceNodeIfNeeded]);
  
  // Update source image node when source image changes
  useEffect(() => {
    if (sourceImage) {
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.type === 'imageNode') {
          return {
            ...node,
            data: {
              ...node.data,
              src: sourceImage
            }
          };
        }
        return node;
      }));
    }
  }, [sourceImage]);
  
  // Set up the upload function reference
  useEffect(() => {
    uploadFunctionRef.current = uploadImage;
  }, [uploadImage, uploadFunctionRef]);
  
  // Reset the graph
  const resetGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    addSourceNodeIfNeeded();
  }, [addSourceNodeIfNeeded]);
  
  // Load a preset
  const loadPreset = useCallback((presetNodes: Node[], presetEdges: Edge[]) => {
    // Add back reference functions to nodes
    const nodesWithCallbacks = presetNodes.map(node => {
      // Add the appropriate callbacks based on node type
      if (node.type === 'filterNode') {
        const id = node.id;
        return {
          ...node,
          data: {
            ...node.data,
            onParamChange: handleParamChange,
            onToggleEnabled: handleToggleEnabled,
            onBlendModeChange: handleBlendModeChange,
            onOpacityChange: handleOpacityChange,
            onRemoveNode: () => handleRemoveNode(id)
          }
        };
      }
      else if (node.type === 'imageNode') {
        return {
          ...node,
          data: {
            ...node.data,
            src: sourceImage,
            onUploadImage: uploadImage
          }
        };
      }
      else if (node.type === 'customNode') {
        const id = node.id;
        return {
          ...node,
          data: {
            ...node.data,
            onParamChange: handleParamChange,
            onToggleEnabled: handleToggleEnabled,
            onBlendModeChange: handleBlendModeChange,
            onOpacityChange: handleOpacityChange,
            onRemoveNode: () => handleRemoveNode(id)
          }
        };
      }
      return node;
    });
    
    setNodes(nodesWithCallbacks);
    setEdges(presetEdges);
    
    processImage();
  }, [
    handleParamChange, handleToggleEnabled, handleBlendModeChange, 
    handleOpacityChange, handleRemoveNode, sourceImage, 
    uploadImage, processImage
  ]);
  
  return {
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    sourceImage,
    processedImage,
    nodePreview,
    zoomLevel,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    addNode,
    uploadImage,
    exportImage,
    resetGraph,
    loadPreset,
    zoomIn,
    zoomOut,
    createCustomNode,
    addCustomNode
  };
}