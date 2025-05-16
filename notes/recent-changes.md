# Recent Changes

This document logs significant recent changes to Filter Kit, organized by date and feature area.

## May 15, 2024

### Node Connection System

- Fixed cycle detection to prevent self-connections and loops in the node graph
- Added clear warning messages (toasts) when invalid connections are attempted
- Implemented multiple methods for disconnecting node parameters:
  - Double-click on connection lines
  - Red disconnect button on connected parameters
  - Keyboard delete key when selected
- Added visual feedback for valid/invalid connection attempts

### UI Improvements

- Removed duplicate parameter type badges that were showing up twice
- Changed panel title from "Filters" to "Nodes" for consistency
- Fixed image upload functionality in the Source Image node
  - Now uses a direct file input creation approach
  - Matches behavior of the main upload button
- Created documentation folder with architectural and feature notes

### Node Parameter System

- Updated parameter connection display to be more intuitive
- Fixed parameter badge styling and positioning
- Made connection points more visible with consistent styling

## May 10, 2024

### Filter Chain Preview

- Improved filter chain preview to show upstream nodes
- Added thumbnail previews for each step in the processing chain
- Implemented scrollable container for long filter chains
- Fixed preview sizing and rendering issues

### Export Functionality

- Moved export settings to gear icon popup for cleaner UI
- Updated export image button styling to match upload button
- Changed "EXPORT FINAL IMAGE" to "Export Image" for consistency

### General UI

- Fixed node color tagging system
- Updated blend mode selector with improved dropdown
- Added opacity control to filter nodes
- Implemented node collapse/expand functionality
- Added hover states to all interactive elements

## May 5, 2024

### Filter Implementations

- Added Highlight Glow filter with multi-step processing
- Implemented Halftone filter with various pattern options
- Improved Dither filter with multiple dithering algorithms
- Added Find Edges filter with multiple edge detection methods

### Performance Improvements

- Implemented Web Worker for filter processing
- Added caching of processed images by node ID
- Improved rendering performance for large images
- Added queue-based filter processing system