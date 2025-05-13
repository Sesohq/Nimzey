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
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  // Initialize canvas when needed
  const getCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    return canvasRef.current;
  }, []);

  // Initialize the source node
  useEffect(() => {
    resetCanvas();
  }, []);

  // Function to reset the canvas
  const resetCanvas = useCallback(() => {
    const sourceNodeId = 'source-1';
    setNodes([
      {
        id: sourceNodeId,
        type: 'imageNode',
        position: { x: 100, y: 100 },
        data: { src: null },
      },
    ]);
    setEdges([]);
    setSourceImage(null);
    setProcessedImage(null);
    setSelectedNodeId(null);
    setNodePreview(null);
  }, []);

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
    
    // Create the node data with default params
    const nodeData: FilterNodeData = {
      label: `${filterDef.name}`,
      filterType,
      params: filterDef.params.map(param => ({ ...param })),
      onParamChange: handleParamChange,
    };

    // Add the new node
    setNodes(nds => [
      ...nds,
      {
        id: newNodeId,
        type: 'filterNode',
        position: { 
          x: Math.random() * 300 + 250, 
          y: Math.random() * 200 + 100
        },
        data: nodeData,
      },
    ]);

    // Select the new node
    setSelectedNodeId(newNodeId);
  }, [findFilterByType]);

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
  }, []);

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
  }, []);

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
      setNodePreview(null);
    }
  }, [nodes, sourceImage]);

  // Upload an image
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
              data: { src: imageDataUrl },
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
  }, []);

  // Process the image through the filter chain
  const processImage = useCallback(() => {
    if (!sourceImageRef.current) return;
    
    const canvas = getCanvas();
    const result = applyFilters(sourceImageRef.current, nodes, edges, canvas);
    
    if (result) {
      setProcessedImage(result);
      
      // If a node is selected, update its preview
      if (selectedNodeId) {
        const selectedNode = nodes.find(n => n.id === selectedNodeId);
        if (selectedNode) {
          const preview = generateNodePreview(selectedNode);
          setNodePreview(preview);
        }
      }
    }
  }, [nodes, edges, selectedNodeId, getCanvas]);

  // Generate a preview for a specific node
  const generateNodePreview = useCallback((targetNode: Node) => {
    if (!sourceImageRef.current) return null;
    
    const canvas = getCanvas();
    return applyFilters(sourceImageRef.current, nodes, edges, canvas, targetNode.id);
  }, [nodes, edges, getCanvas]);

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
    nodePreview
  };
}
