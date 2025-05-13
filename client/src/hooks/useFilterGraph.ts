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
import { FilterType, FilterNodeData, ImageNodeData, CustomNodeData, BlendMode } from '@/types';
import { filterCategories } from '@/lib/filterCategories';
import { applyFilters } from '@/lib/filterAlgorithms';

export function useFilterGraph() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [nodePreview, setNodePreview] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const uploadFunctionRef = useRef<((file: File) => void)>(() => {});

  // Initialize canvas when needed
  const getCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    return canvasRef.current;
  }, []);

  // Generate a preview for a specific node
  const generateNodePreview = useCallback((targetNode: Node) => {
    if (!sourceImageRef.current) return null;
    
    const canvas = getCanvas();
    return applyFilters(sourceImageRef.current, nodes, edges, canvas, targetNode.id);
  }, [nodes, edges, getCanvas]);

  // Process the image through the filter chain
  const processImage = useCallback(() => {
    if (!sourceImageRef.current) return;
    
    const canvas = getCanvas();
    // Always process the complete filter chain
    const result = applyFilters(sourceImageRef.current, nodes, edges, canvas);
    
    if (result) {
      // Always update the processed image with the complete chain result
      setProcessedImage(result);
      
      // If a node is selected, update its node-specific preview
      if (selectedNodeId) {
        const selectedNode = nodes.find(n => n.id === selectedNodeId);
        if (selectedNode) {
          const preview = generateNodePreview(selectedNode);
          setNodePreview(preview);
        }
      }
    }
  }, [nodes, edges, selectedNodeId, getCanvas, generateNodePreview]);

  // Handle node parameter changes
  const handleParamChange = useCallback((nodeId: string, paramName: string, value: number | string) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId && node.type === 'filterNode') {
          const nodeData = node.data as FilterNodeData;
          return {
            ...node,
            data: {
              ...nodeData,
              params: nodeData.params.map(param => 
                param.name === paramName ? { ...param, value } : param
              )
            }
          };
        }
        return node;
      })
    );

    // Re-process the image when params change
    processImage();
  }, [processImage]);
  
  // Handle enabling/disabling a filter node
  const handleToggleEnabled = useCallback((nodeId: string, enabled: boolean) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId && node.type === 'filterNode') {
          const nodeData = node.data as FilterNodeData;
          return {
            ...node,
            data: {
              ...nodeData,
              enabled
            }
          };
        }
        return node;
      })
    );
    
    // Re-process the image when a filter is enabled/disabled
    processImage();
  }, [processImage]);
  
  // Handle blend mode changes
  const handleBlendModeChange = useCallback((nodeId: string, blendMode: BlendMode) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId && (node.type === 'filterNode' || node.type === 'blendNode')) {
          const nodeData = node.data as FilterNodeData;
          return {
            ...node,
            data: {
              ...nodeData,
              blendMode
            }
          };
        }
        return node;
      })
    );
    
    // Re-process the image when blend mode changes
    processImage();
  }, [processImage]);
  
  // Handle opacity changes
  const handleOpacityChange = useCallback((nodeId: string, opacity: number) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId && (node.type === 'filterNode' || node.type === 'blendNode')) {
          const nodeData = node.data as FilterNodeData;
          return {
            ...node,
            data: {
              ...nodeData,
              opacity
            }
          };
        }
        return node;
      })
    );
    
    // Re-process the image when opacity changes
    processImage();
  }, [processImage]);
  


  // Upload an image function
  const uploadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setSourceImage(imageDataUrl);
      
      // Update the source node with the new image
      setNodes(nds => 
        nds.map(node => {
          if (node.id.startsWith('source-')) {
            return {
              ...node,
              data: { 
                src: imageDataUrl,
                onUploadImage: uploadFunctionRef.current
              },
            };
          }
          return node;
        })
      );
      
      // Create a new image element to store the original
      const img = new Image();
      img.onload = () => {
        sourceImageRef.current = img;
        processImage();
      };
      img.src = imageDataUrl;
    };
    reader.readAsDataURL(file);
  }, [processImage]);

  // Set the upload function reference for use in image nodes
  useEffect(() => {
    uploadFunctionRef.current = uploadImage;
  }, [uploadImage]);

  // Function to reset the canvas
  const resetCanvas = useCallback(() => {
    const sourceNodeId = 'source-1';
    setNodes([
      {
        id: sourceNodeId,
        type: 'imageNode',
        position: { x: 100, y: 100 },
        data: { 
          src: null,
          onUploadImage: uploadFunctionRef.current
        },
      },
    ]);
    setEdges([]);
    setSourceImage(null);
    setProcessedImage(null);
    setSelectedNodeId(null);
    setNodePreview(null);
  }, []);

  // Initialize the source node
  useEffect(() => {
    resetCanvas();
  }, [resetCanvas]);

  // Function to find a filter definition by type
  const findFilterByType = useCallback((filterType: FilterType) => {
    for (const category of Object.values(filterCategories)) {
      const filter = category.filters.find(f => f.type === filterType);
      if (filter) return filter;
    }
    return null;
  }, []);
  
  // Function to remove a node and its connections
  const removeNode = useCallback((nodeId: string) => {
    // Remove any edges connected to this node
    setEdges(eds => eds.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    
    // Remove the node itself
    setNodes(nds => nds.filter(node => node.id !== nodeId));
    
    // If this was the selected node, clear the selection
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setNodePreview(null);
    }
    
    // Re-process the image
    processImage();
  }, [selectedNodeId, processImage]);

  // Function to add a new filter node
  const addNode = useCallback((filterType: FilterType) => {
    const filterDef = findFilterByType(filterType);
    if (!filterDef) return;

    const newNodeId = `${filterType}-${uuidv4().substring(0, 8)}`;
    
    // Create the node data with default params
    const nodeData: FilterNodeData = {
      label: `${filterDef.name}`,
      filterType,
      params: filterDef.params.map(param => ({ ...param })),
      enabled: true,
      blendMode: 'normal',
      opacity: 100, // Use 0-100 scale for percentages
      onParamChange: handleParamChange,
      onToggleEnabled: handleToggleEnabled,
      onBlendModeChange: handleBlendModeChange,
      onOpacityChange: handleOpacityChange,
      onRemoveNode: () => removeNode(newNodeId)
    };

    // Determine node type - use blendNode for blend filter type
    const nodeType = filterType === 'blend' ? 'blendNode' : 'filterNode';
    
    // Add the new node
    setNodes(nds => [
      ...nds,
      {
        id: newNodeId,
        type: nodeType,
        position: { 
          x: Math.random() * 300 + 250, 
          y: Math.random() * 200 + 100
        },
        data: nodeData,
      },
    ]);

    // Select the new node
    setSelectedNodeId(newNodeId);
  }, [findFilterByType, handleParamChange, handleToggleEnabled, handleBlendModeChange, handleOpacityChange, removeNode]);

  // Handle nodes changes
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  // Handle edges changes
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    // For unlimited connections, we'll generate a unique handle ID if none is specified
    // This ensures each connection gets its own unique endpoint
    if (!connection.targetHandle) {
      // Use a timestamp + random number to ensure uniqueness
      connection.targetHandle = `input-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    // Generate a unique edge ID based on the source, target and target handle
    const edgeId = `e-${connection.source}-${connection.target}-${connection.targetHandle}`;
    
    // With the unlimited connection approach, we don't need to delete existing connections
    // Every new connection gets its own unique handle ID
    
    const newEdge = {
      ...connection,
      id: edgeId,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
    };
    
    setEdges(eds => addEdge(newEdge, eds));

    // Re-process the image when connections change
    processImage();
  }, [nodes, edges, processImage]);

  // Handle node selection
  const onNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId ? nodeId : null);
    
    // Generate preview for the selected node
    if (nodeId && sourceImage) {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        const preview = generateNodePreview(node);
        setNodePreview(preview);
      }
    } else {
      // When no node is selected, clear the node preview so that
      // the preview panel will show the final processed image instead
      setNodePreview(null);
      
      // Make sure we're showing the processed image with all filters applied
      if (sourceImageRef.current) {
        processImage();
      }
    }
  }, [nodes, sourceImage, generateNodePreview, processImage]);

  // Export the processed image
  const exportImage = useCallback((format = 'png', quality = 0.9) => {
    if (!processedImage) return;
    
    // In a real application, we would generate a proper exported file
    // For now, we'll just open the processed image in a new tab
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `filter-forge-export.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [processedImage]);

  // Zoom in function
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  }, []);

  // Zoom out function
  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  }, []);
  
  // Load a preset from saved configurations
  const loadPreset = useCallback((presetNodes: Node[], presetEdges: Edge[]) => {
    // If there's no source image, we can't apply filters
    if (!sourceImageRef.current) {
      alert("Please upload a source image first before loading a preset.");
      return;
    }
    
    // First clear the current graph
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    
    // Setup nodes with proper IDs and connections
    const nodeIdMap = new Map<string, string>();
    
    // Create new nodes with fresh IDs while maintaining their original data
    const newNodes = presetNodes.map(node => {
      const oldId = node.id;
      const newId = uuidv4();
      nodeIdMap.set(oldId, newId);
      
      // Check if it's a source image node - we need to update it with the current image
      if (node.type === 'imageNode' && (node.data as ImageNodeData).src !== sourceImage) {
        return {
          ...node,
          id: newId,
          data: {
            ...node.data,
            src: sourceImage
          }
        };
      }
      
      return {
        ...node,
        id: newId,
        selected: false
      };
    });
    
    // Create new edges with updated source and target IDs
    const newEdges = presetEdges.map(edge => {
      const newSourceId = nodeIdMap.get(edge.source) || edge.source;
      const newTargetId = nodeIdMap.get(edge.target) || edge.target;
      
      return {
        ...edge,
        id: uuidv4(),
        source: newSourceId,
        target: newTargetId
      };
    });
    
    // Apply the new nodes and edges
    setNodes(newNodes);
    setEdges(newEdges);
    
    // Process the image with the new filter chain
    setTimeout(() => {
      processImage();
    }, 100);
  }, [sourceImage, sourceImageRef, processImage]);

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
        const param = node.data.params.find(p => p.type === 'range');
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
          onRemoveNode: () => {}
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
  }, [handleParamChange, handleToggleEnabled, handleBlendModeChange, handleOpacityChange, processImage]);

  // Selected node data
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeSelect,
    addNode,
    addCustomNode,
    createCustomNode,
    selectedNode,
    selectedNodeId,
    processedImage,
    uploadImage,
    exportImage,
    sourceImage,
    resetCanvas,
    zoomIn,
    zoomOut,
    zoomLevel,
    nodePreview,
    loadPreset
  };
}