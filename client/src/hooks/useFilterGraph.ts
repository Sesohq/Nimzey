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
import { FilterType, FilterNodeData, ImageNodeData } from '@/types';
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
  const [isProcessing, setIsProcessing] = useState(false);
  
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
    const previewUrl = applyFilters(sourceImageRef.current, nodes, edges, canvas, targetNode.id);
    
    // If this is a filter node, update its preview property
    if (targetNode.type === 'filterNode' && previewUrl) {
      setNodes(currentNodes => 
        currentNodes.map(node => {
          if (node.id === targetNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                preview: previewUrl
              }
            };
          }
          return node;
        })
      );
    }
    
    return previewUrl;
  }, [nodes, edges, getCanvas]);

  // Process the image through the filter chain
  const processImage = useCallback(() => {
    if (!sourceImageRef.current) return;
    
    // Set processing state to true to show loading spinner
    setIsProcessing(true);
    
    // Use setTimeout to make processing non-blocking for UI
    setTimeout(() => {
      try {
        // Process image on the main thread for now
        // In the future, we'll fully implement web workers for better performance
        const canvas = getCanvas();
        
        // Process with the existing applyFilters function
        // We know sourceImageRef.current is not null from the check above
        const result = applyFilters(
          sourceImageRef.current as HTMLImageElement, 
          nodes, 
          edges, 
          canvas
        );
        
        if (result) {
          // Update the processed image
          setProcessedImage(result);
          
          // Update previews for filter nodes
          const filterNodes = nodes.filter(node => node.type === 'filterNode');
          for (const node of filterNodes) {
            generateNodePreview(node);
          }
          
          // If a node is selected, update its preview in the panel
          if (selectedNodeId) {
            const selectedNode = nodes.find(n => n.id === selectedNodeId);
            if (selectedNode) {
              const preview = generateNodePreview(selectedNode);
              setNodePreview(preview);
            }
          }
        }
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        // Clear processing state
        setIsProcessing(false);
      }
    }, 0); // Use 0ms timeout to defer execution until after UI updates
  }, [nodes, edges, selectedNodeId, getCanvas, generateNodePreview]);
  
  /* 
  // These functions will be used when we implement Web Workers fully
  // For now, we're using setTimeout to keep the UI responsive
  
  // Function to get the processing order of nodes
  const getProcessOrder = useCallback((nodes: Node[], edges: Edge[]): string[] => {
    // Find the source node (image node)
    const sourceNode = nodes.find(node => node.type === 'imageNode');
    if (!sourceNode) return [];
    
    // Start with the source node
    const order: string[] = [sourceNode.id];
    const visited = new Set<string>([sourceNode.id]);
    
    // Perform a breadth-first traversal
    let currentIdx = 0;
    
    while (currentIdx < order.length) {
      const currentNodeId = order[currentIdx];
      
      // Find all outgoing edges from this node
      const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
      
      // Add target nodes to the order if not already visited
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          order.push(edge.target);
          visited.add(edge.target);
        }
      }
      
      currentIdx++;
    }
    
    return order;
  }, []);
  
  // Update previews for all filter nodes
  const updateNodePreviews = useCallback(async () => {
    if (!sourceImageRef.current) return;
    
    // Process each filter node to generate its preview
    const filterNodes = nodes.filter(node => node.type === 'filterNode');
    
    for (const node of filterNodes) {
      await generateNodePreview(node);
    }
    
    // If a node is selected, update its preview in the preview panel
    if (selectedNodeId) {
      const selectedNode = nodes.find(n => n.id === selectedNodeId);
      if (selectedNode) {
        const preview = await generateNodePreview(selectedNode);
        setNodePreview(preview);
      }
    }
  }, [nodes, selectedNodeId, generateNodePreview]);
  */

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

  // Function to add a new filter node
  const addNode = useCallback((filterType: FilterType) => {
    const filterDef = findFilterByType(filterType);
    if (!filterDef) return;

    const newNodeId = `${filterType}-${uuidv4().substring(0, 8)}`;
    
    // Create the node data with default params and empty preview
    const nodeData: FilterNodeData = {
      label: `${filterDef.name}`,
      filterType,
      params: filterDef.params.map(param => ({ ...param })),
      enabled: true,
      preview: null,
      onParamChange: handleParamChange,
      onToggleEnabled: handleToggleEnabled,
    };

    const newNode = {
      id: newNodeId,
      type: 'filterNode',
      position: { 
        x: Math.random() * 300 + 250, 
        y: Math.random() * 200 + 100
      },
      data: nodeData,
    };

    // Add the new node
    setNodes(nds => [...nds, newNode]);

    // Select the new node
    setSelectedNodeId(newNodeId);
    
    // Generate preview for the new node if we have a source image
    if (sourceImageRef.current) {
      setTimeout(() => generateNodePreview(newNode), 10);
    }
  }, [findFilterByType, handleParamChange, handleToggleEnabled, generateNodePreview, sourceImageRef]);

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
    const newEdge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}`,
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
  }, [processImage]);

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
    isProcessing
  };
}