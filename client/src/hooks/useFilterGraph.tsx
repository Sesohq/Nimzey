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
import { applyFilters, nodeResultCache } from '@/lib/filterAlgorithms';
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
  
  // Define extended types for clipboard operations
  type ClipboardNode = Node & {
    originalId?: string;
  };
  
  type ClipboardEdge = Edge & {
    originalSource?: string;
    originalTarget?: string;
  };
  
  // State for clipboard operations
  const [clipboardNodes, setClipboardNodes] = useState<ClipboardNode[]>([]);
  const [clipboardEdges, setClipboardEdges] = useState<ClipboardEdge[]>([]);
  
  // Refs for elements we need to track
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const uploadFunctionRef = useRef<((file: File) => void)>(() => {});
  // Reference to processImage function to avoid circular dependencies
  const processImageRef = useRef<(() => void) | null>(null);
  
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
  
  // Handle parameter changes and preview updates on filter nodes
  const handleParamChange = useCallback((nodeId: string, paramName: string, value: number | string) => {
    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (node.id === nodeId) {
          // Handle special case for preview updates
          if (paramName === 'preview') {
            return {
              ...node,
              data: {
                ...node.data,
                preview: value as string,
              },
            };
          }
          // Regular parameter update
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
    
    // After parameter changes, trigger processing if this isn't a preview update
    if (paramName !== 'preview' && processImageRef.current) {
      setTimeout(() => {
        processImageRef.current?.();
      }, 100);
    }
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
  }, [handleParamChange, handleToggleEnabled, handleBlendModeChange, handleOpacityChange, handleRemoveNode]);

  // Selected node data
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;

  // Generate node preview for the selected node (to be shown in the preview panel)
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
      
      // Set the preview in the preview panel
      setNodePreview(result);
      
      // Also update the node's own preview
      if (targetNode.type !== 'imageNode') {
        handleParamChange(targetNode.id, 'preview', result);
      }
    } catch (error) {
      console.error('Error generating node preview:', error);
      setNodePreview(null);
    }
  }, [nodes, edges, sourceImageRef, handleParamChange]);
  
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
  
  // Forward declaration for the processImage function reference
  const updateAllNodePreviewsRef = useRef<() => void>(() => {});

  // Process the entire image with all filter nodes
  const processImage = useCallback(() => {
    if (!sourceImageRef.current) return;
    
    // Store reference to this function
    processImageRef.current = processImage;
    
    // Create a canvas for the processed image
    if (!exportCanvasRef.current) {
      exportCanvasRef.current = document.createElement('canvas');
    }
    
    try {
      console.log("Processing image and generating main preview");
      
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
      
      // Update all node previews after processing the main image
      // Note: This is a separate function now to ensure proper updates
      setTimeout(() => {
        if (updateAllNodePreviewsRef.current) {
          updateAllNodePreviewsRef.current();
        }
      }, 50);
      
    } catch (error) {
      console.error('Error processing image:', error);
      setProcessedImage(null);
    }
  }, [nodes, edges, selectedNodeId, sourceImageRef, exportCanvasRef]);
  
  // Function to force update all node previews
  const updateAllNodePreviews = useCallback(() => {
    if (!sourceImageRef.current) {
      console.log('No source image available for previews');
      return;
    }
    
    console.log("Forcing update of all node previews");
    
    // Track all nodes we need to update with their new preview data
    const nodeUpdates: Record<string, string> = {};
    
    // Process each node one at a time
    for (const node of nodes) {
      if (node.type !== 'imageNode' && node.type !== 'customNode') {
        try {
          console.log(`Generating preview for node ${node.id} (${node.type})...`);
          
          // Find all nodes and edges in the chain leading to this node
          const nodeChain = getNodeChain(node.id, nodes, edges);
          
          // Skip if the node has no input connections and it's not a noise generator
          if (nodeChain.nodes.length <= 1 && 
              !((node.data as FilterNodeData).filterType === 'noiseGenerator')) {
            console.log(`Skipping node ${node.id} as it has no inputs`);
            continue;
          }
          
          // Create a temporary canvas for the preview
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 150; // Smaller for embedded preview
          tempCanvas.height = 150;
          
          // Make sure we have a 2D context
          const ctx = tempCanvas.getContext('2d');
          if (!ctx) {
            console.error(`Failed to get 2D context for preview canvas for node ${node.id}`);
            continue;
          }
          
          // Process the image through the node chain
          const result = applyFilters(
            sourceImageRef.current!, 
            nodeChain.nodes, 
            nodeChain.edges, 
            tempCanvas
          );
          
          // If applyFilters failed, try using the nodeResultCache directly
          if (!result || !result.startsWith('data:image/')) {
            console.warn(`Using direct nodeResultCache for node ${node.id} preview`);
            
            try {
              // Try to get the cached result directly
              const cachedCanvas = nodeResultCache.get(node.id);
              
              if (cachedCanvas) {
                // Clear our canvas
                ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // Draw the cached result to our temporary canvas
                ctx.drawImage(cachedCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
                
                // Generate a data URL directly from this canvas
                const fallbackResult = tempCanvas.toDataURL('image/png');
                
                if (fallbackResult && fallbackResult.startsWith('data:image/')) {
                  console.log(`Generated direct cache preview for node ${node.id}`);
                  nodeUpdates[node.id] = fallbackResult;
                } else {
                  throw new Error("Failed to create valid data URL from cached canvas");
                }
              } else {
                // Last resort - create a simple preview
                console.warn(`No cached canvas for node ${node.id}, creating placeholder`);
                
                // Clear canvas
                ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                if (sourceImageRef.current) {
                  // Draw the source image with filter name
                  ctx.drawImage(sourceImageRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
                  
                  // Add filter type label
                  if (node.type === 'filterNode') {
                    const filterType = (node.data as FilterNodeData).filterType;
                    ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    ctx.fillRect(0, 0, tempCanvas.width, 20);
                    ctx.fillStyle = '#000';
                    ctx.font = '10px sans-serif';
                    ctx.fillText(filterType, 5, 12);
                  }
                  
                  const placeholderResult = tempCanvas.toDataURL('image/png');
                  console.log(`Created placeholder preview for node ${node.id}`);
                  nodeUpdates[node.id] = placeholderResult;
                }
              }
            } catch (fallbackError) {
              console.error('All fallback preview methods failed:', fallbackError);
            }
          } else {
            // If we got a valid result from applyFilters, use it
            nodeUpdates[node.id] = result;
            console.log(`Generated valid preview for node ${node.id} (length: ${result.length})`);
          }
        } catch (error) {
          console.error(`Error generating preview for node ${node.id}:`, error);
        }
      }
    }
    
    // Batch update all nodes at once
    if (Object.keys(nodeUpdates).length > 0) {
      console.log(`Applying batch update to ${Object.keys(nodeUpdates).length} nodes:`, Object.keys(nodeUpdates));
      
      // Track previews we're applying for debug purposes
      const updatedPreviews: Record<string, boolean> = {};
      
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => {
          if (nodeUpdates[node.id]) {
            console.log(`Setting preview for node ${node.id} with data URL length: ${nodeUpdates[node.id].length}`);
            updatedPreviews[node.id] = true;
            
            // Create a completely new node object with the preview data
            const updatedNode = {
              ...node,
              data: {
                ...node.data,
                preview: nodeUpdates[node.id]
              }
            };
            
            return updatedNode;
          }
          return node;
        });
        
        // Log any discrepancies
        const missingNodes = Object.keys(nodeUpdates).filter(id => !updatedPreviews[id]);
        if (missingNodes.length > 0) {
          console.error(`Failed to update some nodes: ${missingNodes.join(', ')}`);
        }
        
        console.log(`Updated ${Object.keys(updatedPreviews).length} nodes with previews`);
        return newNodes;
      });
    }
  }, [nodes, edges, sourceImageRef, setNodes]);
  
  // Store the reference to use in processImage
  useEffect(() => {
    updateAllNodePreviewsRef.current = updateAllNodePreviews;
  }, [updateAllNodePreviews]);
  
  // Effect to update selected node preview for the main panel
  useEffect(() => {
    if (!sourceImageRef.current) return;
    
    // Update preview for selected node (only for the preview panel)
    if (selectedNodeId) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) {
        generateNodePreview(node);
      }
    } else {
      setNodePreview(null);
    }
  }, [selectedNodeId, nodes, sourceImageRef, generateNodePreview]);
  
  // Effect to trigger preview updates when nodes or edges change
  useEffect(() => {
    if (sourceImageRef.current) {
      // Don't update previews on every node change - this can cause performance issues
      // Use a debounce to prevent rapid updates
      const debounceTime = 300; // milliseconds
      
      console.log("Nodes or edges changed, scheduling preview update");
      
      const updateTimer = setTimeout(() => {
        console.log("Executing scheduled preview update");
        updateAllNodePreviews();
      }, debounceTime);
      
      // Cleanup function to clear the timeout if component unmounts or deps change
      return () => {
        clearTimeout(updateTimer);
      };
    }
  }, [nodes, edges, updateAllNodePreviews, sourceImageRef]);
  
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
    
    // Determine the node type - texture generators use a different component
    const nodeType = filterType === 'textureGenerator' ? 'textureGenerator' : 'filterNode';
    
    const newNode: Node<FilterNodeData> = {
      id,
      type: nodeType,
      position: { x: 250, y: 150 },
      data: nodeData,
    };
    
    setNodes(prevNodes => [...prevNodes, newNode]);
    
    // Generate preview after adding any node - we'll handle the no-input case in the 
    // preview generator which will create a fallback preview if needed
    // Allow time for the node to be added to the state
    setTimeout(() => {
      if (updateAllNodePreviewsRef.current) {
        console.log(`Triggering preview update after adding ${filterType} node`);
        updateAllNodePreviewsRef.current();
      }
    }, 150);
    
    return id;
  }, [findFilterByType, handleParamChange, handleToggleEnabled, handleBlendModeChange, handleOpacityChange, handleRemoveNode]);
  
  // Connect two nodes
  const onConnect = useCallback((connection: Connection) => {
    console.log(`Connecting: ${connection.source} -> ${connection.target} (handle: ${connection.targetHandle})`);
    
    // Special handling for input connections - we'll normalize dynamic input handles
    let targetHandle = connection.targetHandle;
    let sourceHandle = connection.sourceHandle;
    
    // Configure the edge appearance
    const newEdge = {
      ...connection,
      // Keep the original handle IDs
      targetHandle,
      sourceHandle,
      // Ensure the edge is uniquely identified
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      // Visual styling
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#888',
      },
      animated: true,
      // Add data to help with filter chain processing
      data: {
        // Store information about the nodes being connected
        sourceNode: nodes.find(n => n.id === connection.source)?.type || 'unknown',
        targetNode: nodes.find(n => n.id === connection.target)?.type || 'unknown'
      }
    };
    
    console.log(`Created edge: ${JSON.stringify(newEdge)}`);
    
    // Add the edge to our graph
    setEdges(prevEdges => addEdge(newEdge, prevEdges));
    
    // Ensure the connected nodes get processed in the right order
    processImage();
    
    // Update previews for all affected nodes
    setTimeout(() => {
      if (updateAllNodePreviewsRef.current) {
        updateAllNodePreviewsRef.current();
      }
    }, 100);
  }, [nodes, processImage]);
  
  // Upload an image
  const uploadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSourceImage(e.target.result as string);
        
        // Give the image time to load before processing
        setTimeout(() => {
          // Update all node previews after a new source image is loaded
          if (updateAllNodePreviewsRef.current) {
            console.log("Triggering preview updates after new image upload");
            updateAllNodePreviewsRef.current();
          }
        }, 200);
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
  
  // Copy selected nodes to clipboard
  const copySelectedNodes = useCallback(() => {
    // Get all selected nodes
    const selectedNodes = nodes.filter(node => node.selected);
    
    if (selectedNodes.length === 0) {
      console.log("No nodes selected to copy");
      return;
    }
    
    console.log(`Copying ${selectedNodes.length} node(s) to clipboard`);
    
    // Deep clone the selected nodes to avoid reference issues
    const nodesToCopy = selectedNodes.map(node => ({
      ...node,
      // Generate a mapping of original IDs to new IDs for when we paste
      originalId: node.id
    })) as ClipboardNode[];
    
    // Find edges between selected nodes
    const relevantEdges = edges.filter(edge => {
      const sourceSelected = selectedNodes.some(n => n.id === edge.source);
      const targetSelected = selectedNodes.some(n => n.id === edge.target);
      // Only include edges where both source and target are selected
      return sourceSelected && targetSelected;
    }).map(edge => ({
      ...edge,
      originalSource: edge.source,
      originalTarget: edge.target
    })) as ClipboardEdge[];
    
    // Store in clipboard state
    setClipboardNodes(nodesToCopy);
    setClipboardEdges(relevantEdges);
    
    console.log("Copied to clipboard:", {
      nodes: nodesToCopy,
      edges: relevantEdges
    });
  }, [nodes, edges]);
  
  // Paste nodes from clipboard
  const pasteNodes = useCallback(() => {
    if (clipboardNodes.length === 0) {
      console.log("Nothing to paste");
      return;
    }
    
    console.log(`Pasting ${clipboardNodes.length} node(s) from clipboard`);
    
    // Generate new IDs for all nodes
    const idMap = new Map<string, string>();
    
    // Create new nodes with new IDs at slightly offset positions
    const newNodes = clipboardNodes.map(node => {
      const originalId = node.originalId || node.id;
      // Handle potential undefined type by using a default
      const nodeType = node.type || 'filterNode';
      const newId = `${nodeType.replace('Node', '')}-${uuidv4().substring(0, 8)}`;
      
      // Store the mapping of original to new ID
      idMap.set(originalId, newId);
      
      // Create a new node with offset position
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 50, // Offset to make it clear it's a copy
          y: node.position.y + 50
        },
        selected: true, // Select the newly pasted nodes
        originalId: undefined // Remove the temporary property
      } as Node;
    });
    
    // Create new edges with updated source/target IDs
    const newEdges = clipboardEdges.map(edge => {
      const originalSource = edge.originalSource || edge.source;
      const originalTarget = edge.originalTarget || edge.target;
      
      // Get the new IDs for the source and target
      const newSource = idMap.get(originalSource);
      const newTarget = idMap.get(originalTarget);
      
      // Only create edge if both nodes exist in the paste operation
      if (newSource && newTarget) {
        // Create a clean edge object without the custom properties
        const newEdge: Edge = {
          id: `edge-${newSource}-${newTarget}-${Date.now()}`,
          source: newSource,
          target: newTarget,
          // Copy any standard edge properties we need
          type: edge.type,
          animated: edge.animated,
          style: edge.style,
          label: edge.label,
          markerEnd: edge.markerEnd,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          data: edge.data
        };
        return newEdge;
      }
      return null;
    }).filter(Boolean) as Edge[];
    
    // Add the new nodes and edges to the graph
    setNodes(prevNodes => [...prevNodes, ...newNodes]);
    setEdges(prevEdges => [...prevEdges, ...newEdges]);
    
    // Process the image with the updated graph using the processImageRef
    setTimeout(() => {
      try {
        if (processImageRef.current) {
          processImageRef.current();
        }
      } catch (e) {
        console.error("Error processing image after paste:", e);
      }
    }, 0);
  }, [clipboardNodes, clipboardEdges]);
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check for Copy (Ctrl+C or Cmd+C)
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      copySelectedNodes();
    }
    
    // Check for Paste (Ctrl+V or Cmd+V)
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      event.preventDefault();
      pasteNodes();
    }
  }, [copySelectedNodes, pasteNodes]);
  
  // Set up keyboard event listeners
  useEffect(() => {
    // Add event listener for keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
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
    addCustomNode,
    copySelectedNodes,
    pasteNodes
  };
}