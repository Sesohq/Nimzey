# Highlight Glow Filter Implementation

## Overview

The Highlight Glow filter is a specialized effect that adds a luminous glow to the bright areas of an image. This creates a dreamy, ethereal look similar to the bloom effect in photography and digital art. This document provides a detailed explanation of how the Highlight Glow filter works and how it's implemented in FilterKit.

## Visual Effect

The Highlight Glow filter:

- Brightens and expands light sources and highlights in an image
- Creates a soft, diffused glow around bright areas
- Simulates light scatter or bloom seen in high dynamic range (HDR) imagery
- Can produce effects ranging from subtle enhancement to dramatic, dreamy overexposure

## How It Works

The filter operates using a multi-step process:

1. **Threshold Detection**: First, the filter identifies which parts of the image are bright enough to glow by comparing each pixel's brightness to a threshold value.

2. **Mask Creation**: A mask is created containing only the bright areas that exceed the threshold.

3. **Blur Application**: A Gaussian blur is applied to this mask, creating a soft glow effect around the bright areas.

4. **Blending**: The blurred mask is then blended back onto the original image, with the intensity parameter controlling the strength of this blend.

## Implementation Details

The filter is implemented in the `applyGlowFilter` function in `filterAlgorithms.ts`:

```typescript
export function applyGlowFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  params: any[] = [],
  filterType?: FilterType,
  ctx?: CanvasRenderingContext2D,
  canvas?: HTMLCanvasElement
): void {
  // Extract parameters with defaults
  const paramsObj: Record<string, any> = {};
  params.forEach(param => {
    paramsObj[param.name] = param.value;
  });

  const threshold = paramsObj.threshold ?? 0.6; // Default threshold at 60%
  const intensity = paramsObj.intensity ?? 0.5; // Default intensity at 50%
  const radius = paramsObj.radius ?? 10;        // Default blur radius of 10px
  
  // Create a temporary canvas for processing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  
  if (!tempCtx) return;
  
  // Create an ImageData object for the threshold operation
  const imageData = new ImageData(width, height);
  const thresholdData = imageData.data;
  
  // Apply threshold to identify bright areas
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    
    // Calculate perceived brightness (luminance)
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // If pixel is bright enough, keep it; otherwise, make it black
    if (brightness > threshold) {
      thresholdData[i] = data[i];
      thresholdData[i + 1] = data[i + 1];
      thresholdData[i + 2] = data[i + 2];
      thresholdData[i + 3] = data[i + 3];
    } else {
      thresholdData[i] = 0;
      thresholdData[i + 1] = 0;
      thresholdData[i + 2] = 0;
      thresholdData[i + 3] = 0;
    }
  }
  
  // Draw the threshold image to the temp canvas
  tempCtx.putImageData(imageData, 0, 0);
  
  // Apply blur to the bright areas
  tempCtx.filter = `blur(${radius}px)`;
  tempCtx.drawImage(tempCanvas, 0, 0);
  
  // Reset the filter
  tempCtx.filter = 'none';
  
  // Get the blurred data
  const blurredData = tempCtx.getImageData(0, 0, width, height).data;
  
  // Blend the original image with the blurred highlights
  for (let i = 0; i < data.length; i += 4) {
    // Apply intensity to the glow
    data[i] = Math.min(255, data[i] + blurredData[i] * intensity);
    data[i + 1] = Math.min(255, data[i + 1] + blurredData[i + 1] * intensity);
    data[i + 2] = Math.min(255, data[i + 2] + blurredData[i + 2] * intensity);
  }
}
```

## Parameters

The Highlight Glow filter accepts three main parameters:

### 1. Threshold

- **Purpose**: Determines how bright a pixel must be to glow
- **Range**: 0.0 to 1.0 (0% to 100% brightness)
- **Default**: 0.6 (60%)
- **Effect**: Lower values make more of the image glow, higher values restrict the glow to only the brightest areas

### 2. Intensity

- **Purpose**: Controls the strength of the glow effect
- **Range**: 0.0 to 1.0 (0% to 100% strength)
- **Default**: 0.5 (50%)
- **Effect**: Higher values create a stronger, more pronounced glow

### 3. Radius

- **Purpose**: Determines how far the glow extends from bright areas
- **Range**: 1 to 50 pixels
- **Default**: 10 pixels
- **Effect**: Larger radius values create a more diffuse, widespread glow

## Use Cases

The Highlight Glow filter is particularly effective for:

- **Photography Enhancement**: Adding a dreamy, soft quality to portraits or landscapes
- **Light Effects**: Enhancing light sources like candles, lights, or the sun
- **Fantasy Imagery**: Creating ethereal or magical atmospheres
- **HDR Simulation**: Mimicking the bloom effect seen in HDR photography
- **Text Effects**: Making text appear to glow or have a neon-like quality
- **UI Elements**: Drawing attention to important interface elements

## Artistic Considerations

For the best results with the Highlight Glow filter:

- **Subtlety**: Often, a subtle glow (low intensity, moderate radius) produces the most professional results
- **Source Material**: The filter works best on images with good contrast and clear highlights
- **Combinations**: Try combining with other filters like contrast adjustment beforehand to enhance the effect
- **Color Impact**: The glow preserves the original colors of the bright areas, which can create color bleeding effects

## Performance Considerations

The Highlight Glow filter involves several processing steps that can be computationally intensive:

- Creating and manipulating temporary canvases
- Applying Gaussian blur to the highlight mask
- Pixel-by-pixel blending operations

For better performance:

- Consider implementing WebGL accelerated versions of this filter
- Cache results when parameters haven't changed
- Use progressive rendering for large images

## Future Enhancements

Potential improvements to the Highlight Glow filter:

- **Color Tinting**: Add the ability to tint the glow with a specific color
- **Multiple Thresholds**: Allow different glow intensities for different brightness levels
- **Directional Glow**: Add the ability to make the glow extend in a specific direction
- **Bloom Types**: Provide different bloom algorithms (e.g., Gaussian, box, dual filter)
- **Chromatic Aberration**: Add optional color fringing to the glow for a lens effect