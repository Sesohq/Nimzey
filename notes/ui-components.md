# UI Components and Design Decisions

## Design Philosophy

Filter Kit's UI design follows a terminal-inspired aesthetic with glitch art influences, balancing functionality with a distinctive visual style.

## Key Design Choices

### 1. Terminal-Style Panel Design
- Black backgrounds with monospace fonts
- Command-line prefix (`//`) for filter names
- High contrast between panels and workspace
- Code-like color schemes for categories

### 2. Node Appearance
- Clean white card-based nodes with colored headers
- Visual distinction between filter and image nodes
- Preview thumbnails within nodes to show effects
- Consistent connection points positioned outside borders

### 3. Color Coding System
- Each filter category has a dedicated color:
  - Basic filters: Blue
  - Distortion: Orange
  - Texture: Green
  - Edge Detection: Purple
  - Artistic: Pink
- Color-coded handles and buttons reinforce categories
- Color tags allow users to organize nodes visually

## Component Overview

### FilterPanel
- **Purpose**: Display and organize available filter nodes
- **Features**:
  - Collapsible categories with color-coded headers
  - Terminal-style filter buttons with "//" prefix
  - Drag and drop support for node creation
  - Upload image button with distinct styling
- **Styling**: 
  - Pure black background for terminal aesthetic
  - VT323 monospace font for headers
  - Glitch-style buttons with category color borders

### NodeCanvas
- **Purpose**: Main workspace for arranging and connecting nodes
- **Features**:
  - Drag to position nodes
  - Connect nodes by dragging between handles
  - Zoom and pan controls
  - Background grid for spatial reference
- **Styling**:
  - Light grey dot pattern background
  - Clean visual design to focus on nodes
  - Connection lines with appropriate curvature

### FilterNode
- **Purpose**: Represent individual filter operations
- **Features**:
  - Parameter controls (sliders, selects, checkboxes)
  - Parameter connection points for linking values
  - Preview thumbnail of the filter result
  - Blend mode and opacity controls
  - Collapsible interface for space efficiency
- **Styling**:
  - Card-based design with category-colored headers
  - Connection handles positioned 17px outside borders
  - Grey dots for parameter connections
  - Clean parameter UI with type badges

### PreviewPanel
- **Purpose**: Display processed results and export options
- **Features**:
  - Preview of selected node or final result
  - Upstream filter chain visualization
  - Export options with format selection
  - Dockable/undockable with drag handle
- **Styling**:
  - Terminal-style black background matching FilterPanel
  - Object-cover image display for full area utilization
  - Custom scrollbar to match terminal aesthetic

## Interaction Patterns

### 1. Node Connection
- **Direct Visual Feedback**:
  - Hover effects on connection points
  - Visual indicators for valid/invalid connections
  - Parameter highlighting when connections are possible

### 2. Parameter Editing
- **Click-to-Edit**:
  - Direct click on parameter values to edit
  - Different control types based on parameter type
  - Disabled UI for connected parameters

### 3. Filter Chain Visualization
- **Upstream Chain**:
  - Shows nodes that contribute to the selected node
  - Thumbnails display each step in the process
  - Scrollable container for complex chains

### 4. Visual Error Handling
- **Toast Notifications**:
  - Clear messages for invalid operations
  - Contextual errors (e.g., "cannot create circular connection")
  - Non-intrusive display that auto-dismisses

## Mobile Responsiveness

- **Adaptive Layout**:
  - Panels can collapse or resize
  - Touch-friendly interaction targets
  - Maintains core functionality at various screen sizes

## Accessibility Considerations

- **Color Contrast**: 
  - High contrast between text and backgrounds
  - Visual indicators beyond just color
  
- **Keyboard Navigation**:
  - Tab navigation for interactive elements
  - Keyboard shortcuts for common operations

## Future UI Improvements

- Dark/light theme toggle
- Customizable panel layouts
- Node grouping and organization tools
- More visual indicators for processing status
- Improved mobile touch interactions
- Custom node styling options