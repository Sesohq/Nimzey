# Filter Kit Architecture

## System Overview

Filter Kit is a node-based image processing application that allows users to apply various filters and effects to images through an intuitive graph-based interface.

## Key Components

### 1. React Frontend with ReactFlow

The application is built with React and uses ReactFlow as the core library for the node-based UI. ReactFlow handles:
- Node rendering and positioning
- Edge connections between nodes
- Drag and drop interactions
- Panning and zooming

### 2. State Management

State management is handled through React hooks:
- `useFilterGraph` - Manages the node graph, connections, and processed results
- `useFilterWorker` - Interfaces with Web Workers for processing
- `useState` and `useCallback` for component-level state

### 3. Web Workers for Image Processing

To keep the UI responsive during intensive image processing:
- Filter algorithms run in a separate thread via Web Workers
- Image data is passed to/from the worker using structured cloning
- The main thread remains free for UI interactions

### 4. Data Flow

1. User uploads an image → becomes the source node
2. User adds filter nodes and connects them
3. When connections change:
   - The filter graph is traversed
   - Images are processed through the filter chain
   - Results are displayed in the preview panel

### 5. Component Structure

```
App
├── Header
├── FilterPanel (left)
│   └── Filter categories and nodes
├── NodeCanvas (center)
│   ├── ImageNode
│   └── FilterNode(s)
└── PreviewPanel (right)
    ├── Selected node preview
    ├── Final image preview
    └── Export options
```

## Technical Decisions

### GPU Acceleration

- Canvas-based rendering with OffscreenCanvas where available
- WebGL utilization for certain filters (planned)

### Performance Optimizations

- Image processing in Web Workers
- Memoization of expensive computations
- Progressive rendering of large images
- Caching of processed filter results by node ID

### Browser Compatibility

- Target modern browsers with Web Workers, Canvas API
- Fallbacks for older browsers with limited functionality