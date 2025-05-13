# Node System

## Overview

The node system is the core of FilterKit's architecture, allowing users to create complex image processing workflows by connecting nodes in a graph-like structure. This document describes the design, implementation, and future plans for the node system.

## Node Types

The application supports several types of nodes:

### 1. Filter Nodes

Standard nodes that apply a specific filter effect to an image. These nodes have:
- One input handle (except for generator nodes)
- One output handle
- A set of parameter controls specific to the filter type
- A preview of the filter's output

### 2. Blend Nodes

Specialized nodes for combining two images using various blend modes. These nodes have:
- Three input handles:
  - Foreground (top image)
  - Background (bottom image)
  - Opacity (optional control for blend strength)
- One output handle
- A blend mode selector
- No internal preview (uses main preview)

### 3. Image Nodes

Source nodes representing uploaded images. These nodes have:
- No input handles
- One output handle
- A preview of the image
- Basic image information (dimensions, format)

### 4. Custom Nodes

User-created nodes that encapsulate a group of other nodes as a single unit. These nodes have:
- Variable input handles (defined by the user)
- Variable output handles (defined by the user)
- A preview of the node's output
- Custom parameters exposed from internal nodes

## Node Data Structure

Each node in the system follows a common data structure:

```typescript
interface Node {
  id: string;
  type: string;  // 'filter', 'blend', 'image', 'custom'
  position: { x: number; y: number };
  data: FilterNodeData | BlendNodeData | ImageNodeData | CustomNodeData;
  selected?: boolean;
  dragging?: boolean;
}

interface FilterNodeData {
  label: string;
  filterType: FilterType;
  parameters: { 
    name: string; 
    value: number | string | boolean; 
    type: 'range' | 'select' | 'color' | 'checkbox';
    options?: string[]; 
    min?: number;
    max?: number;
    step?: number;
  }[];
  preview?: string;  // Data URL of the preview image
  enabled: boolean;
}
```

## Connection System

Connections between nodes are represented by edges:

```typescript
interface Edge {
  id: string;
  source: string;       // ID of the source node
  target: string;       // ID of the target node
  sourceHandle?: string; // ID of the specific output handle
  targetHandle?: string; // ID of the specific input handle
  selected?: boolean;
  animated?: boolean;
  style?: React.CSSProperties;
  markerEnd?: MarkerType;
}
```

Connections follow these rules:
- Outputs can connect to multiple inputs
- Inputs can only receive one connection
- Blend nodes have specialized input handles
- Cyclic connections are not permitted

## Node Processing Pipeline

The node processing system follows these steps:

1. **Traversal**: Starting from an output or selected node, traverse the graph backward to find all input nodes
2. **Ordering**: Determine the order in which nodes should be processed
3. **Processing**: Apply each node's filter to its input(s)
4. **Caching**: Cache the results to avoid redundant processing
5. **Previewing**: Update the node previews and main preview

## Implementation Details

### Node Graph Management

The node graph is managed using the `useFilterGraph` hook, which provides:

```typescript
function useFilterGraph() {
  // State management
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // Node operations
  const addNode = useCallback((filterType: FilterType) => {...});
  const onNodesChange = useCallback((changes: NodeChange[]) => {...});
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {...});
  const onConnect = useCallback((connection: Connection) => {...});
  
  // Filter processing
  const generateNodePreview = useCallback((targetNode: Node) => {...});
  const processFilterNode = useCallback(() => {...});
  const processBlendNode = useCallback(() => {...});
  
  // Clipboard operations
  const copySelectedNodes = useCallback(() => {...});
  const pasteNodes = useCallback(() => {...});
  
  // Other utilities
  const handleKeyDown = useCallback((event: KeyboardEvent) => {...});
  const findFilterByType = useCallback((filterType: FilterType) => {...});
  
  return {
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNode, 
    // ...other functions
  };
}
```

### Node Preview Generation

Node previews are generated using the `generateNodePreview` function:

```typescript
const generateNodePreview = useCallback((targetNode: Node) => {
  // 1. Create canvas for preview
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = previewSize;
  previewCanvas.height = previewSize;
  const previewCtx = previewCanvas.getContext('2d')!;
  
  // 2. Get input nodes
  const sourceNodes = getSourceNodesForNode(targetNode.id, nodes, edges);
  
  // 3. Process the node based on its type
  if (targetNode.type === 'filter') {
    processFilterNode(previewCanvas, previewCtx, targetNode as Node<FilterNodeData>, sourceNodes);
  } else if (targetNode.type === 'blend') {
    processBlendNode(previewCanvas, previewCtx, targetNode, sourceNodes.inputA, sourceNodes.inputB);
  }
  
  // 4. Generate data URL for the preview
  const previewDataUrl = previewCanvas.toDataURL();
  
  // 5. Update the node with the preview
  setNodes(nds => nds.map(node => 
    node.id === targetNode.id 
      ? { ...node, data: { ...node.data, preview: previewDataUrl } } 
      : node
  ));
  
  // 6. Cache the result
  nodeResultCache.set(targetNode.id, previewCanvas);
  
  return previewCanvas;
}, [nodes, edges]);
```

## Future Enhancements

### Short-term Improvements

- **Consistent Node Previews**: Ensure all nodes display proper previews of their output
- **Better Connection Visualization**: Improve the visual representation of connections
- **Node Groups**: Allow grouping related nodes together
- **Filter Chain Validation**: Add validation to prevent invalid node configurations
- **Undo/Redo Support**: Add history management for node operations

### Long-term Plans

- **Node Templates**: Predefined arrangements of nodes for common effects
- **Node Comments**: Allow adding notes to explain parts of a filter chain
- **Subgraphs**: Allow collapsing complex node arrangements into simpler components
- **Animation Nodes**: Nodes that can animate parameters over time
- **Script Nodes**: Custom JavaScript nodes for advanced processing
- **Conditional Nodes**: Nodes that apply different processing based on conditions
- **GPU Processing**: Offload node processing to GPU for better performance