# Filter Nodes Documentation

## Overview

Filter nodes are the core building blocks of the FilterKit application. Each node represents a specific image processing operation that can be connected to other nodes to create complex filter chains. This document describes the current implementation and future plans for filter nodes.

## Node Types

### Basic Filter Nodes

These nodes apply fundamental image processing operations:

| Filter | Description | Parameters |
|--------|-------------|------------|
| Blur | Applies Gaussian blur | Radius: Controls blur strength |
| Sharpen | Enhances image edges | Amount: Controls sharpening intensity |
| Grayscale | Converts image to grayscale | None |
| Invert | Inverts image colors | None |
| Brightness | Adjusts image brightness | Level: Controls brightness level |
| Contrast | Adjusts image contrast | Level: Controls contrast level |

### Texture Filter Nodes

These nodes apply texture and pattern effects:

| Filter | Description | Parameters |
|--------|-------------|------------|
| Noise | Adds random noise | Type: Noise pattern type (Perlin, etc.) <br> Strength: Noise intensity <br> Scale: Size of noise features |
| Dither | Simulates limited color depth | Method: Dithering algorithm <br> Threshold: Binarization threshold <br> Matrix Size: For Bayer dithering |
| Halftone | Creates dot pattern like printing | Dot Size: Controls size of dots <br> Grid Size: Controls spacing <br> Shape: Dot shape (circle, square) <br> Angle: Rotation of pattern |
| Pixelate | Creates blocky pixel effect | Pixel Size: Size of pixel blocks |
| Texture | Applies texture overlay | Texture Type: Pattern to apply <br> Strength: Texture visibility |

### Compositing Nodes

These nodes combine multiple inputs:

| Node | Description | Inputs |
|------|-------------|--------|
| Blend | Combines two images with blend modes | Foreground: Top image <br> Background: Bottom image <br> Opacity: Blend strength <br> Blend Mode: How images are combined |
| Mask | Uses one image to mask another | Image: Main image <br> Mask: Controls visibility |
| Mix | Linear interpolation between inputs | Input A, Input B, Mix Amount |

### Generator Nodes

These nodes create content without requiring input:

| Node | Description | Parameters |
|------|-------------|------------|
| Noise Generator | Creates noise patterns | Type: Noise algorithm <br> Scale: Feature size <br> Seed: For deterministic output |
| Gradient | Creates color gradients | Type: Linear, Radial, etc. <br> Colors: Start and end colors |

## Node Structure

Each filter node has a common structure:

- **Header**: Contains the node title and controls
- **Preview Area**: Shows a small preview of the node's output
- **Parameters**: UI controls for adjusting filter parameters
- **Connection Points**: Input and output handles for connecting to other nodes

## Implementation Details

### Node Components

- `FilterNode.tsx`: Generic component for most filter nodes
- `BlendNode.tsx`: Specialized component for blending operations
- `NoiseGeneratorNode.tsx`: Specialized component for noise generation
- `ImageNode.tsx`: Component for uploaded image sources

### Filter Algorithm Implementation

Filter algorithms are implemented in the `filterAlgorithms.ts` file. Each filter function follows a common pattern:

```typescript
export function applyFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  params: any[] = []
): void {
  // 1. Extract parameters from params array
  // 2. Process each pixel in the data array
  // 3. Return modified data (by reference)
}
```

## Preview System

Each node has its own preview capability:

1. When a node is created or its parameters change, `generateNodePreview` is called
2. This function processes the node's inputs (if any) and applies the node's filter
3. The result is cached and displayed in the node's preview area

## Future Enhancements

### Short-term Improvements

- **Consistent Preview System**: Ensure all nodes display proper previews of their output
- **Parameter Type Safety**: Improve type safety for filter parameters
- **Performance Optimizations**: Optimize filter algorithms for better performance
- **Error Handling**: Add robust error handling for filter application

### Long-term Plans

- **Custom Filter Creation**: Allow users to create custom filters by combining existing ones
- **Filter Preset System**: Save and load filter configurations
- **Advanced Parameter UI**: More intuitive UI for adjusting filter parameters (curves, etc.)
- **GPU Acceleration**: Use WebGL for accelerated filter processing
- **Animation Support**: Allow parameters to be animated over time