# Blend and Compositing System

## Overview

The blend and compositing system in FilterKit allows users to combine multiple images or filter outputs in a variety of ways, similar to layer blending in professional image editing software. This document describes the current implementation and future plans for the blending system.

## Blend Node Implementation

The Blend Node is a specialized node that takes two inputs (Foreground and Background) and combines them using a specified blend mode. It also supports an optional Opacity input to control the strength of the blend.

### Current Implementation

The current Blend Node has a simplified UI with:

- Three labeled input handles on the left side:
  - **Foreground**: The top image or filter output (equivalent to top layer in Photoshop)
  - **Background**: The bottom image or filter output (equivalent to bottom layer in Photoshop)
  - **Opacity**: Optional input to control blend strength (uses a default value if not connected)
- A dropdown to select the blend mode
- No internal preview area (the result is visible in the main preview panel)

### Blend Modes

The following blend modes are currently implemented:

| Blend Mode | Description | Formula |
|------------|-------------|---------|
| Normal | Standard alpha blending | `result = fg * opacity + bg * (1 - opacity)` |
| Multiply | Darkens by multiplication | `result = fg * bg` |
| Screen | Lightens by inverse multiplication | `result = 1 - (1 - fg) * (1 - bg)` |
| Overlay | Combines Multiply and Screen | `result = bg < 0.5 ? 2 * bg * fg : 1 - 2 * (1 - bg) * (1 - fg)` |
| Darken | Takes the darker of fg and bg | `result = min(fg, bg)` |
| Lighten | Takes the lighter of fg and bg | `result = max(fg, bg)` |
| Color Dodge | Brightens bg based on fg | `result = bg / (1 - fg)` |
| Color Burn | Darkens bg based on fg | `result = 1 - (1 - bg) / fg` |
| Hard Light | Harsh overlay effect | `result = fg < 0.5 ? 2 * fg * bg : 1 - 2 * (1 - fg) * (1 - bg)` |
| Soft Light | Gentle overlay effect | Complex formula that simulates soft lighting |
| Difference | Absolute difference | `result = abs(fg - bg)` |
| Exclusion | Similar to difference but softer | `result = fg + bg - 2 * fg * bg` |
| Hue | Takes hue from fg, saturation and luminance from bg | Converts to HSL color space |
| Saturation | Takes saturation from fg, hue and luminance from bg | Converts to HSL color space |
| Color | Takes hue and saturation from fg, luminance from bg | Converts to HSL color space |
| Luminosity | Takes luminance from fg, hue and saturation from bg | Converts to HSL color space |

### Implementation Details

The blend operations are implemented in the `applyBlendMode` function in `filterAlgorithms.ts`, which:

1. Takes source and destination canvases
2. Processes the blend based on the selected mode
3. Writes the result to the destination canvas

For color space conversions (needed for Hue, Saturation, Color, and Luminosity blend modes), helper functions convert between RGB and HSY (Hue, Saturation, Luminance) color spaces.

## Advanced Compositing Features

### Current Features

- **Basic Alpha Compositing**: Standard alpha blending between layers
- **Blend Modes**: Various mathematical combinations of pixel values
- **Opacity Control**: Global opacity adjustment for the blend

### Planned Features

- **Layer Masks**: Use grayscale images to control blend opacity per-pixel
- **Clipping Masks**: Constrain visibility based on another layer's alpha channel
- **Adjustment Layers**: Apply filters to multiple layers below
- **Blend If**: Conditional blending based on luminance or color channel values
- **BlendMode for individual channels**: Apply different blend modes to different color channels

## Connection System

The current connection system for blend nodes follows these rules:

1. Inputs are clearly labeled for user clarity (Foreground, Background, Opacity)
2. The node processes these inputs in `processBlendNode` in `useFilterGraph.tsx`
3. If an input is not connected, appropriate defaults are used

## Future Enhancements

### Short-term Improvements

- **Add Blend Previews**: Add small preview areas to blend nodes
- **More Blend Modes**: Implement additional blend modes like Pin Light, Linear Dodge, etc.
- **Performance Optimizations**: Optimize blending operations for better performance
- **Better Input Handling**: Improve handling of missing inputs and edge cases

### Long-term Plans

- **Advanced Masking**: Layer masks and clipping masks
- **Blend Groups**: Apply blend modes to groups of nodes
- **Live Preview**: Real-time preview of blend mode changes
- **GPU Acceleration**: Use WebGL for accelerated blending operations