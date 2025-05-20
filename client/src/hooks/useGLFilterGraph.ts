/**
 * useGLFilterGraph.ts
 * 
 * React hook for GPU-accelerated filter processing using WebGL.
 * Adapts the existing filter graph system to use hardware-accelerated rendering.
 */

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
import { toast } from '@/hooks/use-toast';
import { GLRenderer } from '@/gl/core/GLRenderer';
import { ShaderRegistry } from '@/gl/compiler/ShaderRegistry';

// Define LOD (Level of Detail) quality levels for rendering
type QualityLevel = 'preview' | 'draft' | 'full';

export function useGLFilterGraph() {
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
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('draft');
  
  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRendererRef = useRef<GLRenderer | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const uploadFunctionRef = useRef<((file: File) => void)>(() => {});
  const isDraggingRef = useRef<boolean>(false);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize WebGL renderer
  useEffect(() => {
    // Create hidden canvas for WebGL rendering
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    
    // Initialize renderer
    const renderer = new GLRenderer(canvas);
    glRendererRef.current = renderer;
    
    // Save canvas reference
    canvasRef.current = canvas;
    
    // Clean up on unmount
    return () => {
      if (glRendererRef.current) {
        glRendererRef.current.dispose();
      }
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);
  
  // Node changes handler
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // Edge changes handler
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);
  
  // Handle connection events (when user connects nodes)
  const checkForCycles = (currentEdges: Edge[], allNodes: Node[], newConnection: Connection): boolean => {
    // Create a graph representation for cycle detection
    const graph = new Map<string, string[]>();
    
    // Add all nodes to the graph
    allNodes.forEach(node => {
      graph.set(node.id, []);
    });
    
    // Add existing edges
    currentEdges.forEach(edge => {
      const sourceNode = edge.source;
      const targetNode = edge.target;
      
      if (graph.has(sourceNode)) {
        graph.get(sourceNode)?.push(targetNode);
      }
    });
    
    // Add the potential new edge
    if (newConnection.source && newConnection.target && graph.has(newConnection.source)) {
      graph.get(newConnection.source)?.push(newConnection.target);
    }
    
    // Cycle detection using DFS
    const visited = new Set<string>();
    const stack = new Set<string>();
    
    const hasCycle = (node: string): boolean => {
      if (stack.has(node)) {
        return true; // Cycle detected
      }
      
      if (visited.has(node)) {
        return false; // Already checked, no cycle
      }
      
      visited.add(node);
      stack.add(node);
      
      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }
      
      stack.delete(node);
      return false;
    };
    
    // Check all nodes that haven't been visited yet
    for (const node of allNodes) {
      if (!visited.has(node.id) && hasCycle(node.id)) {
        return true; // Cycle found
      }
    }
    
    return false; // No cycles found
  };

  // Handle node connections
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) {
      return;
    }
    
    // Check for cycles
    if (checkForCycles(edges, nodes, connection)) {
      toast({
        title: 'Connection not allowed',
        description: 'This connection would create a cycle in the filter graph.',
        variant: 'destructive'
      });
      return;
    }
    
    // Add the edge
    setEdges((eds) => 
      addEdge({
        ...connection,
        markerEnd: { type: MarkerType.ArrowClosed }
      }, eds)
    );
    
    // Trigger reprocessing after connection change
    requestProcessing();
  }, [edges, nodes]);
  
  // Upload image function
  const uploadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create image node
        const nodeId = uuidv4();
        
        // Store source image
        setSourceImage(e.target?.result as string);
        sourceImageRef.current = img;
        
        // Create image node
        const newNode: Node<ImageNodeData> = {
          id: nodeId,
          type: 'imageNode',
          position: { x: 100, y: 100 },
          data: {
            src: e.target?.result as string,
            imageUrl: e.target?.result as string,
            width: img.width,
            height: img.height,
            onUploadImage: (file: File) => uploadNodeImage(nodeId, file),
            preview: e.target?.result as string,
            enabled: true,
            label: 'Source Image'
          }
        };
        
        // Add node to graph
        setNodes(nodes => [...nodes, newNode]);
        
        // Add output node if it doesn't exist yet
        if (!nodes.some(node => node.type === 'outputNode')) {
          addOutputNode();
        }
        
        // Prepare for WebGL rendering
        if (canvasRef.current) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
        }
        
        setIsProcessing(false);
        
        // Process image
        requestProcessing();
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  }, [nodes]);
  
  // Setting the upload function ref so it can be accessed from outside components
  useEffect(() => {
    uploadFunctionRef.current = uploadImage;
  }, [uploadImage]);
  
  // Upload image for a specific node
  const uploadNodeImage = useCallback((nodeId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file.',
        variant: 'destructive'
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Update node data
        setNodes(nodes => nodes.map(node => {
          if (node.id === nodeId && (node.type === 'imageNode' || node.type === 'imageFilterNode')) {
            return {
              ...node,
              data: {
                ...node.data,
                imageUrl: e.target?.result as string,
                width: img.width,
                height: img.height,
                preview: e.target?.result as string,
              }
            };
          }
          return node;
        }));
        
        // Process image
        requestProcessing();
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  }, []);
  
  // Find filter by type
  const findFilterByType = useCallback((filterType: FilterType) => {
    // Search through all filter categories
    for (const category of Object.values(filterCategories)) {
      const filter = category.filters.find(f => f.type === filterType);
      if (filter) {
        return filter;
      }
    }
    return null;
  }, []);

  // Add a new filter node
  const addNode = useCallback((filterType: FilterType) => {
    const filter = findFilterByType(filterType);
    if (!filter) {
      console.error(`Filter type not found: ${filterType}`);
      return;
    }
    
    const nodeId = uuidv4();
    
    // Create filter node data
    const nodeData: FilterNodeData = {
      label: filter.name,
      filter: {
        type: filterType,
        params: [...filter.params] // Clone params
      },
      enabled: true,
      collapsed: false,
      onParamChange: (id: string, paramId: string, value: number | string | boolean) => 
        handleParamChange(id, paramId, value),
      onToggleEnabled: (id: string, checked: boolean) => 
        handleToggleEnabled(id, checked),
      onToggleCollapsed: (id: string, collapsed: boolean) => 
        handleToggleCollapsed(id, collapsed),
      onChangeBlendMode: (id: string, blendMode: BlendMode) => 
        handleBlendModeChange(id, blendMode),
      onChangeOpacity: (id: string, opacity: number) => 
        handleOpacityChange(id, opacity),
      onChangeColorTag: (id: string, colorTag: NodeColorTag) => 
        handleColorTagChange(id, colorTag),
      blendMode: 'normal',
      opacity: 100,
      colorTag: 'default'
    };
    
    // Create node
    const newNode: Node<FilterNodeData> = {
      id: nodeId,
      type: 'filterNode',
      position: { x: 300, y: 100 },
      data: nodeData
    };
    
    // Add node to graph
    setNodes(nodes => [...nodes, newNode]);
    
    // Return node ID
    return nodeId;
  }, [findFilterByType]);
  
  // Add an output node to the graph
  const addOutputNode = useCallback(() => {
    if (nodes.some(node => node.type === 'outputNode')) {
      // Output node already exists
      return;
    }
    
    const nodeId = uuidv4();
    
    // Create output node
    const newNode: Node = {
      id: nodeId,
      type: 'outputNode',
      position: { x: 600, y: 100 },
      data: {
        label: 'Output',
      }
    };
    
    // Add node to graph
    setNodes(nodes => [...nodes, newNode]);
    setActiveOutputNodeId(nodeId);
    
    // Return node ID
    return nodeId;
  }, [nodes]);
  
  // Generate node preview for the selected node
  const generateNodePreview = useCallback(async (targetNode: Node) => {
    if (!glRendererRef.current || !targetNode) return;
    
    try {
      // Compile the graph up to this node
      glRendererRef.current.compileGraph(nodes, edges);
      
      // Preload necessary images
      await glRendererRef.current.preloadImages(nodes);
      
      // Get preview at low resolution
      const previewUrl = await glRendererRef.current.getNodePreview(targetNode.id, 300);
      
      if (previewUrl) {
        setNodePreview(previewUrl);
      }
    } catch (err) {
      console.error('Error generating node preview:', err);
    }
  }, [nodes, edges]);
  
  // Handle parameter change for a filter node
  const handleParamChange = useCallback((nodeId: string, paramId: string, value: number | string | boolean) => {
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === nodeId && node.type === 'filterNode') {
          const updatedParams = node.data.filter?.params?.map((param: FilterParam) => {
            if (param.id === paramId) {
              return { ...param, value };
            }
            return param;
          }) || [];
          
          return {
            ...node,
            data: {
              ...node.data,
              filter: {
                ...(node.data.filter || {}),
                params: updatedParams
              }
            }
          };
        }
        return node;
      })
    );
    
    // Process the update immediately to provide real-time feedback
    // This is crucial for slider interactions to show immediate visual updates
    requestProcessing('preview');
    
    // Also use debounced processing for higher quality updates
    debouncedRequestProcessing();
  }, [requestProcessing, debouncedRequestProcessing]);
  
  // Debounced processing request with immediate feedback
  const debouncedRequestProcessing = useCallback(() => {
    // Cancel previous timer for high-quality renders
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    // Set quality to preview during interaction
    setQualityLevel('preview');
    
    // Process immediately with preview quality for real-time feedback
    // This ensures sliders provide instant visual updates
    requestProcessing('preview');
    
    // Schedule a high-quality update after interaction stops
    updateTimerRef.current = setTimeout(() => {
      setQualityLevel('full');
      requestProcessing('full');
    }, 300);
  }, [requestProcessing]);
  
  // Handle enabling/disabling a filter node
  const handleToggleEnabled = useCallback((nodeId: string, checked: boolean) => {
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              enabled: checked
            }
          };
        }
        return node;
      })
    );
    
    // Process image
    requestProcessing();
  }, []);
  
  // Handle collapsing/expanding a node
  const handleToggleCollapsed = useCallback((nodeId: string, collapsed: boolean) => {
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              collapsed
            }
          };
        }
        return node;
      })
    );
  }, []);
  
  // Handle changing node blend mode
  const handleBlendModeChange = useCallback((nodeId: string, blendMode: BlendMode) => {
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              blendMode
            }
          };
        }
        return node;
      })
    );
    
    // Process image
    requestProcessing();
  }, []);
  
  // Handle changing node opacity
  const handleOpacityChange = useCallback((nodeId: string, opacity: number) => {
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              opacity
            }
          };
        }
        return node;
      })
    );
    
    // Debounced processing
    debouncedRequestProcessing();
  }, []);
  
  // Handle changing node color tag
  const handleColorTagChange = useCallback((nodeId: string, colorTag: NodeColorTag) => {
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              colorTag
            }
          };
        }
        return node;
      })
    );
  }, []);
  
  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  }, []);
  
  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  }, []);
  
  // Forward declaration of requestProcessing for dependency purposes
  const requestProcessing = useCallback(async (quality: QualityLevel = 'draft') => {
    // Implementation is below
  }, []);

  // Define the actual implementation after declaration
  const processFilterGraph = async (quality: QualityLevel = 'draft') => {
    if (!glRendererRef.current || !nodes.length || !edges.length) return;
    
    // Find output nodes
    const outputNodes = nodes.filter(node => node.type === 'outputNode');
    if (outputNodes.length === 0) return;
    
    try {
      setIsProcessing(true);
      
      // Compile the graph
      glRendererRef.current.compileGraph(nodes, edges);
      
      // Preload necessary images
      await glRendererRef.current.preloadImages(nodes);
      
      // Render based on quality level
      let options: any = {};
      
      switch (quality) {
        case 'preview':
          options = { quality: 'preview', maxDimension: 512, tileSize: 256 };
          break;
        case 'draft':
          options = { quality: 'draft', maxDimension: 1024 };
          break;
        case 'full':
          options = { quality: 'full' };
          break;
      }
      
      // Render the graph
      const renderedImage = await glRendererRef.current.render(options);
      
      if (renderedImage) {
        // Store the result
        setProcessedImage(renderedImage);
        
        // Update processed images map
        setProcessedImages(prev => ({
          ...prev,
          [activeOutputNodeId || '']: renderedImage
        }));
      }
    } catch (err) {
      console.error('Error processing filter graph:', err);
      toast({
        title: 'Processing error',
        description: 'An error occurred while processing the image.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [nodes, edges, activeOutputNodeId]);
  
  // Export the processed image
  const exportImage = useCallback((format: string = 'png') => {
    if (!processedImage) {
      toast({
        title: 'No image to export',
        description: 'Please process an image first.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `filtered-image.${format}`;
      
      // Simulate click to trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Image exported',
        description: `Image has been saved as filtered-image.${format}`,
      });
    } catch (err) {
      console.error('Error exporting image:', err);
      toast({
        title: 'Export error',
        description: 'An error occurred while exporting the image.',
        variant: 'destructive'
      });
    }
  }, [processedImage]);
  
  // Clear the graph
  const clearGraph = useCallback(() => {
    // Keep only image nodes and output nodes
    setNodes(nodes => nodes.filter(node => 
      node.type === 'imageNode' || node.type === 'outputNode'
    ));
    
    // Clear edges
    setEdges([]);
    
    // Clear processed image
    setProcessedImage(null);
    setProcessedImages({});
    
    // Toast notification
    toast({
      title: 'Graph cleared',
      description: 'All filter nodes have been removed.',
    });
  }, []);
  
  // Reset node positions
  const resetNodePositions = useCallback(() => {
    let x = 100;
    const y = 100;
    const spacing = 200;
    
    setNodes(nodes => {
      const updatedNodes = [...nodes];
      
      // Auto-arrange nodes by type
      // First image nodes
      const imageNodes = updatedNodes.filter(node => node.type === 'imageNode');
      imageNodes.forEach(node => {
        node.position = { x, y };
        x += spacing;
      });
      
      // Then filter nodes
      x = 300;
      const filterNodes = updatedNodes.filter(node => node.type === 'filterNode' || node.type === 'imageFilterNode');
      filterNodes.forEach(node => {
        node.position = { x, y };
        x += spacing;
      });
      
      // Finally output nodes
      x = 600;
      const outputNodes = updatedNodes.filter(node => node.type === 'outputNode');
      outputNodes.forEach(node => {
        node.position = { x, y };
        x += spacing;
      });
      
      return updatedNodes;
    });
    
    // Toast notification
    toast({
      title: 'Nodes repositioned',
      description: 'All nodes have been repositioned in a logical order.',
    });
  }, []);
  
  return {
    nodes,
    edges,
    sourceImage,
    processedImage,
    processedImages,
    selectedNodeId,
    zoomLevel,
    nodePreview,
    isProcessing,
    activeOutputNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    uploadImage: uploadFunctionRef.current,
    addNode,
    addOutputNode,
    setSelectedNodeId,
    generateNodePreview,
    requestProcessing,
    zoomIn,
    zoomOut,
    exportImage,
    clearGraph,
    resetNodePositions,
    qualityLevel,
    setQualityLevel,
  };
}