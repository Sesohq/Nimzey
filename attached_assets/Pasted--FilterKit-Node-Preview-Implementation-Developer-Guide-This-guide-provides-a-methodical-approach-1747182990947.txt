# FilterKit Node Preview Implementation - Developer Guide

This guide provides a methodical approach to implementing node previews in FilterKit without breaking existing functionality.

## Overview

We need to add preview windows inside each filter node to show the intermediate state of the image at that point in the processing chain, while maintaining the main preview that shows the final output.

## Implementation Plan

We'll break this down into small, testable steps with specific file changes.

---

## PHASE 1: Add Preview Property to Types

### File: `/types.ts`

**Change 1:** Add `preview` property to the `FilterNodeData` interface:

```typescript
interface FilterNodeData {
  label: string;
  filterType: FilterType;
  params: FilterParam[];
  enabled: boolean;
  blendMode: BlendMode;
  opacity: number;
  preview?: string;  // Add this line - Data URL for node preview
  onParamChange: (nodeId: string, paramName: string, value: number | string) => void;
  onToggleEnabled: (nodeId: string, enabled: boolean) => void;
  onBlendModeChange: (nodeId: string, blendMode: BlendMode) => void;
  onOpacityChange: (nodeId: string, opacity: number) => void;
  onRemoveNode: (nodeId: string) => void;
}
```

**Test:** Verify that the application builds without errors after this change.

---

## PHASE 2: Update Filter Node Component to Display Preview

### File: `/components/FilterNode.tsx` (or wherever your node component is defined)

**Change 1:** Add the preview display area inside the node component:

```tsx
function FilterNode({ data, id, selected }: NodeProps<FilterNodeData>) {
  const {
    label,
    filterType,
    params,
    enabled,
    preview,  // Get the preview from props
    onParamChange,
    onToggleEnabled,
    onRemoveNode
  } = data;

  return (
    <div className={`filter-node ${!enabled ? 'disabled' : ''} ${selected ? 'selected' : ''}`}>
      <div className="filter-node-header">
        <div className="filter-node-title">{label}</div>
        <div className="filter-node-controls">
          <button
            className={`toggle-button ${enabled ? 'enabled' : 'disabled'}`}
            onClick={() => onToggleEnabled(id, !enabled)}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
          <button className="remove-button" onClick={() => onRemoveNode(id)}>
            ×
          </button>
        </div>
      </div>
      
      {/* Add Preview Area Here */}
      <div className="filter-node-preview">
        {preview ? (
          <img 
            src={preview} 
            alt={`${label} preview`} 
            className="node-preview-image"
          />
        ) : (
          <div className="node-preview-placeholder">No Preview</div>
        )}
      </div>
      
      {/* Existing Parameters Section */}
      <div className="filter-node-params">
        {params.map((param) => (
          <div key={param.name} className="param-row">
            <label>{param.label}</label>
            <input
              type="range"
              min={param.min || 0}
              max={param.max || 100}
              step={param.step || 1}
              value={param.value as number}
              onChange={(e) => 
                onParamChange(id, param.name, parseFloat(e.target.value))
              }
              disabled={!enabled}
            />
            <span className="param-value">
              {param.value}{param.unit || ''}
            </span>
          </div>
        ))}
      </div>
      
      {/* Existing Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
      />
    </div>
  );
}
```

### File: `/styles/FilterNode.css` (or your CSS file)

**Change 2:** Add CSS for the preview area:

```css
.filter-node-preview {
  width: 100%;
  height: 80px;
  background-color: #1a1a1a;
  margin: 5px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 4px;
}

.node-preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.node-preview-placeholder {
  color: #555;
  font-size: 12px;
}
```

**Test:** Verify that nodes display correctly with a "No Preview" placeholder, without breaking the existing layout.

---

## PHASE 3: Modify Filter Processing to Generate Node Previews

### File: `/lib/filterAlgorithms.ts`

**Change 1:** First, add a node result cache if you don't already have one:

```typescript
// Add at the top of the file
export const nodeResultCache = new Map<string, HTMLCanvasElement>();
```

**Change 2:** Modify the `applyFilters` function to support targeting a specific node:

```typescript
export function applyFilters(
  sourceImage: HTMLImageElement,
  nodes: Node[],
  edges: Edge[],
  canvas: HTMLCanvasElement,
  targetNodeId?: string,  // Add this parameter
  clearCache: boolean = false  // Add this parameter
): string {
  // Initialize canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Clear cache if requested
  if (clearCache) {
    nodeResultCache.clear();
  }

  // First, ensure the source image is cached
  const sourceNode = nodes.find(node => node.type === 'imageNode');
  if (sourceNode) {
    // Create a canvas for the source image
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = canvas.width;
    sourceCanvas.height = canvas.height;
    const sourceCtx = sourceCanvas.getContext('2d');
    
    if (sourceCtx) {
      // Draw the source image to the canvas
      sourceCtx.drawImage(sourceImage, 0, 0, sourceCanvas.width, sourceCanvas.height);
      // Store in cache
      nodeResultCache.set(sourceNode.id, sourceCanvas);
    }
  }
  
  // If there's a targetNodeId, only process nodes in the chain leading to that node
  let nodesToProcess = nodes;
  let edgesToProcess = edges;
  
  if (targetNodeId) {
    // Find all nodes in the chain leading to the target node
    const result = findChainToNode(targetNodeId, nodes, edges);
    nodesToProcess = result.nodes;
    edgesToProcess = result.edges;
  }
  
  // Get a topologically sorted array of node IDs
  const nodeOrder = getTopologicalOrder(nodesToProcess, edgesToProcess);
  
  // Process each node in order
  for (const nodeId of nodeOrder) {
    const node = nodesToProcess.find(n => n.id === nodeId);
    
    // Skip source nodes and disabled nodes
    if (!node || node.type === 'imageNode' || !node.data.enabled) {
      continue;
    }
    
    try {
      // Process based on node type
      if (node.type === 'filterNode') {
        processFilterNode(node, nodes, edges);
      } else if (node.type === 'blendNode') {
        processBlendNode(node, nodes, edges);
      }
      
      // If this is the target node, or a leaf node in the full graph and no target is specified,
      // draw its result to the canvas
      if (nodeId === targetNodeId || 
         (!targetNodeId && !edges.some(e => e.source === nodeId))) {
        // Get the cached result for this node
        const resultCanvas = nodeResultCache.get(nodeId);
        if (resultCanvas) {
          // Draw to the output canvas
          ctx.drawImage(resultCanvas, 0, 0, canvas.width, canvas.height);
        }
        
        // If we're targeting a specific node, we can stop after processing it
        if (nodeId === targetNodeId) {
          break;
        }
      }
    } catch (error) {
      console.error(`Error processing node ${nodeId}:`, error);
    }
  }
  
  // Return the data URL of the canvas
  return canvas.toDataURL();
}
```

**Change 3:** Add helper functions to find nodes in a chain and process them:

```typescript
// Add these helper functions

// Finds all nodes and edges in the chain leading to a target node
function findChainToNode(targetNodeId: string, allNodes: Node[], allEdges: Edge[]): { nodes: Node[], edges: Edge[] } {
  const resultNodes = new Set<Node>();
  const resultEdges = new Set<Edge>();
  const visited = new Set<string>();
  const queue = [targetNodeId];
  
  // First add the target node
  const targetNode = allNodes.find(n => n.id === targetNodeId);
  if (targetNode) {
    resultNodes.add(targetNode);
  }
  
  // BFS to find all dependencies
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    visited.add(currentId);
    
    // Find all edges pointing to this node
    const incomingEdges = allEdges.filter(edge => edge.target === currentId);
    
    for (const edge of incomingEdges) {
      // Add this edge to our results
      resultEdges.add(edge);
      
      // Add the source node and queue it for processing if not visited
      if (!visited.has(edge.source)) {
        const sourceNode = allNodes.find(n => n.id === edge.source);
        if (sourceNode) {
          resultNodes.add(sourceNode);
          queue.push(edge.source);
        }
      }
    }
  }
  
  return {
    nodes: Array.from(resultNodes),
    edges: Array.from(resultEdges)
  };
}

// Get a topologically sorted array of node IDs
function getTopologicalOrder(nodes: Node[], edges: Edge[]): string[] {
  // Create a dependency graph
  const graph: Record<string, string[]> = {};
  nodes.forEach(node => {
    graph[node.id] = [];
  });
  
  // Add dependencies
  edges.forEach(edge => {
    // edge.target depends on edge.source
    if (graph[edge.target]) {
      graph[edge.target].push(edge.source);
    }
  });
  
  // Perform a topological sort
  const visited: Record<string, boolean> = {};
  const temp: Record<string, boolean> = {};
  const order: string[] = [];
  
  function visit(nodeId: string) {
    // If already visited in this pass, skip
    if (visited[nodeId]) return;
    // If temporarily visited in this pass, we have a cycle - just return
    if (temp[nodeId]) return;
    
    // Mark as temporarily visited
    temp[nodeId] = true;
    
    // Visit all dependencies first
    for (const depId of graph[nodeId] || []) {
      visit(depId);
    }
    
    // Mark as visited and add to order
    temp[nodeId] = false;
    visited[nodeId] = true;
    order.push(nodeId);
  }
  
  // Visit all nodes
  nodes.forEach(node => {
    if (!visited[node.id]) {
      visit(node.id);
    }
  });
  
  // The order is currently dependencies last, so reverse it for processing order
  return order.reverse();
}

// Process a filter node
function processFilterNode(node: Node, allNodes: Node[], allEdges: Edge[]): void {
  if (node.type !== 'filterNode' || !node.data.enabled) return;
  
  // Get incoming edges
  const incomingEdges = allEdges.filter(edge => edge.target === node.id);
  
  // Skip nodes with no inputs (except for generator nodes)
  if (incomingEdges.length === 0 && node.data.filterType !== 'noiseGenerator') {
    return;
  }
  
  // Get the first input node that has cached results
  let inputCanvas = null;
  for (const edge of incomingEdges) {
    if (nodeResultCache.has(edge.source)) {
      inputCanvas = nodeResultCache.get(edge.source);
      break;
    }
  }
  
  // If no input found and this isn't a generator, we can't process
  if (!inputCanvas && node.data.filterType !== 'noiseGenerator') {
    return;
  }
  
  // Create a canvas for processing
  const processCanvas = document.createElement('canvas');
  
  // If we have an input, match its dimensions
  if (inputCanvas) {
    processCanvas.width = inputCanvas.width;
    processCanvas.height = inputCanvas.height;
  } else {
    // For generators, use a default size
    processCanvas.width = 300;
    processCanvas.height = 300;
  }
  
  const processCtx = processCanvas.getContext('2d');
  if (!processCtx) return;
  
  // For generator nodes, we start with a blank canvas
  if (node.data.filterType === 'noiseGenerator') {
    // Fill with a background color
    processCtx.fillStyle = '#000000';
    processCtx.fillRect(0, 0, processCanvas.width, processCanvas.height);
    
    // Apply the generator-specific filter
    // This depends on your implementation
    // ...
    
  } else {
    // For regular filters, draw the input first
    processCtx.drawImage(inputCanvas!, 0, 0);
    
    // Get image data for processing
    const imageData = processCtx.getImageData(0, 0, processCanvas.width, processCanvas.height);
    
    // Apply the filter based on type
    switch (node.data.filterType) {
      case 'blur':
        // Call your blur filter function
        // applyBlurFilter(imageData.data, ...);
        break;
      case 'sharpen':
        // Call your sharpen filter function
        // applySharpenFilter(imageData.data, ...);
        break;
      // Add cases for other filter types
      default:
        // Default processing
        break;
    }
    
    // Put the processed data back
    processCtx.putImageData(imageData, 0, 0);
  }
  
  // Store the result in the cache
  nodeResultCache.set(node.id, processCanvas);
}

// Process a blend node
function processBlendNode(node: Node, allNodes: Node[], allEdges: Edge[]): void {
  if (node.type !== 'blendNode' || !node.data.enabled) return;
  
  // Find foreground and background inputs
  const fgEdge = allEdges.find(edge => 
    edge.target === node.id && edge.targetHandle === 'foreground'
  );
  
  const bgEdge = allEdges.find(edge => 
    edge.target === node.id && edge.targetHandle === 'background'
  );
  
  // Skip if we don't have both inputs
  if (!fgEdge || !bgEdge || 
      !nodeResultCache.has(fgEdge.source) || 
      !nodeResultCache.has(bgEdge.source)) {
    return;
  }
  
  // Get the input canvases
  const fgCanvas = nodeResultCache.get(fgEdge.source)!;
  const bgCanvas = nodeResultCache.get(bgEdge.source)!;
  
  // Create a canvas for processing
  const processCanvas = document.createElement('canvas');
  processCanvas.width = Math.max(fgCanvas.width, bgCanvas.width);
  processCanvas.height = Math.max(fgCanvas.height, bgCanvas.height);
  
  const processCtx = processCanvas.getContext('2d');
  if (!processCtx) return;
  
  // Draw background first
  processCtx.drawImage(bgCanvas, 0, 0);
  
  // Set blend mode and opacity
  processCtx.globalCompositeOperation = node.data.blendMode as GlobalCompositeOperation;
  processCtx.globalAlpha = node.data.opacity / 100;  // Assuming opacity is 0-100
  
  // Draw foreground with blend mode applied
  processCtx.drawImage(fgCanvas, 0, 0);
  
  // Reset composite operation and alpha
  processCtx.globalCompositeOperation = 'source-over';
  processCtx.globalAlpha = 1.0;
  
  // Store the result in the cache
  nodeResultCache.set(node.id, processCanvas);
}
```

**Test:** Verify that the filter processing still works correctly for the main preview.

---

## PHASE 4: Update useFilterGraph Hook to Generate Node Previews

### File: `/hooks/useFilterGraph.tsx`

**Change 1:** Add functions to generate and update node previews:

```typescript
// Add these before the return statement in useFilterGraph.tsx

// Reference to store the update functions
const processImageRef = useRef<(() => void) | null>(null);

// Function to generate a preview for a specific node
const generateNodePreview = useCallback((nodeId: string) => {
  if (!sourceImageRef.current) return;
  
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;
  
  console.log(`Generating preview for node ${nodeId}`);
  
  // Create a small canvas for the preview
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 150;  // Small size for node preview
  previewCanvas.height = 150;
  
  // Process the image chain up to this node
  const previewUrl = applyFilters(
    sourceImageRef.current,
    nodes,
    edges,
    previewCanvas,
    nodeId  // Target this specific node
  );
  
  // Update the node with its preview
  setNodes(prevNodes => 
    prevNodes.map(n => 
      n.id === nodeId 
        ? { ...n, data: { ...n.data, preview: previewUrl } } 
        : n
    )
  );
}, [nodes, edges, sourceImageRef]);

// Function to update all node previews
const updateAllNodePreviews = useCallback(() => {
  if (!sourceImageRef.current) return;
  
  console.log("Updating all node previews");
  
  // Generate preview for each node
  nodes.forEach(node => {
    if (node.type === 'filterNode' || node.type === 'blendNode') {
      generateNodePreview(node.id);
    }
  });
}, [nodes, generateNodePreview]);

// Store processImage function reference
useEffect(() => {
  processImageRef.current = processImage;
}, [processImage]);

// Update previews when source image changes or on mount
useEffect(() => {
  if (sourceImageRef.current && nodes.length > 0) {
    updateAllNodePreviews();
  }
}, [sourceImageRef.current, nodes.length, updateAllNodePreviews]);
```

**Change 2:** Update parameter change handlers to update node previews:

```typescript
// Modify handleParamChange
const handleParamChange = useCallback((nodeId: string, paramName: string, value: number | string) => {
  // Skip if it's just a preview update
  if (paramName === 'preview') {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, data: { ...node.data, preview: value } } : node
      )
    );
    return;
  }
  
  // Clear cache for this node
  nodeResultCache.delete(nodeId);
  
  // Update node data
  setNodes(prevNodes => 
    prevNodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            params: node.data.params.map((param: any) => 
              param.name === paramName ? { ...param, value } : param
            )
          }
        };
      }
      return node;
    })
  );
  
  // Update previews after a brief delay (to allow state to update)
  setTimeout(() => {
    // First update this node's preview
    generateNodePreview(nodeId);
    
    // Then process the full image
    processImage();
  }, 10);
}, [generateNodePreview, processImage]);

// Similarly update all other handlers (handleToggleEnabled, handleBlendModeChange, etc.)
```

**Change 3:** Update connection handler to update previews:

```typescript
// Modify onConnect
const onConnect = useCallback((connection: Connection) => {
  // Your existing code to create the edge
  const newEdge = {
    ...connection,
    id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
    // Other edge properties
  };
  
  // Add the edge
  setEdges(prevEdges => addEdge(newEdge, prevEdges));
  
  // Update previews after connection changes
  setTimeout(() => {
    processImage();
    updateAllNodePreviews();
  }, 10);
}, [processImage, updateAllNodePreviews]);
```

**Test:** Verify that node previews are generated and displayed when parameters change.

---

## PHASE 5: Performance Optimizations

### File: `/hooks/useFilterGraph.tsx`

**Change 1:** Add debouncing for parameter changes to improve performance:

```typescript
// Add debounce function
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: any[]) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Create debounced versions of functions
const debouncedUpdateNodePreview = useCallback(
  debounce((nodeId: string) => {
    generateNodePreview(nodeId);
  }, 150),  // 150ms delay for smoother updates
  [generateNodePreview]
);

const debouncedProcessImage = useCallback(
  debounce(() => {
    processImage();
  }, 150),
  [processImage]
);

// Use debounced functions in parameter handlers
const handleParamChange = useCallback((nodeId: string, paramName: string, value: number | string) => {
  // Skip preview updates
  if (paramName === 'preview') {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, data: { ...node.data, preview: value } } : node
      )
    );
    return;
  }
  
  // Clear cache for this node
  nodeResultCache.delete(nodeId);
  
  // Update node data
  setNodes(prevNodes => 
    prevNodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            params: node.data.params.map((param: any) => 
              param.name === paramName ? { ...param, value } : param
            )
          }
        };
      }
      return node;
    })
  );
  
  // Use debounced updates
  debouncedUpdateNodePreview(nodeId);
  debouncedProcessImage();
}, [debouncedUpdateNodePreview, debouncedProcessImage]);
```

**Test:** Verify that parameter changes still update previews but with less performance impact.

---

## Debugging Tips

If you encounter issues:

1. Add console logs to trace the flow:
   ```typescript
   console.log(`Generating preview for node ${nodeId}`);
   console.log("Preview data URL length:", previewUrl.length);
   ```

2. Check that the node cache is working:
   ```typescript
   console.log("Cache size:", nodeResultCache.size);
   console.log("Cached nodes:", Array.from(nodeResultCache.keys()));
   ```

3. Verify the preview data is set correctly:
   ```typescript
   console.log("Node preview set:", node.id, !!node.data.preview);
   ```

4. Start with just one filter type and ensure it works before adding others.

## Integrating With Your Codebase

These changes assume certain patterns in your codebase. You may need to adapt them:

1. If your filter processing code is structured differently, focus on preserving the same pattern of processing node chains in topological order
2. If your node components use a different structure, adapt the preview display accordingly
3. Keep the core logic the same: generate node-specific previews by processing only up to that node
