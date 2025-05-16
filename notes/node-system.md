# Node System

## Overview

The node system is the core of Filter Kit, allowing users to create complex filter chains by connecting nodes together.

## Node Types

### 1. ImageNode

- **Purpose**: Acts as the source of images in the filter graph
- **Features**:
  - Upload new images via click or drag-and-drop
  - Shows image preview
  - Has only output connections (no inputs)
- **Implementation**: [client/src/components/ImageNode.tsx](../client/src/components/ImageNode.tsx)

### 2. FilterNode

- **Purpose**: Applies specific filter effects to images
- **Features**:
  - Parameter controls (sliders, selects, etc.)
  - Preview of the filter result
  - Input and output connections
  - Parameter input/output connection points
  - Blend mode selection
  - Opacity control
  - Color tag for organization
- **Implementation**: [client/src/components/FilterNode.tsx](../client/src/components/FilterNode.tsx)

## Connection System

### Node Connections

- **Connection Types**:
  - Node-to-node: Connect a node's output to another node's input
  - Parameter-to-parameter: Connect a parameter from one node to a parameter on another node
  
- **Connection Rules**:
  - No circular connections (cycle detection)
  - Source nodes can only have outputs
  - Ensure parameters have compatible types

- **Connection UI**:
  - Connection handles are positioned on the edges of nodes
  - Parameters have their own connection points
  - Visual feedback on valid/invalid connections
  - Handles have different colors to indicate their type
  - Various methods to disconnect:
    - Double-click on connections
    - Red disconnect buttons on connected parameters
    - Delete key

## Parameter System

- **Parameter Types**:
  - float/integer: Numerical values for adjustments
  - color: Color selection
  - boolean: On/off toggles
  - option: Select from predefined options
  - (Future: vector2, texture, mask, etc.)

- **Control Types**:
  - range: Slider for numerical values
  - select: Dropdown for options
  - color: Color picker
  - checkbox: Boolean switches

- **Parameter Connections**:
  - Allows connecting parameters between nodes
  - Values from one parameter are passed to another
  - Connected parameters are disabled for direct editing
  - Visual indicators show when parameters are connected

## Graph Execution

1. When connections change, the system triggers reprocessing
2. Filter graph is traversed (depth-first) starting from source nodes
3. Each node:
   - Receives image data from its inputs
   - Applies its filter with current parameters
   - Passes the result to its outputs
4. Results are cached by node ID to prevent redundant processing
5. Final result is displayed in the preview panel

## Implementation Notes

- React Flow handles the visualization and basic interactions
- Custom connection validation logic prevents invalid connections
- DFS algorithm detects and prevents cycles in the graph
- The useFilterGraph hook coordinates the entire graph system
- Web Workers perform actual processing to prevent UI blocking

## Future Improvements

- Support for multiple input/output connections
- Custom node creation and saving
- Node groups/macros
- WebGL-accelerated filters
- Undo/redo system for graph changes