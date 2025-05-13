# Getting Started with FilterKit

This guide will help you get familiar with FilterKit's interface and features, demonstrating how to create your first filter chain.

## Interface Overview

FilterKit's interface is divided into three main sections:

1. **Filter Panel (Left)**: Contains all available filter nodes organized by category
2. **Node Canvas (Center)**: The workspace where you build your filter chain
3. **Preview Panel (Right)**: Shows the result of your filter chain

## Basic Workflow

### 1. Uploading an Image

To begin working with FilterKit, you need to upload an image:

1. Click the "Upload Image" button in the filter panel
2. Select an image file from your computer
3. The image will appear as an Image Node on the canvas

### 2. Adding Filter Nodes

To add filter effects to your image:

1. Browse the filter categories in the left panel
2. Drag a filter node (e.g., Blur) onto the canvas
3. Position it near your image node

### 3. Connecting Nodes

To apply a filter to your image:

1. Click and drag from the output handle (right side) of the Image Node
2. Drop onto the input handle (left side) of the filter node
3. A connection line will appear, showing the flow of data

### 4. Adjusting Parameters

Each filter node has its own set of adjustable parameters:

1. Click on a filter node to select it
2. Adjust the sliders, dropdowns, or other controls
3. The preview will update in real-time

### 5. Chaining Multiple Filters

You can create complex effects by chaining multiple filters:

1. Drag another filter node onto the canvas
2. Connect the output of your first filter to the input of the new one
3. Continue building your chain by adding and connecting more nodes

## Working with Blend Nodes

Blend nodes allow you to combine two images or filter chains:

1. Add a Blend Node to the canvas
2. Connect one image/filter chain to the "Foreground" input
3. Connect another image/filter chain to the "Background" input
4. Optionally, connect a mask to the "Opacity" input
5. Select a blend mode from the dropdown in the Blend Node

## Creating a Simple Glow Effect

Let's create a simple highlight glow effect on an image:

1. **Upload an image** to the canvas
2. **Add a Brightness filter**:
   - Drag a Brightness filter from the Basic category
   - Connect your image to it
   - Increase the brightness to around 20%
3. **Add a Glow filter**:
   - Drag a Glow filter from the Special category
   - Connect the Brightness node to it
   - Set the Threshold to around 0.6 (60%)
   - Set the Intensity to around 0.5 (50%)
   - Adjust the Radius to control the glow size (try 10px)
4. **Fine-tune the effect**:
   - Adjust the Threshold to control which parts of the image glow
   - Modify the Intensity to make the glow stronger or subtler
   - Change the Radius for a more diffuse or concentrated glow

## Creating a Halftone Effect

To create a halftone effect similar to newspaper printing:

1. **Upload an image** to the canvas
2. **Add a Contrast filter**:
   - Connect your image to it
   - Increase the contrast to around 20%
3. **Add a Halftone filter**:
   - Drag a Halftone filter from the Texture category
   - Connect the Contrast node to it
   - Set the Grid Size to control the resolution (try 8px)
   - Set the Dot Size to control dot scaling (try 80%)
   - Choose a shape (Circle, Square, or Line)
   - Set the angle (0° for standard, 45° for diagonal)
4. **Experiment with parameters**:
   - Try different shapes for unique effects
   - Adjust the grid size for more or less detail
   - Change the dot size for different visual styles

## Saving and Loading

(Coming Soon) You'll be able to save your filter chains as presets and load them later:

1. Click the "Save Preset" button
2. Give your preset a name and description
3. To load a preset, select it from the presets panel

## Tips and Tricks

- **Node Organization**: Keep your canvas organized by arranging nodes logically
- **Preview Nodes**: Click on any node to see its individual output in the preview panel
- **Disable Nodes**: Toggle nodes on/off to compare results with and without specific filters
- **Blend Experimentation**: Try different blend modes to see how they affect your image
- **Parameter Sensitivity**: Some parameters are more sensitive than others; make small adjustments
- **Start Simple**: Begin with 2-3 nodes to understand their effects before creating complex chains