import { useState, useCallback, useRef, useEffect } from "react";
import {
  Node,
  Edge,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  useReactFlow,
} from "reactflow";
import { v4 as uuidv4 } from "uuid";
import {
  FilterNodeData,
  FilterType,
  Filter,
  BlendMode,
  ImageNodeData,
  CustomNodeData,
  DbCustomNodeData,
} from "../types";
import {
  applyFilters,
  nodeResultCache,
  applyBlurFilter,
  applySharpenFilter,
  applyGrayscaleFilter,
  applyInvertFilter,
  applyNoiseFilter,
  applyDitherFilter,
  applyTextureFilter,
  applyExtrudeFilter,
  applyWaveFilter,
  applyPixelateFilter,
  applyFindEdgesFilter,
  applyGlowFilter,
  applyHalftoneFilter,
  applyRefractionFilter,
  processNoiseGeneratorFilter,
} from "../lib/filterAlgorithms";
import { filterCategories } from "../lib/filterCategories";

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
  const uploadFunctionRef = useRef<(file: File) => void>(() => {});
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
    setSelectedNodeId((currentSelectedId) =>
      currentSelectedId === nodeId ? null : nodeId,
    );
  }, []);

  // Forward declaration for generateNodePreview
  const generateNodePreviewRef = useRef<(node: Node) => void>(() => {});
  
  // Handle parameter changes and preview updates on filter nodes
  const handleParamChange = useCallback(
    (nodeId: string, paramName: string, value: number | string) => {
      // 1. Bust the cache when a param changes to prevent stale previews
      nodeResultCache.delete(nodeId);
      
      // 2. Update the node data with the new parameter value
      setNodes((prevNodes) => {
        return prevNodes.map((node) => {
          if (node.id === nodeId) {
            // Handle special case for preview updates
            if (paramName === "preview") {
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
                  param.name === paramName ? { ...param, value } : param,
                ),
              },
            };
          }
          return node;
        });
      });

      // 3. After parameter changes, trigger processing
      if (paramName !== "preview" && processImageRef.current) {
        // Wait a very small amount of time to ensure React has updated the node state
        setTimeout(() => {
          // Generate a preview for just this node
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            generateNodePreview(node);
          }
          
          // Also update the main preview
          processImageRef.current?.();
        }, 10); // Use a smaller timeout for better responsiveness
      }
    },
    [nodes, generateNodePreview],
  );

  // Handle toggling filter nodes on/off
  const handleToggleEnabled = useCallback(
    (nodeId: string, enabled: boolean) => {
      // Bust the cache when a node is enabled/disabled
      nodeResultCache.delete(nodeId);
      
      // Update the node data
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
      
      // Wait a tiny bit for React to update state, then generate previews
      setTimeout(() => {
        // Generate a preview for just this node
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          console.log(`Regenerating preview for node ${nodeId} after toggle enabled`);
          generateNodePreview(node);
        }
        
        // Also update the main preview
        if (processImageRef.current) {
          processImageRef.current?.();
        }
      }, 10);
    },
    [nodes, generateNodePreview],
  );

  // Handle changing blend mode on filter nodes
  const handleBlendModeChange = useCallback(
    (nodeId: string, blendMode: BlendMode) => {
      // Bust the cache when blend mode changes
      nodeResultCache.delete(nodeId);
      
      // Update the node data
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
      
      // Wait a tiny bit for React to update state, then generate previews
      setTimeout(() => {
        // Generate a preview for just this node
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          console.log(`Regenerating preview for node ${nodeId} after blend mode change`);
          generateNodePreview(node);
        }
        
        // Also update the main preview
        if (processImageRef.current) {
          processImageRef.current?.();
        }
      }, 10);
    },
    [nodes, generateNodePreview],
  );

  // Handle changing opacity on filter nodes
  const handleOpacityChange = useCallback((nodeId: string, opacity: number) => {
    // Bust the cache when opacity changes
    nodeResultCache.delete(nodeId);
    
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
    
    // Immediately update the node preview after changing opacity
    const node = nodes.find(n => n.id === nodeId);
    if (node && generateNodePreviewRef.current) {
      console.log(`Regenerating preview for node ${nodeId} after opacity change`);
      generateNodePreviewRef.current(node);
    }
    
    // Also update the main preview
    if (processImageRef.current) {
      setTimeout(() => {
        processImageRef.current?.();
      }, 100);
    }
  }, [nodes]);

  // Handle removing nodes
  const handleRemoveNode = useCallback((nodeId: string) => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
    setEdges((prevEdges) =>
      prevEdges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
    );
    setSelectedNodeId(null);
  }, []);

  // Handle zoom in/out
  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2)); // Cap at 2x zoom
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5)); // Min at 0.5x zoom
  }, []);

  // Process image through a node chain and generate a thumbnail
  const generateThumbnail = useCallback(
    async (
      nodesToProcess: Node[],
      edgesToProcess: Edge[],
    ): Promise<string | null> => {
      if (!sourceImageRef.current) return null;

      // Create a temporary canvas for thumbnail generation
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 100;
      tempCanvas.height = 100;

      // Process the image through the selected node chain
      const result = applyFilters(
        sourceImageRef.current,
        nodesToProcess,
        edgesToProcess,
        tempCanvas,
      );

      return result;
    },
    [sourceImageRef],
  );

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
        unit: "%",
      },
    ];

    // Also extract one key parameter from each node to expose (up to 2 additional params)
    const additionalParams = selectedNodes
      .filter((node) => "params" in node.data && node.data.params?.length > 0)
      .slice(0, 2) // Limit to 2 nodes
      .map((node) => {
        // Get the first parameter that's a range type
        const param = node.data.params.find((p: any) => p.type === "range");
        if (!param) return null;

        return {
          name: `${node.id}_${param.name}`,
          label: `${node.data.label} - ${param.label}`,
          type: "range" as const,
          min: param.min || 0,
          max: param.max || 100,
          step: param.step || 1,
          value: param.value,
          unit: param.unit || "",
        };
      })
      .filter(Boolean);

    return [...params, ...additionalParams];
  }, []);

  // Create a custom node from selected nodes
  const createCustomNode = useCallback(
    async (customNodeData: Omit<CustomNodeData, "id">) => {
      try {
        // Generate a thumbnail of the effect
        const thumbnail = await generateThumbnail(
          customNodeData.internalNodes,
          customNodeData.internalEdges,
        );

        // Create simplified params
        const simplifiedParams = createCustomNodeParams(
          customNodeData.internalNodes,
        );

        // First save to backend
        const response = await fetch("/api/custom-nodes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: customNodeData.name,
            category: customNodeData.category,
            description: customNodeData.description || "",
            thumbnail: thumbnail || "",
            nodesData: JSON.stringify(customNodeData.internalNodes),
            edgesData: JSON.stringify(customNodeData.internalEdges),
            paramsData: JSON.stringify(simplifiedParams),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save custom node");
        }

        const savedNode = await response.json();
        return savedNode;
      } catch (error) {
        console.error("Failed to create custom node:", error);
        return null;
      }
    },
    [generateThumbnail, createCustomNodeParams],
  );

  // Load a custom node from the server and add it to the canvas
  const addCustomNode = useCallback(
    (dbCustomNode: DbCustomNodeData) => {
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
          type: "customNode",
          position: { x: 250, y: 250 },
          data: {
            id: dbCustomNode.id.toString(),
            name: dbCustomNode.name,
            category: dbCustomNode.category,
            description: dbCustomNode.description || "",
            thumbnail: dbCustomNode.thumbnail || "",
            internalNodes,
            internalEdges,
            params,
            enabled: true,
            blendMode: "normal",
            opacity: 1,
            onParamChange: handleParamChange,
            onToggleEnabled: handleToggleEnabled,
            onBlendModeChange: handleBlendModeChange,
            onOpacityChange: handleOpacityChange,
            onRemoveNode: () => handleRemoveNode(nodeId),
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
        console.error("Failed to add custom node:", error);
        return null;
      }
    },
    [
      handleParamChange,
      handleToggleEnabled,
      handleBlendModeChange,
      handleOpacityChange,
      handleRemoveNode,
    ],
  );

  // Selected node data
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) || null;

  // Generate node preview for the selected node (to be shown in the preview panel)
  const generateNodePreview = useCallback(
    (targetNode: Node) => {
      if (!sourceImageRef.current) return;
      console.log(`Generating preview for node ${targetNode.id}`);

      try {
        // Find all nodes and edges in the chain leading to the selected node
        const nodeChain = getNodeChain(targetNode.id, nodes, edges);

        // Create a temporary canvas for the preview
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 300;
        tempCanvas.height = 300;

        // Process the image through the selected node chain
        const result = applyFilters(
          sourceImageRef.current,
          nodeChain.nodes,
          nodeChain.edges,
          tempCanvas,
        );

        // Set the preview in the preview panel
        setNodePreview(result);
        
        // Update the node with its preview
        setNodes(prevNodes =>
          prevNodes.map(node =>
            node.id === targetNode.id
              ? { ...node, data: { ...node.data, preview: result } }
              : node
          )
        );

        console.log(`Preview updated for node ${targetNode.id}`);
      } catch (error) {
        console.error("Error generating node preview:", error);
        setNodePreview(null);
      }
    },
    [nodes, edges, sourceImageRef, setNodes, setNodePreview],
  );

  // Update the reference to the generateNodePreview function
  useEffect(() => {
    generateNodePreviewRef.current = generateNodePreview;
  }, [generateNodePreview]);

  // Gets all nodes and edges in a chain leading to a specific node
  const getNodeChain = (nodeId: string, allNodes: Node[], allEdges: Edge[]) => {
    // Start with the target node
    const resultNodes = [allNodes.find((node) => node.id === nodeId)!];
    const resultEdges: Edge[] = [];
    const visited = new Set<string>([nodeId]);

    // Queue for BFS
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;

      // Find all edges pointing to this node
      const incomingEdges = allEdges.filter(
        (edge) => edge.target === currentNodeId,
      );

      for (const edge of incomingEdges) {
        resultEdges.push(edge);

        // If we haven't visited the source node yet, add it to the queue
        if (!visited.has(edge.source)) {
          const sourceNode = allNodes.find((node) => node.id === edge.source);
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
  const getDownstreamNodes = (
    startNodeId: string,
    allNodes: Node[],
    allEdges: Edge[],
  ) => {
    const resultNodes = new Set<Node>();
    const visited = new Set<string>([startNodeId]);

    // Queue for BFS
    const queue = [startNodeId];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      const currentNode = allNodes.find((node) => node.id === currentNodeId);
      if (currentNode) {
        resultNodes.add(currentNode);
      }

      // Find all edges going out from this node
      const outgoingEdges = allEdges.filter(
        (edge) => edge.source === currentNodeId,
      );

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
      exportCanvasRef.current = document.createElement("canvas");
    }

    try {
      console.log("Processing image and generating main preview");

      // If a node is selected, only process nodes in that chain
      if (selectedNodeId) {
        const selectedNode = nodes.find((node) => node.id === selectedNodeId);
        if (selectedNode) {
          const downstreamNodes = getDownstreamNodes(
            selectedNodeId,
            nodes,
            edges,
          );

          // Include the selected node and all downstream nodes
          const allNodesToProcess = [selectedNode, ...downstreamNodes];

          // Find edges connecting these nodes
          const relevantEdges = edges.filter(
            (edge) =>
              allNodesToProcess.find((node) => node.id === edge.source) &&
              allNodesToProcess.find((node) => node.id === edge.target),
          );

          // Process the image - clear cache for main full-sized image processing
          const result = applyFilters(
            sourceImageRef.current,
            allNodesToProcess,
            relevantEdges,
            exportCanvasRef.current,
            undefined, // no target node
            true, // clear cache for main processing
          );

          setProcessedImage(result);
        }
      } else {
        // Process the full graph - clear cache for main full-sized image processing
        const result = applyFilters(
          sourceImageRef.current,
          nodes,
          edges,
          exportCanvasRef.current,
          undefined, // no target node
          true, // clear cache for main processing
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
      console.error("Error processing image:", error);
      setProcessedImage(null);
    }
  }, [nodes, edges, selectedNodeId, sourceImageRef, exportCanvasRef]);

  // Function to force update all node previews
  const updateAllNodePreviews = useCallback(() => {
    if (!sourceImageRef.current) {
      console.log("No source image available for previews");
      return;
    }

    console.log("=== Forcing update of all node previews ===");

    // Clear the node cache first for fresh previews
    nodeResultCache.clear();

    // Find the source node - we need to process this first
    const sourceNode = nodes.find((node) => node.type === "imageNode");
    if (!sourceNode) {
      console.warn("No source image node found for previews!");
      return;
    }

    // Create a source image canvas and cache it
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = sourceImageRef.current.width;
    sourceCanvas.height = sourceImageRef.current.height;
    const sourceCtx = sourceCanvas.getContext("2d");
    if (!sourceCtx) {
      console.error("Failed to get 2D context for source canvas");
      return;
    }

    // Draw the source image to the source canvas
    sourceCtx.drawImage(sourceImageRef.current, 0, 0);

    // Store the source node result in the cache
    nodeResultCache.set(sourceNode.id, sourceCanvas);

    // Process all filter nodes
    const processedNodesMap: Record<string, boolean> = {};
    // Store data URLs for the node previews
    const nodeUpdates: Record<string, string> = {};
    console.log("Processing all nodes for preview updates...");

    // We need to process in a topological order - first get all paths
    // Build a graph of nodes and their dependencies
    const dependencyGraph: Record<string, string[]> = {};

    // Initialize graph
    for (const node of nodes) {
      dependencyGraph[node.id] = [];
    }

    // Add dependencies
    for (const edge of edges) {
      if (dependencyGraph[edge.target]) {
        dependencyGraph[edge.target].push(edge.source);
      }
    }

    // Helper function for topological sort
    const topologicalSort = () => {
      const visited: Record<string, boolean> = {};
      const temp: Record<string, boolean> = {};
      const order: string[] = [];

      const visit = (nodeId: string) => {
        // Already completely processed this node
        if (visited[nodeId]) return;

        // Detect cycles (not handling them specially here)
        if (temp[nodeId]) return;

        // Mark node as temporarily visited
        temp[nodeId] = true;

        // Visit all dependencies first
        if (dependencyGraph[nodeId]) {
          for (const dependency of dependencyGraph[nodeId]) {
            visit(dependency);
          }
        }

        // Mark as completely visited and add to result
        temp[nodeId] = false;
        visited[nodeId] = true;
        order.push(nodeId);
      };

      // Visit all nodes
      for (const nodeId of Object.keys(dependencyGraph)) {
        if (!visited[nodeId]) {
          visit(nodeId);
        }
      }

      return order;
    };

    // Get the processing order - from dependencies to dependents
    const processingOrder = topologicalSort();
    console.log(
      `Processing ${processingOrder.length} nodes in topological order:`,
      processingOrder,
    );

    // Process nodes in the right order
    for (const nodeId of processingOrder) {
      const node = nodes.find((n) => n.id === nodeId);

      if (!node || node.type === "imageNode" || node.type === "customNode") {
        continue; // Skip nodes we don't generate previews for
      }

      try {
        console.log(`Generating preview for node ${nodeId} (${node.type})...`);

        // Create a temporary canvas for processing at the right size
        const processCanvas = document.createElement("canvas");
        const tempCanvas = document.createElement("canvas");

        processCanvas.width = sourceImageRef.current.width;
        processCanvas.height = sourceImageRef.current.height;
        tempCanvas.width = 150; // Small size for embedded preview
        tempCanvas.height = 150;

        const processCtx = processCanvas.getContext("2d");
        const tempCtx = tempCanvas.getContext("2d");

        if (!processCtx || !tempCtx) {
          console.error(
            `Failed to get 2D context for canvas for node ${nodeId}`,
          );
          continue;
        }

        // Special case for noiseGenerator nodes - they don't need inputs
        const isNoiseGenerator =
          node.type === "filterNode" &&
          (node.data as FilterNodeData).filterType === "noiseGenerator";

        // Skip nodes with no inputs unless they're standalone generators
        const incomingEdges = edges.filter((e) => e.target === nodeId);
        if (incomingEdges.length === 0 && !isNoiseGenerator) {
          console.log(`Node ${nodeId} has no inputs, skipping`);
          continue;
        }

        // For regular nodes, process based on node type
        let result: string | null = null;

        if (node.type === "filterNode") {
          // Get all incoming nodes for this node
          const inputs = getSourceNodesForNode(nodeId, nodes, edges);

          // Get the first input image for basic filters
          let inputImage: HTMLCanvasElement | null = null;

          for (const handleId of Object.keys(inputs)) {
            const inputNode = inputs[handleId];
            if (inputNode && nodeResultCache.has(inputNode.id)) {
              inputImage = nodeResultCache.get(inputNode.id)!;
              break;
            }
          }

          // If we don't have any input, use source image for standalone nodes
          if (!inputImage && isNoiseGenerator) {
            // For noise generator, just have a blank canvas to start
            processCtx.fillStyle = "#ffffff";
            processCtx.fillRect(
              0,
              0,
              processCanvas.width,
              processCanvas.height,
            );
          } else if (!inputImage) {
            // For other nodes without input, skip
            console.log(`No input available for node ${nodeId}, skipping`);
            continue;
          } else {
            // Draw the input to our processing canvas
            processCtx.drawImage(inputImage, 0, 0);
          }

          // Get the filter data
          const filterData = node.data as FilterNodeData;

          // Apply the filter
          try {
            // Process this node using our standard filter processing
            processFilterNode(
              processCanvas,
              processCtx,
              node,
              isNoiseGenerator ? null : processCanvas, // Source canvas
              tempCanvas, // Temporary canvas
              tempCtx, // Temporary context
            );

            // Cache the processed canvas
            nodeResultCache.set(nodeId, processCanvas);

            // Create a small preview version
            tempCtx.drawImage(
              processCanvas,
              0,
              0,
              tempCanvas.width,
              tempCanvas.height,
            );
            result = tempCanvas.toDataURL("image/png");
          } catch (filterError) {
            console.error(
              `Error processing filter for node ${nodeId}:`,
              filterError,
            );
          }
        } else if (node.type === "blendNode") {
          // For blend nodes, we need two inputs
          const { inputA, inputB } = getSourceNodesForBlendNode(
            nodeId,
            nodes,
            edges,
          );

          if (
            !inputA ||
            !inputB ||
            !nodeResultCache.has(inputA.id) ||
            !nodeResultCache.has(inputB.id)
          ) {
            console.log(`Missing inputs for blend node ${nodeId}, skipping`);
            continue;
          }

          // Process blend node
          try {
            processBlendNode(
              processCanvas,
              processCtx,
              node,
              nodeResultCache.get(inputA.id)!,
              nodeResultCache.get(inputB.id)!,
              tempCanvas,
              tempCtx,
            );

            // Cache the result
            nodeResultCache.set(nodeId, processCanvas);

            // Create a small preview version
            tempCtx.drawImage(
              processCanvas,
              0,
              0,
              tempCanvas.width,
              tempCanvas.height,
            );
            result = tempCanvas.toDataURL("image/png");
          } catch (blendError) {
            console.error(`Error processing blend node ${nodeId}:`, blendError);
          }
        }

        // Store the preview URL for this node
        if (result) {
          console.log(
            `Generated preview for node ${nodeId} (${result.length} bytes)`,
          );
          nodeUpdates[nodeId] = result;

          // Immediate update for this node for better responsiveness
          setNodes((prevNodes) =>
            prevNodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      preview: result,
                    },
                  }
                : n,
            ),
          );
        }

        // Mark this node as processed
        processedNodesMap[nodeId] = true;
      } catch (error) {
        console.error(`Error generating preview for node ${nodeId}:`, error);
      }
    }

    // Process any standalone nodes that didn't get processed in the topological sort
    for (const node of nodes) {
      // Debug log to see what nodes have previews and which don't
      console.log(
        `Node ${node.id} (${node.type}) preview status:`,
        node.data.preview ? 'HAS PREVIEW' : 'NO PREVIEW',
        'Enabled:', node.data.enabled,
        'Processed:', processedNodesMap[node.id] ? 'YES' : 'NO'
      );
      
      // Skip already processed nodes and non-filter nodes
      if (processedNodesMap[node.id] || node.type !== 'filterNode') {
        continue;
      }

      try {
        console.log(`Processing standalone node ${node.id} (${node.type})`);
        
        // Create temporary canvases for processing
        const processCanvas = document.createElement("canvas");
        const tempCanvas = document.createElement("canvas");
        
        processCanvas.width = sourceImageRef.current.width;
        processCanvas.height = sourceImageRef.current.height;
        tempCanvas.width = 150; // Preview size
        tempCanvas.height = 150;
        
        const processCtx = processCanvas.getContext("2d");
        const tempCtx = tempCanvas.getContext("2d");
        
        if (!processCtx || !tempCtx) continue;
        
        // Draw source image to process canvas
        processCtx.drawImage(sourceImageRef.current, 0, 0);
        
        // Apply the filter
        if (node.type === 'filterNode') {
          const filterData = node.data as FilterNodeData;
          
          if (filterData.filterType) {
            // Apply the filter to the canvas
            processFilterNode(
              processCanvas,
              processCtx,
              node,
              processCanvas,
              tempCanvas,
              tempCtx
            );
            
            // Create a preview
            tempCtx.drawImage(processCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
            const result = tempCanvas.toDataURL("image/png");
            
            // Log the data URL generation result for standalone nodes
            console.log(`Generated data URL for standalone node ${node.id}:`, {
              nodeType: node.type,
              urlLength: result.length,
              urlStart: result.slice(0, 30) + '...'
            });
            
            // Store the result
            nodeUpdates[node.id] = result;
            processedNodesMap[node.id] = true;
          }
        }
      } catch (error) {
        console.error(`Error processing standalone node ${node.id}:`, error);
      }
    }

    // Log summary
    console.log(
      `Processed ${Object.keys(processedNodesMap).length} nodes with ${Object.keys(nodeUpdates).length} preview updates`,
    );

    // Batch update all nodes at once to ensure all previews are updated
    if (Object.keys(nodeUpdates).length > 0) {
      console.log(`Updating ${Object.keys(nodeUpdates).length} nodes with previews:`, Object.keys(nodeUpdates));
      
      setNodes((prevNodes) => {
        return prevNodes.map((node) => {
          if (nodeUpdates[node.id]) {
            console.log(`Updating preview for node ${node.id}:`, {
              previewLength: nodeUpdates[node.id].length,
              previewStart: nodeUpdates[node.id].slice(0, 20) + '...'
            });
            
            return {
              ...node,
              data: {
                ...node.data,
                preview: nodeUpdates[node.id],
              },
            };
          }
          return node;
        });
      });
      
      // Verify all nodes have their previews after update
      setTimeout(() => {
        console.log("Verifying nodes have preview data after update...");
        nodes.forEach(node => {
          if (node.type === 'filterNode') {
            console.log(`Node ${node.id} preview status after update:`, 
              node.data.preview ? `HAS PREVIEW (${node.data.preview.slice(0, 20)}...)` : 'NO PREVIEW'
            );
          }
        });
      }, 250);
    }
  }, [nodes, edges, sourceImageRef, setNodes]);

  // Store the reference to use in processImage
  useEffect(() => {
    updateAllNodePreviewsRef.current = updateAllNodePreviews;
  }, [updateAllNodePreviews]);

  // Helper function to process a filter node
  const processFilterNode = (
    resultCanvas: HTMLCanvasElement,
    resultCtx: CanvasRenderingContext2D,
    node: Node,
    sourceCanvas: HTMLCanvasElement | null,
    tempCanvas: HTMLCanvasElement,
    tempCtx: CanvasRenderingContext2D,
  ) => {
    // Get the image data from the result canvas (which already has the input image)
    const imageData = resultCtx.getImageData(
      0,
      0,
      resultCanvas.width,
      resultCanvas.height,
    );
    const data = imageData.data;

    // Skip processing if node is disabled or not a filter node
    if (node.type !== "filterNode" || !(node.data as FilterNodeData).enabled) {
      return;
    }

    const filterData = node.data as FilterNodeData;
    const filterType = filterData.filterType;

    // Apply the appropriate filter based on type
    switch (filterType) {
      case "blur":
        applyBlurFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          parseInt(
            String(
              filterData.params.find((p) => p.name === "radius")?.value || 5,
            ),
          ),
        );
        break;
      case "sharpen":
        applySharpenFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          parseInt(
            String(
              filterData.params.find((p) => p.name === "amount")?.value || 50,
            ),
          ),
        );
        break;
      case "grayscale":
        applyGrayscaleFilter(data);
        break;
      case "invert":
        applyInvertFilter(data);
        break;
      case "noise":
        applyNoiseFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          filterData.params,
        );
        break;
      case "dither":
        applyDitherFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          filterData.params,
        );
        break;
      case "texture":
        applyTextureFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          filterData.params,
        );
        break;
      case "extrude":
        applyExtrudeFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          filterData.params,
        );
        break;
      case "wave":
        applyWaveFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          parseInt(
            String(
              filterData.params.find((p) => p.name === "amplitude")?.value ||
                10,
            ),
          ),
        );
        break;
      case "pixelate":
        applyPixelateFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          parseInt(
            String(
              filterData.params.find((p) => p.name === "pixelSize")?.value || 8,
            ),
          ),
        );
        break;
      case "findEdges":
        applyFindEdgesFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          filterData.params,
        );
        break;
      case "glow":
        applyGlowFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          filterData.params,
          filterType,
          resultCtx,
          resultCanvas,
        );
        break;
      case "halftone":
        applyHalftoneFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          filterData.params,
          resultCtx,
          resultCanvas,
        );
        break;
      case "refraction":
        applyRefractionFilter(
          data,
          resultCanvas.width,
          resultCanvas.height,
          resultCtx,
          filterData.params,
        );
        break;
      case "noiseGenerator":
        // Special case for noise generator which creates a texture from scratch
        processNoiseGeneratorFilter(
          null,
          resultCtx,
          resultCanvas,
          filterData,
          tempCanvas,
          tempCtx,
        );
        return; // Skip the putImageData step below since this filter writes directly to canvas
      default:
        console.warn(`Unknown filter type: ${filterType}`);
        break;
    }

    // Put the processed data back on the canvas
    resultCtx.putImageData(imageData, 0, 0);
  };

  // Helper function to get all source nodes for a node with multiple inputs
  const getSourceNodesForNode = (
    nodeId: string,
    allNodes: Node[],
    allEdges: Edge[],
  ): Record<string, Node | null> => {
    const result: Record<string, Node | null> = {};

    // Find all edges pointing to this node
    const incomingEdges = allEdges.filter((edge) => edge.target === nodeId);

    console.log(`Node ${nodeId} has ${incomingEdges.length} incoming edges`);

    // Create an entry for each incoming edge based on target handle
    incomingEdges.forEach((edge) => {
      // Map the targetHandle to a consistent ID for easier access
      let handleId: string;

      // Extract any dynamic input handle IDs
      if (!edge.targetHandle) {
        handleId = "input-default";
      } else if (
        edge.targetHandle === "dynamic-input" ||
        edge.targetHandle.startsWith("input-")
      ) {
        // For both "dynamic-input" and generated input-* handles, create a consistent ID
        // based on the source node that's connecting
        handleId = `input-${edge.source}`;
      } else {
        // For specialized handles like blend node's inputA, inputB, use as-is
        handleId = edge.targetHandle;
      }

      // Add this source node to our result
      const sourceNode = allNodes.find((node) => node.id === edge.source);

      if (sourceNode) {
        console.log(
          `Found source node ${sourceNode.id} (${sourceNode.type}) for target ${nodeId} on handle ${handleId}`,
        );
        result[handleId] = sourceNode;
      } else {
        console.log(
          `No source node found for edge from ${edge.source} to ${nodeId}`,
        );
        result[handleId] = null;
      }
    });

    return result;
  };

  // For backward compatibility, get source nodes for blend node
  const getSourceNodesForBlendNode = (
    blendNodeId: string,
    nodes: Node[],
    edges: Edge[],
  ): { inputA: Node | null; inputB: Node | null } => {
    const inputs = getSourceNodesForNode(blendNodeId, nodes, edges);

    // Find the first input for inputA and second for inputB
    const inputKeys = Object.keys(inputs);

    return {
      inputA: inputKeys.length > 0 ? inputs[inputKeys[0]] : null,
      inputB: inputKeys.length > 1 ? inputs[inputKeys[1]] : null,
    };
  };

  // Helper function to process a blend node
  const processBlendNode = (
    resultCanvas: HTMLCanvasElement,
    resultCtx: CanvasRenderingContext2D,
    node: Node,
    foregroundCanvas: HTMLCanvasElement,
    backgroundCanvas: HTMLCanvasElement,
    tempCanvas: HTMLCanvasElement,
    tempCtx: CanvasRenderingContext2D,
  ) => {
    // Get the blend data
    const blendData = node.data as FilterNodeData;

    // Skip processing if node is disabled
    if (!blendData.enabled) {
      // Just copy the background to the result
      resultCtx.drawImage(backgroundCanvas, 0, 0);
      return;
    }

    // Clear the result canvas
    resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);

    // Draw the background image
    resultCtx.globalCompositeOperation = "source-over";
    resultCtx.globalAlpha = 1.0;
    resultCtx.drawImage(backgroundCanvas, 0, 0);

    // Apply the blend mode and opacity
    resultCtx.globalCompositeOperation =
      (blendData.blendMode as GlobalCompositeOperation) || "source-over";
    resultCtx.globalAlpha = blendData.opacity || 1.0;

    // Draw the foreground with the blend mode applied
    resultCtx.drawImage(foregroundCanvas, 0, 0);

    // Reset to default
    resultCtx.globalCompositeOperation = "source-over";
    resultCtx.globalAlpha = 1.0;
  };

  // Effect to update selected node preview for the main panel
  useEffect(() => {
    if (!sourceImageRef.current) return;

    // Update preview for selected node (only for the preview panel)
    if (selectedNodeId) {
      const node = nodes.find((n) => n.id === selectedNodeId);
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

  // Effect to ensure all nodes get previews when source image changes
  useEffect(() => {
    if (sourceImageRef.current && nodes.length > 0) {
      console.log(
        "Source image loaded or nodes changed, updating all node previews",
      );

      // Use setTimeout to ensure the source image is properly loaded
      const timer = setTimeout(() => {
        updateAllNodePreviews();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [sourceImageRef.current, nodes, updateAllNodePreviews]);
  
  // Effect to update node previews when parameters are changed or nodes are enabled/disabled
  useEffect(() => {
    // Get a simple string representation of all nodes' parameters state
    const paramsState = nodes
      .filter(node => node.type === 'filterNode')
      .map(node => {
        const data = node.data as FilterNodeData;
        return `${node.id}:${data.enabled}:${data.params.map(p => p.value).join(',')}`;
      })
      .join('|');
    
    // This dependency will trigger a re-render when params or enabled state changes
    if (sourceImageRef.current && nodes.length > 0) {
      console.log("Filter parameters changed, updating previews");
      const timer = setTimeout(() => {
        updateAllNodePreviews();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [nodes, updateAllNodePreviews, sourceImageRef]); // paramsState isn't needed in deps since we use nodes

  // Find a filter by type
  const findFilterByType = useCallback((filterType: FilterType) => {
    // Iterate through each category in filterCategories
    for (const categoryKey in filterCategories) {
      const category = filterCategories[categoryKey];
      const filter = category.filters.find((f) => f.type === filterType);
      if (filter) {
        return filter;
      }
    }
    return null;
  }, []);

  // Add a new filter node
  const addNode = useCallback(
    (filterType: FilterType) => {
      const filter = findFilterByType(filterType);
      if (!filter) return;

      const id = uuidv4();
      const nodeData: FilterNodeData = {
        label: filter.name,
        filterType,
        params: JSON.parse(JSON.stringify(filter.params)), // Deep copy
        enabled: true,
        blendMode: "normal",
        opacity: 1,
        onParamChange: handleParamChange,
        onToggleEnabled: handleToggleEnabled,
        onBlendModeChange: handleBlendModeChange,
        onOpacityChange: handleOpacityChange,
        onRemoveNode: () => handleRemoveNode(id),
      };

      // Determine the node type - texture generators use a different component
      const nodeType =
        filterType === "textureGenerator" ? "textureGenerator" : "filterNode";

      const newNode: Node<FilterNodeData> = {
        id,
        type: nodeType,
        position: { x: 250, y: 150 },
        data: nodeData,
      };

      setNodes((prevNodes) => [...prevNodes, newNode]);

      // Generate preview after adding any node - we'll handle the no-input case in the
      // preview generator which will create a fallback preview if needed
      // Allow time for the node to be added to the state
      setTimeout(() => {
        if (updateAllNodePreviewsRef.current) {
          console.log(
            `Triggering preview update after adding ${filterType} node`,
          );
          updateAllNodePreviewsRef.current();
        }
      }, 150);

      return id;
    },
    [
      findFilterByType,
      handleParamChange,
      handleToggleEnabled,
      handleBlendModeChange,
      handleOpacityChange,
      handleRemoveNode,
    ],
  );

  // Connect two nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      console.log(
        `Connecting: ${connection.source} -> ${connection.target} (handle: ${connection.targetHandle})`,
      );

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
          color: "#888",
        },
        animated: true,
        // Add data to help with filter chain processing
        data: {
          // Store information about the nodes being connected
          sourceNode:
            nodes.find((n) => n.id === connection.source)?.type || "unknown",
          targetNode:
            nodes.find((n) => n.id === connection.target)?.type || "unknown",
        },
      };

      console.log(`Created edge: ${JSON.stringify(newEdge)}`);

      // Add the edge to our graph
      setEdges((prevEdges) => addEdge(newEdge, prevEdges));

      // Ensure the connected nodes get processed in the right order
      processImage();

      // Update previews for all affected nodes
      setTimeout(() => {
        if (updateAllNodePreviewsRef.current) {
          updateAllNodePreviewsRef.current();
        }
      }, 100);
    },
    [nodes, processImage],
  );

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
  const exportImage = useCallback(
    (format = "png", quality = 1) => {
      if (!exportCanvasRef.current) return null;

      const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
      return exportCanvasRef.current.toDataURL(mimeType, quality);
    },
    [exportCanvasRef],
  );

  // Add a source image node if needed
  const addSourceNodeIfNeeded = useCallback(() => {
    if (!nodes.some((node) => node.type === "imageNode")) {
      const id = "source-image";
      const nodeData: ImageNodeData = {
        src: sourceImage,
        onUploadImage: uploadImage,
      };

      const newNode: Node<ImageNodeData> = {
        id,
        type: "imageNode",
        position: { x: 100, y: 100 },
        data: nodeData,
      };

      setNodes((prevNodes) => [...prevNodes, newNode]);
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
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.type === "imageNode") {
            return {
              ...node,
              data: {
                ...node.data,
                src: sourceImage,
              },
            };
          }
          return node;
        }),
      );
    }
  }, [sourceImage]);

  // Set up the upload function reference
  useEffect(() => {
    uploadFunctionRef.current = uploadImage;
  }, [uploadImage, uploadFunctionRef]);
  
  // Connect updateAllNodePreviews to its ref
  useEffect(() => {
    updateAllNodePreviewsRef.current = updateAllNodePreviews;
  }, [updateAllNodePreviews]);

  // Reset the graph
  const resetGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    addSourceNodeIfNeeded();
  }, [addSourceNodeIfNeeded]);

  // Load a preset
  const loadPreset = useCallback(
    (presetNodes: Node[], presetEdges: Edge[]) => {
      // Add back reference functions to nodes
      const nodesWithCallbacks = presetNodes.map((node) => {
        // Add the appropriate callbacks based on node type
        if (node.type === "filterNode") {
          const id = node.id;
          return {
            ...node,
            data: {
              ...node.data,
              onParamChange: handleParamChange,
              onToggleEnabled: handleToggleEnabled,
              onBlendModeChange: handleBlendModeChange,
              onOpacityChange: handleOpacityChange,
              onRemoveNode: () => handleRemoveNode(id),
            },
          };
        } else if (node.type === "imageNode") {
          return {
            ...node,
            data: {
              ...node.data,
              src: sourceImage,
              onUploadImage: uploadImage,
            },
          };
        } else if (node.type === "customNode") {
          const id = node.id;
          return {
            ...node,
            data: {
              ...node.data,
              onParamChange: handleParamChange,
              onToggleEnabled: handleToggleEnabled,
              onBlendModeChange: handleBlendModeChange,
              onOpacityChange: handleOpacityChange,
              onRemoveNode: () => handleRemoveNode(id),
            },
          };
        }
        return node;
      });

      setNodes(nodesWithCallbacks);
      setEdges(presetEdges);

      processImage();
    },
    [
      handleParamChange,
      handleToggleEnabled,
      handleBlendModeChange,
      handleOpacityChange,
      handleRemoveNode,
      sourceImage,
      uploadImage,
      processImage,
    ],
  );

  // Copy selected nodes to clipboard
  const copySelectedNodes = useCallback(() => {
    // Get all selected nodes
    const selectedNodes = nodes.filter((node) => node.selected);

    if (selectedNodes.length === 0) {
      console.log("No nodes selected to copy");
      return;
    }

    console.log(`Copying ${selectedNodes.length} node(s) to clipboard`);

    // Deep clone the selected nodes to avoid reference issues
    const nodesToCopy = selectedNodes.map((node) => ({
      ...node,
      // Generate a mapping of original IDs to new IDs for when we paste
      originalId: node.id,
    })) as ClipboardNode[];

    // Find edges between selected nodes
    const relevantEdges = edges
      .filter((edge) => {
        const sourceSelected = selectedNodes.some((n) => n.id === edge.source);
        const targetSelected = selectedNodes.some((n) => n.id === edge.target);
        // Only include edges where both source and target are selected
        return sourceSelected && targetSelected;
      })
      .map((edge) => ({
        ...edge,
        originalSource: edge.source,
        originalTarget: edge.target,
      })) as ClipboardEdge[];

    // Store in clipboard state
    setClipboardNodes(nodesToCopy);
    setClipboardEdges(relevantEdges);

    console.log("Copied to clipboard:", {
      nodes: nodesToCopy,
      edges: relevantEdges,
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
    const newNodes = clipboardNodes.map((node) => {
      const originalId = node.originalId || node.id;
      // Handle potential undefined type by using a default
      const nodeType = node.type || "filterNode";
      const newId = `${nodeType.replace("Node", "")}-${uuidv4().substring(0, 8)}`;

      // Store the mapping of original to new ID
      idMap.set(originalId, newId);

      // Create a new node with offset position
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 50, // Offset to make it clear it's a copy
          y: node.position.y + 50,
        },
        selected: true, // Select the newly pasted nodes
        originalId: undefined, // Remove the temporary property
      } as Node;
    });

    // Create new edges with updated source/target IDs
    const newEdges = clipboardEdges
      .map((edge) => {
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
            data: edge.data,
          };
          return newEdge;
        }
        return null;
      })
      .filter(Boolean) as Edge[];

    // Add the new nodes and edges to the graph
    setNodes((prevNodes) => [...prevNodes, ...newNodes]);
    setEdges((prevEdges) => [...prevEdges, ...newEdges]);

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
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check for Copy (Ctrl+C or Cmd+C)
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        event.preventDefault();
        copySelectedNodes();
      }

      // Check for Paste (Ctrl+V or Cmd+V)
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        event.preventDefault();
        pasteNodes();
      }
    },
    [copySelectedNodes, pasteNodes],
  );

  // Set up keyboard event listeners
  useEffect(() => {
    // Add event listener for keyboard shortcuts
    document.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
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
    pasteNodes,
  };
}
