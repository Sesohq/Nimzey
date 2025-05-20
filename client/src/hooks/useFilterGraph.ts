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
import { FilterType, FilterNodeData, ImageNodeData, BlendMode, NodeColorTag, FilterParam } from '@/types';
import { filterCategories } from '@/lib/filterCategories';
import { applyFilters } from '@/lib/filterAlgorithms';
import { toast } from '@/hooks/use-toast';

export function useFilterGraph() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [nodePreview, setNodePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImages, setProcessedImages] = useState<Record<string, string>>({});
  const [activeOutputNodeId, setActiveOutputNodeId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const uploadFunctionRef = useRef<((file: File) => void)>(() => {});
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize canvas when needed
  const getCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    return canvasRef.current;
  }, []);

  // Initialize hidden canvas for filter processing
  const getHiddenCanvas = useCallback(() => {
    if (!hiddenCanvasRef.current) {
      hiddenCanvasRef.current = document.createElement('canvas');
      if (sourceImageRef.current) {
        hiddenCanvasRef.current.width = sourceImageRef.current.width;
        hiddenCanvasRef.current.height = sourceImageRef.current.height;
      }
    }
    return hiddenCanvasRef.current;
  }, []);

  // Generate a preview for a specific node
  const generateNodePreview = useCallback((targetNode: Node) => {
    if (!sourceImageRef.current) return null;
    
    // If we already have a processed image for this node, use it
    if (processedImages[targetNode.id]) {
      return processedImages[targetNode.id];
    }
    
    // Otherwise, generate a new preview
    const canvas = getCanvas();
    const previewUrl = applyFilters(sourceImageRef.current, nodes, edges, canvas, targetNode.id);
    
    // If this is a filter node, update its preview property
    if (targetNode.type === 'filterNode' && previewUrl) {
      // Update the processed images map
      setProcessedImages(prev => ({
        ...prev,
        [targetNode.id]: previewUrl
      }));
      
      // Update the node's preview property
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
  }, [nodes, edges, getCanvas, processedImages]);

  // Update connected parameter values
  const updateConnectedParams = useCallback(() => {
    const nodeMap = new Map<string, Node>();
    nodes.forEach(node => nodeMap.set(node.id, node));
    
    // Get all filter nodes that have parameter connections
    const filterNodes = nodes.filter(node => 
      node.type === 'filterNode' && 
      (node.data as FilterNodeData).paramConnections &&
      Object.keys((node.data as FilterNodeData).paramConnections!).length > 0
    );
    
    // For each filter node with connections
    filterNodes.forEach(node => {
      const nodeData = node.data as FilterNodeData;
      const connections = nodeData.paramConnections || {};
      
      // Process each connected parameter
      Object.entries(connections).forEach(([paramId, connection]) => {
        const { sourceNodeId, sourceParamId } = connection;
        const sourceNode = nodeMap.get(sourceNodeId);
        
        if (sourceNode && sourceNode.type === 'filterNode') {
          const sourceNodeData = sourceNode.data as FilterNodeData;
          
          // Find the source parameter
          const sourceParam = sourceNodeData.params.find(p => 
            (p.id || p.name) === sourceParamId
          );
          
          // Find the target parameter
          const targetParamIndex = nodeData.params.findIndex(p => 
            (p.id || p.name) === paramId
          );
          
          // If both parameters exist, update the target parameter value
          if (sourceParam && targetParamIndex !== -1) {
            // Convert values if necessary based on parameter types
            let updatedValue = sourceParam.value;
            const targetParam = nodeData.params[targetParamIndex];
            
            // Type conversion if needed (e.g., float to int)
            if (targetParam.paramType === 'integer' && typeof updatedValue === 'number') {
              updatedValue = Math.round(updatedValue);
            }
            
            // Update the node data directly
            setNodes(currentNodes => 
              currentNodes.map(n => {
                if (n.id === node.id) {
                  const data = n.data as FilterNodeData;
                  const updatedParams = [...data.params];
                  updatedParams[targetParamIndex] = {
                    ...updatedParams[targetParamIndex],
                    value: updatedValue,
                  };
                  
                  return {
                    ...n,
                    data: {
                      ...data,
                      params: updatedParams
                    }
                  };
                }
                return n;
              })
            );
          }
        }
      });
    });
  }, [nodes]);

  // Process connected nodes from a source node
  const processConnectedNodes = useCallback((sourceNodeId: string, sourceImageUrl: string) => {
    // Skip if we're already processing or no source image
    if (!sourceImageRef.current) {
      console.error("Source image reference not available");
      return;
    }
    
    // Set processing state to true to show loading spinner
    setIsProcessing(true);
    
    // Create or update the canvas for processing
    const canvas = getHiddenCanvas();
    if (sourceImageRef.current) {
      canvas.width = sourceImageRef.current.width;
      canvas.height = sourceImageRef.current.height;
    }
    
    // Find all edges coming from this node
    const outgoingEdges = edges.filter(edge => edge.source === sourceNodeId);
    if (outgoingEdges.length === 0) {
      console.log(`No outgoing edges from node ${sourceNodeId}`);
      setIsProcessing(false);
      return;
    }
    
    // Create a queue for processing to avoid deep recursion
    const nodesToProcess = [...outgoingEdges];
    
    // Process one node at a time to avoid UI jank
    const processNextNode = () => {
      if (nodesToProcess.length === 0) {
        setIsProcessing(false);
        return;
      }
      
      // Get the next node from the queue
      const edge = nodesToProcess.shift();
      if (!edge) {
        setIsProcessing(false);
        return;
      }
      
      const targetNodeId = edge.target;
      
      // Get the target node
      const targetNode = nodes.find(node => node.id === targetNodeId);
      if (!targetNode) {
        console.error(`Target node ${targetNodeId} not found`);
        setTimeout(processNextNode, 0);
        return;
      }
      
      // Load the source image
      const sourceImage = new Image();
      sourceImage.src = sourceImageUrl;
      
      // Process when image is loaded
      sourceImage.onload = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error("Could not get canvas context");
          setTimeout(processNextNode, 0);
          return;
        }
        
        // Draw source image to canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sourceImage, 0, 0);
        
        // Get pixel data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // For now, use our existing applyFilters function to process this specific node
        const processedImageUrl = applyFilters(
          sourceImage,
          nodes,
          edges,
          canvas,
          targetNodeId
        );
        
        if (processedImageUrl) {
          // Update the processed images map
          setProcessedImages(prev => ({
            ...prev,
            [targetNodeId]: processedImageUrl
          }));
          
          // Update the node preview, but only if it's not an imageFilterNode
          // This prevents overwriting the uploaded image in image nodes
          setNodes(currentNodes =>
            currentNodes.map(node => {
              if (node.id === targetNodeId && node.type !== 'imageFilterNode') {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    preview: processedImageUrl
                  }
                };
              }
              return node;
            })
          );
          
          // Add connected nodes to processing queue
          const nextEdges = edges.filter(e => e.source === targetNodeId);
          nextEdges.forEach(e => {
            nodesToProcess.push(e);
          });
        }
        
        // Process next node with slight delay to allow UI to update
        setTimeout(processNextNode, 10);
      };
      
      sourceImage.onerror = () => {
        console.error(`Error loading image from ${sourceImageUrl}`);
        setTimeout(processNextNode, 0);
      };
    };
    
    // Start processing the queue
    processNextNode();
  }, [edges, nodes, getHiddenCanvas]);

  // Utility function to convert ImageData to a data URL
  const imageDataToDataURL = useCallback((imageData: ImageData): string => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }, []);
  
  // Utility function to load an image from URL to ImageData
  const loadImageData = useCallback(async (src: string): Promise<ImageData | null> => {
    if (!src) return null;
    
    try {
      // Create a new image and pre-decode it
      const img = new Image();
      img.src = src;
      await img.decode();
      
      // Create a temporary canvas to convert the image to ImageData
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Draw the image and get its pixel data
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error loading image:', error);
      return null;
    }
  }, []);
  
  // Blend two images with the specified blend mode and opacity
  const blendImages = useCallback((
    baseImageData: ImageData, 
    overlayImageData: ImageData, 
    blendMode: string = 'normal', 
    opacity: number = 100
  ): ImageData => {
    // Create a canvas for blending
    const canvas = document.createElement('canvas');
    canvas.width = baseImageData.width;
    canvas.height = baseImageData.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return baseImageData;
    
    // First draw the base image
    ctx.putImageData(baseImageData, 0, 0);
    
    // Create a temp canvas for the overlay
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = overlayImageData.width;
    overlayCanvas.height = overlayImageData.height;
    
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!overlayCtx) return baseImageData;
    
    // Draw the overlay image
    overlayCtx.putImageData(overlayImageData, 0, 0);
    
    // Now blend the overlay onto the base using the specified blend mode
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.globalCompositeOperation = convertBlendMode(blendMode);
    
    // Scale the overlay to fit if needed
    ctx.drawImage(
      overlayCanvas, 
      0, 0, overlayCanvas.width, overlayCanvas.height,
      0, 0, canvas.width, canvas.height
    );
    
    ctx.restore();
    
    // Return the combined result
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, []);
  
  // Helper function to convert blend mode string to canvas blend mode
  const convertBlendMode = (mode: string): GlobalCompositeOperation => {
    switch (mode) {
      case 'normal': return 'source-over';
      case 'multiply': return 'multiply';
      case 'screen': return 'screen';
      case 'overlay': return 'overlay';
      case 'darken': return 'darken';
      case 'lighten': return 'lighten';
      case 'color-dodge': return 'color-dodge';
      case 'color-burn': return 'color-burn';
      case 'hard-light': return 'hard-light';
      case 'soft-light': return 'soft-light';
      case 'difference': return 'difference';
      case 'exclusion': return 'exclusion';
      default: return 'source-over';
    }
  };
  
  // Get a node by ID
  const getNodeById = useCallback((id: string) => {
    return nodes.find(node => node.id === id);
  }, [nodes]);
  
  // Process the image through the filter chain
  const processImage = useCallback(async () => {
    if (!sourceImageRef.current || !sourceImage) return;
    
    // First, update any connected parameters
    updateConnectedParams();
    
    // Find source nodes (nodes with no incoming edges, typically image nodes)
    const nodeIncomingEdges = new Map<string, number>();
    edges.forEach(edge => {
      const count = nodeIncomingEdges.get(edge.target) || 0;
      nodeIncomingEdges.set(edge.target, count + 1);
    });
    
    const sourceNodes = nodes.filter(node => 
      node.type === 'imageNode' && (!nodeIncomingEdges.has(node.id) || nodeIncomingEdges.get(node.id) === 0)
    );
    
    if (sourceNodes.length === 0) {
      setIsProcessing(false);
      return;
    }
    
    // Find output nodes
    const outputNodes = nodes.filter(node => node.type === 'outputNode');
    
    // Start processing from each source node
    sourceNodes.forEach(sourceNode => {
      processConnectedNodes(sourceNode.id, sourceImage);
    });
    
    // For the final processed image, we still use the full chain process
    // This ensures we have a complete result for export
    try {
      const canvas = getCanvas();
      
      // If we have an active output node, use it for processing
      let result: string | null = null;
      
      if (activeOutputNodeId && outputNodes.some(node => node.id === activeOutputNodeId)) {
        // Process specifically to the active output node
        result = applyFilters(
          sourceImageRef.current as HTMLImageElement, 
          nodes, 
          edges, 
          canvas,
          undefined,
          activeOutputNodeId
        );
        
        // Update the output node with the result
        if (result) {
          setNodes(nds => nds.map(node => {
            if (node.id === activeOutputNodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  preview: result
                }
              };
            }
            return node;
          }));
        }
      } else {
        // If no active output node, process the whole chain
        result = applyFilters(
          sourceImageRef.current as HTMLImageElement, 
          nodes, 
          edges, 
          canvas
        );
      }
      
      if (result) {
        // Update the processed image
        setProcessedImage(result);
        
        // If a node is selected, update its preview in the panel
        if (selectedNodeId) {
          const selectedNode = nodes.find(n => n.id === selectedNodeId);
          if (selectedNode) {
            // Use cached preview if available, otherwise generate
            if (processedImages[selectedNodeId]) {
              setNodePreview(processedImages[selectedNodeId]);
            } else {
              const preview = generateNodePreview(selectedNode);
              setNodePreview(preview);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing final image:', error);
    }
  }, [
    nodes, 
    edges, 
    sourceImage, 
    selectedNodeId, 
    getCanvas, 
    getHiddenCanvas, 
    generateNodePreview, 
    updateConnectedParams, 
    processConnectedNodes,
    processedImages
  ]);
  
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
  const handleParamChange = useCallback((nodeId: string, paramId: string, value: number | string | boolean) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId && node.type === 'filterNode') {
          const nodeData = node.data as FilterNodeData;
          return {
            ...node,
            data: {
              ...nodeData,
              params: nodeData.params.map(param => 
                (param.id || param.name) === paramId ? { ...param, value } : param
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
  
  // Handle changing a node's blend mode
  const handleBlendModeChange = useCallback((nodeId: string, blendMode: BlendMode) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId && node.type === 'filterNode') {
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
    
    processImage();
  }, [processImage]);
  
  // Handle changing node opacity
  const handleOpacityChange = useCallback((nodeId: string, opacity: number) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId && node.type === 'filterNode') {
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
    
    processImage();
  }, [processImage]);
  
  // Handle changing node color tag
  const handleColorTagChange = useCallback((nodeId: string, colorTag: NodeColorTag) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId && node.type === 'filterNode') {
          const nodeData = node.data as FilterNodeData;
          return {
            ...node,
            data: {
              ...nodeData,
              colorTag
            }
          };
        }
        return node;
      })
    );
  }, []);
  
  // Handle collapsing/expanding node
  const handleToggleCollapsed = useCallback((nodeId: string, collapsed: boolean) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId && node.type === 'filterNode') {
          const nodeData = node.data as FilterNodeData;
          return {
            ...node,
            data: {
              ...nodeData,
              collapsed
            }
          };
        }
        return node;
      })
    );
  }, []);
  
  // Handle connecting a parameter to another node's output
  const handleConnectParam = useCallback((
    nodeId: string, 
    paramId: string, 
    sourceNodeId: string, 
    sourceParamId: string
  ) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId && node.type === 'filterNode') {
          const nodeData = node.data as FilterNodeData;
          
          // Update the parameter to mark it as connected
          const updatedParams = nodeData.params.map(param => {
            if ((param.id || param.name) === paramId) {
              return { 
                ...param, 
                isConnected: true,
                sourceNodeId,
                sourceParamId
              };
            }
            return param;
          });
          
          // Update the node's connection record
          const paramConnections = {
            ...(nodeData.paramConnections || {}),
            [paramId]: {
              sourceNodeId,
              sourceParamId
            }
          };
          
          return {
            ...node,
            data: {
              ...nodeData,
              params: updatedParams,
              paramConnections
            }
          };
        }
        return node;
      })
    );
    
    // First update connected parameters to propagate values
    updateConnectedParams();

    // Then process the image with the updated values
    processImage();
  }, [processImage, updateConnectedParams]);
  
  // Handle disconnecting a parameter
  const handleDisconnectParam = useCallback((nodeId: string, paramId: string) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId && node.type === 'filterNode') {
          const nodeData = node.data as FilterNodeData;
          
          // Update the parameter to mark it as disconnected
          const updatedParams = nodeData.params.map(param => {
            if ((param.id || param.name) === paramId) {
              // Create a new parameter without the connection properties
              const { isConnected, sourceNodeId, sourceParamId, ...rest } = param;
              return rest as FilterParam;
            }
            return param;
          });
          
          // Remove the connection from the connections record
          const paramConnections = { ...(nodeData.paramConnections || {}) };
          if (paramConnections[paramId]) {
            delete paramConnections[paramId];
          }
          
          return {
            ...node,
            data: {
              ...nodeData,
              params: updatedParams,
              paramConnections
            }
          };
        }
        return node;
      })
    );
    
    // Update any remaining connected parameters
    updateConnectedParams();

    // Then process the image
    processImage();
  }, [processImage, updateConnectedParams]);

  // Upload an image function for the source node
  const uploadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setSourceImage(imageDataUrl);
      
      // Create a new image element to store the original
      const img = new Image();
      
      img.onload = () => {
        sourceImageRef.current = img;

        // Update the nodes with the new image and add an output node if needed
        setNodes(nds => {
          // First update the image node
          const updatedNodes = nds.map(node => {
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
          });
          
          // Find the source node and check if we already have an output node
          const sourceNode = updatedNodes.find(node => node.id.startsWith('source-'));
          const hasOutputNode = updatedNodes.some(node => node.type === 'outputNode');
          
          // If we have a source node but no output node, create one
          if (sourceNode && !hasOutputNode) {
            const outputNodeId = `output-${uuidv4().substring(0, 8)}`;
            const outputNode = {
              id: outputNodeId,
              type: 'outputNode',
              position: { 
                x: sourceNode.position.x + 400, 
                y: sourceNode.position.y 
              },
              data: {
                preview: null,
                isActive: true
              }
            };
            
            // Add the output node to our nodes array
            updatedNodes.push(outputNode);
            
            // Set this as the active output node
            setTimeout(() => setActiveOutputNodeId(outputNodeId), 0);
          }
          
          return updatedNodes;
        });
        
        // Process the image after nodes are updated
        processImage();
      };
      
      img.src = imageDataUrl;
    };
    reader.readAsDataURL(file);
  }, [processImage]);
  
  // Upload an image to an Image filter node (separate from the source node)
  const uploadNodeImage = useCallback((nodeId: string, file: File) => {
    console.log(`Uploading image to node ${nodeId}`);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      if (e.target && e.target.result) {
        const imageDataUrl = e.target.result as string;
        
        try {
          // Create a new image and pre-decode it to avoid async loading issues
          const img = new Image();
          img.src = imageDataUrl;
          await img.decode();  // Wait for it to fully load
          
          // Create a temporary canvas to draw the image and get its pixel data
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) throw new Error("Could not create temp context");
          
          // Set canvas dimensions to match the image
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          
          // Draw the image and get its pixel data
          tempCtx.drawImage(img, 0, 0);
          const texturePixels = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          
          // Update the node with both the image data URL and the pre-decoded pixel data
          setNodes(prev =>
            prev.map(node => {
              if (node.id !== nodeId) return node;
              
              // Update the params array with the image data URL for serialization
              const newParams = (node.data as FilterNodeData).params.map(p => {
                if (p.id === 'image-data' || p.name === 'imageData') {
                  return { ...p, value: imageDataUrl };
                }
                return p;
              });
              
              return {
                ...node,
                data: {
                  ...node.data,
                  params: newParams,
                  // Save the decoded pixels for synchronous access during filtering
                  texturePixels,
                  // Set the preview to the image data for immediate UI feedback
                  preview: imageDataUrl
                }
              };
            })
          );
          
          // Re-run the processing chain to update all previews
          processImage();
          
          toast({
            title: "Image uploaded",
            description: "The image has been uploaded to the node",
            variant: "default"
          });
        } catch (error) {
          console.error("Error processing uploaded image:", error);
          toast({
            title: "Upload failed",
            description: "Could not process the image",
            variant: "destructive"
          });
        }
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Could not read the image file",
        variant: "destructive"
      });
    };
    
    reader.readAsDataURL(file);
  }, [setNodes, processImage, toast]);

  // Set the upload function reference for use in image nodes
  useEffect(() => {
    uploadFunctionRef.current = uploadImage;
    
    // Make uploadNodeImage available globally for direct access by the image filter node
    if (typeof window !== 'undefined') {
      window.uploadNodeImage = uploadNodeImage;
    }
  }, [uploadImage, uploadNodeImage]);
  
  // Function to set the active output node
  const setActiveOutput = useCallback((nodeId: string | null) => {
    // Deactivate all output nodes first
    setNodes(nds => 
      nds.map(node => {
        if (node.type === 'outputNode') {
          return {
            ...node,
            data: {
              ...node.data,
              isActive: node.id === nodeId
            }
          };
        }
        return node;
      })
    );
    
    // Update the active output node ID
    setActiveOutputNodeId(nodeId);
  }, []);

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
      }
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
    
    // For Image node type, create a special node
    if (filterType === 'image') {
      const newNode = {
        id: newNodeId,
        type: 'imageFilterNode',
        position: { 
          x: Math.random() * 300 + 250, 
          y: Math.random() * 200 + 100
        },
        data: {
          label: `${filterDef.name}`,
          filterType,
          // Important: Initialize with empty image data - do NOT use source image
          params: filterDef.params.map(param => ({
            ...param, 
            id: param.id || `${param.name}-${uuidv4().substring(0, 8)}`,
            controlType: param.controlType || 'select',
            paramType: param.paramType || 'image',
            // Ensure value is explicitly set to empty string
            value: ''
          })),
          // Do not set preview to sourceImage
          preview: null,
          enabled: true,
          colorTag: 'purple',
          blendMode: 'normal',
          opacity: 100,
          collapsed: false,
          onParamChange: handleParamChange,
          onToggleEnabled: handleToggleEnabled,
          onChangeBlendMode: handleBlendModeChange,
          onChangeOpacity: handleOpacityChange,
          onChangeColorTag: handleColorTagChange,
          onToggleCollapsed: handleToggleCollapsed,
          onConnectParam: handleConnectParam,
          onDisconnectParam: handleDisconnectParam
        },
      };
      
      // Add the new node
      setNodes(nds => [...nds, newNode]);
      return;
    }
    
    // Process params to ensure they have IDs for regular filter nodes
    const processedParams = filterDef.params.map(param => ({
      ...param, 
      id: param.id || `${param.name}-${uuidv4().substring(0, 8)}`,
      controlType: param.controlType || 'range',
      paramType: param.paramType || 'float'
    }));
    
    // Create the node data with default params and empty preview
    const nodeData: FilterNodeData = {
      label: `${filterDef.name}`,
      filterType,
      params: processedParams,
      enabled: true,
      preview: null,
      colorTag: 'default',
      blendMode: 'normal',
      opacity: 100,
      collapsed: false,
      onParamChange: handleParamChange,
      onToggleEnabled: handleToggleEnabled,
      onChangeBlendMode: handleBlendModeChange,
      onChangeOpacity: handleOpacityChange,
      onChangeColorTag: handleColorTagChange,
      onToggleCollapsed: handleToggleCollapsed,
      onConnectParam: handleConnectParam,
      onDisconnectParam: handleDisconnectParam
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
    // Check for removed edges to also disconnect parameters
    changes.forEach(change => {
      if (change.type === 'remove') {
        // Find the removed edge
        const removedEdge = edges.find(edge => edge.id === change.id);
        if (removedEdge) {
          // If this is a parameter connection, we need to update the node data
          const { source, target, sourceHandle, targetHandle } = removedEdge;
          
          if (targetHandle && targetHandle.startsWith('param-') && 
              sourceHandle && sourceHandle.startsWith('output-param-')) {
            
            // Get parameter ID from the handle
            const paramId = targetHandle.replace('param-', '');
            
            // Call the parameter disconnect function
            if (paramId !== 'sourceImage') { // Don't disconnect main node connections
              handleDisconnectParam(target, paramId);
            }
          }
        }
      }
    });
    
    // Apply the changes to the edges state
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, [edges, handleDisconnectParam]);

  // Check if adding a connection would create a cycle in the graph
  const checkForCycles = (currentEdges: Edge[], allNodes: Node[], newConnection: Connection): boolean => {
    if (!newConnection.source || !newConnection.target) return false;
    
    // If this is a self-connection, it's definitely a cycle
    if (newConnection.source === newConnection.target) {
      return true;
    }
    
    // Create a graph representation for cycle detection
    const graph: Record<string, string[]> = {};
    
    // Add existing edges to the graph
    currentEdges.forEach(edge => {
      if (!graph[edge.source]) {
        graph[edge.source] = [];
      }
      graph[edge.source].push(edge.target);
    });
    
    // Add the new edge
    if (!graph[newConnection.source]) {
      graph[newConnection.source] = [];
    }
    graph[newConnection.source].push(newConnection.target);
    
    // DFS to detect cycles
    const visited = new Set<string>();
    const path = new Set<string>();
    
    const hasCycle = (node: string): boolean => {
      if (!graph[node]) return false;
      
      if (path.has(node)) return true;
      if (visited.has(node)) return false;
      
      visited.add(node);
      path.add(node);
      
      for (const neighbor of graph[node]) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }
      
      path.delete(node);
      return false;
    };
    
    // Check for cycles from each node
    for (const node of allNodes) {
      if (!visited.has(node.id) && hasCycle(node.id)) {
        return true;
      }
    }
    
    return false;
  };
  
  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    // Prevent connections to the same node (no self-connections)
    if (connection.source === connection.target) {
      console.warn("Cannot connect a node to itself");
      toast({
        title: "Invalid Connection",
        description: "Cannot connect a node to itself",
        variant: "destructive",
      });
      return;
    }
    
    // Check for cycles before allowing the connection
    if (checkForCycles(edges, nodes, connection)) {
      console.warn("Cannot create connection: would create a cycle in the graph");
      toast({
        title: "Invalid Connection",
        description: "This would create a cycle in the filter graph. Cycles are not allowed.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if this is a connection to an OutputNode
    const targetNode = nodes.find(node => node.id === connection.target);
    if (targetNode && targetNode.type === 'outputNode') {
      // Set this OutputNode as the active one
      setActiveOutput(targetNode.id);
    }
    
    // Check if this is a parameter-level connection
    if (connection.targetHandle && connection.targetHandle.startsWith('param-') && 
        connection.sourceHandle && connection.sourceHandle.startsWith('output-param-')) {
      
      // Extract the parameter IDs from the handles
      const targetParamId = connection.targetHandle.replace('param-', '');
      const sourceParamId = connection.sourceHandle.replace('output-param-', '');
      
      // If the target is "sourceImage", this is a main connection between nodes
      if (targetParamId === 'sourceImage') {
        // Create the main node connection as usual
        const newEdge = {
          ...connection,
          id: `e-${connection.source}-${connection.target}`,
          animated: true,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        };
        setEdges(eds => addEdge(newEdge, eds));
      } else {
        // This is a parameter-level connection
        // Connect the parameters at the data level
        if (connection.target && connection.source) {
          // Call the parameter connection handler
          handleConnectParam(
            connection.target,      // Target node ID
            targetParamId,          // Target parameter ID
            connection.source,      // Source node ID
            sourceParamId           // Source parameter ID
          );
          
          // Also create a visual edge for the connection
          const paramEdge = {
            ...connection,
            id: `param-edge-${connection.source}-${sourceParamId}-${connection.target}-${targetParamId}`,
            type: 'straight',
            animated: true,
            style: { stroke: '#ff5555' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 12,
              height: 12,
              color: '#ff5555',
            },
          };
          setEdges(eds => addEdge(paramEdge, eds));
          
          // Update connected params to propagate values immediately
          updateConnectedParams();
        }
      }
    } else {
      // Regular node-to-node connection
      const newEdge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
        animated: true,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
      };
      setEdges(eds => addEdge(newEdge, eds));
    }

    // Re-process the image when connections change
    processImage();
  }, [processImage, handleConnectParam, updateConnectedParams, checkForCycles, edges, nodes]);

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
  const exportImage = useCallback((format = 'png') => {
    if (!processedImage) return;
    
    // Create and trigger download for the processed image
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `filter-kit-export.${format}`;
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

  // Function to add an output node
  const addOutputNode = useCallback(() => {
    const outputNodeId = `output-${uuidv4().substring(0, 8)}`;
    
    // Get the last node's position to place the output node to the right
    const lastNodeX = nodes.reduce((max, node) => 
      Math.max(max, node.position.x), 100);
    
    const newOutputNode = {
      id: outputNodeId,
      type: 'outputNode',
      position: { 
        x: lastNodeX + 300, 
        y: 100 
      },
      data: {
        preview: null,
        isActive: true
      }
    };
    
    setNodes(nds => [...nds, newOutputNode]);
    setActiveOutputNodeId(outputNodeId);
    
    return outputNodeId;
  }, [nodes]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeSelect,
    addNode,
    addOutputNode,
    selectedNode,
    selectedNodeId,
    processedImage,
    processedImages,
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