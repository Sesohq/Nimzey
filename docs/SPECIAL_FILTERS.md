# Special Filter Implementations

This document provides detailed information about some of the more complex filter implementations in FilterKit.

## Highlight Glow Filter

The Highlight Glow filter adds a luminous glow effect to the bright areas of an image, similar to a bloom effect in photography.

### How It Works

The Highlight Glow filter operates in several steps:

1. **Threshold Detection**: Identifies bright areas in the image that exceed a threshold
2. **Blur Application**: Applies a Gaussian blur to these bright areas
3. **Overlay Blending**: Blends the blurred bright areas back onto the original image

### Implementation

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

### Parameters

| Parameter | Description | Default | Range |
|-----------|-------------|---------|-------|
| Threshold | Brightness level above which pixels will glow | 0.6 | 0.0 - 1.0 |
| Intensity | Strength of the glow effect | 0.5 | 0.0 - 1.0 |
| Radius | Size of the glow blur | 10 | 1 - 50 |

### Use Cases

- Creating dreamy, ethereal effects
- Emphasizing light sources in an image
- Creating bloom effects similar to HDR photography
- Simulating lens flares and light leaks

## Halftone Filter

The Halftone filter simulates the printing technique where continuous tone is approximated with dots of varying size.

### How It Works

The Halftone filter divides the image into a grid of cells and replaces each cell with a shape (usually a circle) whose size corresponds to the average brightness of that cell.

### Implementation

```typescript
export function applyHalftoneFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  params: any[] = [],
  ctx?: CanvasRenderingContext2D,
  canvas?: HTMLCanvasElement
): void {
  if (!ctx || !canvas) return;
  
  // Extract parameters with defaults
  const paramsObj: Record<string, any> = {};
  params.forEach(param => {
    paramsObj[param.name] = param.value;
  });
  
  const gridSize = paramsObj.gridSize ?? 8;     // Default grid size of 8px
  const dotSize = paramsObj.dotSize ?? 0.8;     // Default max dot size relative to cell
  const shape = paramsObj.shape ?? 'circle';    // Default shape is circle
  const angle = paramsObj.angle ?? 0;           // Default angle is 0 degrees
  
  // Create a copy of the original image data
  const sourceData = new Uint8ClampedArray(data);
  
  // Clear the canvas for redrawing
  ctx.clearRect(0, 0, width, height);
  
  // Set drawing style
  ctx.fillStyle = 'black';
  
  function drawHalftonePattern(sourceData, ctx) {
    // Calculate number of cells in each dimension
    const numCellsX = Math.ceil(width / gridSize);
    const numCellsY = Math.ceil(height / gridSize);
    
    // For each cell in the grid
    for (let cellY = 0; cellY < numCellsY; cellY++) {
      for (let cellX = 0; cellX < numCellsX; cellX++) {
        // Get average brightness in this cell
        const brightness = getAverageBrightnessInGrid(
          sourceData,
          cellX * gridSize,
          cellY * gridSize,
          gridSize,
          width,
          height
        );
        
        // Map brightness to dot radius
        const radius = mapBrightnessToRadius(
          brightness,
          gridSize,
          0,          // Min dot size
          dotSize     // Max dot relative to cell
        );
        
        // Calculate center position of the cell
        const centerX = cellX * gridSize + gridSize / 2;
        const centerY = cellY * gridSize + gridSize / 2;
        
        // Draw the shape with the calculated radius
        drawShape(ctx, centerX, centerY, radius, shape, angle);
      }
    }
  }
  
  // Helper functions for calculating brightness and drawing shapes
  function getAverageBrightnessInGrid(data, startX, startY, size, width, height) {
    let totalBrightness = 0;
    let pixelCount = 0;
    
    // Limit to image boundaries
    const endX = Math.min(startX + size, width);
    const endY = Math.min(startY + size, height);
    
    // Sum brightness values of all pixels in the cell
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx] / 255;
        const g = data[idx + 1] / 255;
        const b = data[idx + 2] / 255;
        
        // Calculate perceived brightness
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
        pixelCount++;
      }
    }
    
    // Return average brightness or 0 if no pixels
    return pixelCount ? totalBrightness / pixelCount : 0;
  }
  
  function mapBrightnessToRadius(brightness, gridSize, minDotSize, maxDotSize) {
    // Convert relative maxDotSize to absolute pixels
    const maxRadius = (gridSize * maxDotSize) / 2;
    const minRadius = (gridSize * minDotSize) / 2;
    
    // For darker areas (low brightness), use larger dots
    // For lighter areas (high brightness), use smaller dots
    return minRadius + (1 - brightness) * (maxRadius - minRadius);
  }
  
  function drawShape(ctx, x, y, radius, shape, angle) {
    if (radius <= 0) return;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI / 180);
    
    switch (shape.toLowerCase()) {
      case 'square':
        const size = radius * 2;
        ctx.fillRect(-radius, -radius, size, size);
        break;
        
      case 'line':
        ctx.beginPath();
        ctx.moveTo(-radius, 0);
        ctx.lineTo(radius, 0);
        ctx.lineWidth = radius / 2;
        ctx.stroke();
        break;
        
      case 'circle':
      default:
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }
  
  // Execute the halftone drawing
  drawHalftonePattern(sourceData, ctx);
  
  // Update the original data array with the halftone result
  const newImageData = ctx.getImageData(0, 0, width, height);
  data.set(newImageData.data);
}
```

### Parameters

| Parameter | Description | Default | Range |
|-----------|-------------|---------|-------|
| Grid Size | Size of each cell in the halftone grid | 8 | 2 - 50 |
| Dot Size | Maximum size of dots relative to cell size | 0.8 | 0.1 - 1.0 |
| Shape | Shape of the halftone elements | 'circle' | circle, square, line |
| Angle | Rotation angle of the halftone pattern | 0 | 0 - 360 |

### Use Cases

- Creating a comic book or newspaper print effect
- Artistic stylization of photos
- Reducing file size while maintaining visual structure
- Creating pop art style images

## Refraction Filter

The Refraction filter simulates the optical phenomenon of light bending as it passes through different mediums, creating a water or glass-like distortion effect.

### How It Works

The Refraction filter uses a displacement map to shift pixels in a way that mimics how light bends when passing through different materials with varying refractive indices.

### Implementation

```typescript
export function applyRefractionFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  ctx: CanvasRenderingContext2D,
  params: any[] = []
): void {
  // Extract parameters with defaults
  const paramsObj: Record<string, any> = {};
  params.forEach(param => {
    paramsObj[param.name] = param.value;
  });
  
  const strength = paramsObj.strength ?? 10;    // Default distortion strength
  const scale = paramsObj.scale ?? 4;           // Default noise scale
  const seed = paramsObj.seed ?? Math.random(); // Random seed by default
  
  // Create temporary canvases
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Draw the original image to the temp canvas
  const imageData = new ImageData(data, width, height);
  tempCtx.putImageData(imageData, 0, 0);
  
  // Create a displacement map using noise
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = width;
  noiseCanvas.height = height;
  const noiseCtx = noiseCanvas.getContext('2d');
  
  if (!noiseCtx) return;
  
  // Generate noise for the displacement map
  const noiseData = noiseCtx.createImageData(width, height);
  const noise = new SimplexNoise(seed);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Generate noise value at scaled coordinates
      const noiseVal = (noise.noise2D(x / scale, y / scale) + 1) / 2;
      
      // Set RGB to the same noise value for a grayscale displacement map
      noiseData.data[idx] = noiseData.data[idx + 1] = noiseData.data[idx + 2] = noiseVal * 255;
      noiseData.data[idx + 3] = 255; // Full alpha
    }
  }
  
  noiseCtx.putImageData(noiseData, 0, 0);
  
  // Apply the displacement map to the original image
  ctx.save();
  
  // Use the noise as a displacement map
  ctx.drawImage(tempCanvas, 0, 0);
  
  // Apply refraction effect using a custom filter or pixel manipulation
  const finalData = ctx.getImageData(0, 0, width, height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Get displacement values from noise
      const displacementX = (noiseData.data[idx] / 255 - 0.5) * strength;
      const displacementY = (noiseData.data[idx + 1] / 255 - 0.5) * strength;
      
      // Calculate source pixel coordinates with displacement
      const sourceX = Math.min(Math.max(0, x + displacementX), width - 1);
      const sourceY = Math.min(Math.max(0, y + displacementY), height - 1);
      
      // Bilinear interpolation for smoother results
      const x1 = Math.floor(sourceX);
      const y1 = Math.floor(sourceY);
      const x2 = Math.min(x1 + 1, width - 1);
      const y2 = Math.min(y1 + 1, height - 1);
      
      const xWeight = sourceX - x1;
      const yWeight = sourceY - y1;
      
      const idx11 = (y1 * width + x1) * 4;
      const idx12 = (y2 * width + x1) * 4;
      const idx21 = (y1 * width + x2) * 4;
      const idx22 = (y2 * width + x2) * 4;
      
      // Interpolate color values
      for (let c = 0; c < 3; c++) {
        const top = data[idx11 + c] * (1 - xWeight) + data[idx21 + c] * xWeight;
        const bottom = data[idx12 + c] * (1 - xWeight) + data[idx22 + c] * xWeight;
        finalData.data[idx + c] = top * (1 - yWeight) + bottom * yWeight;
      }
      
      // Keep original alpha
      finalData.data[idx + 3] = data[idx + 3];
    }
  }
  
  // Put the processed data back onto the canvas
  ctx.putImageData(finalData, 0, 0);
  ctx.restore();
  
  // Copy the result back to the original data array
  const result = ctx.getImageData(0, 0, width, height);
  data.set(result.data);
}
```

### Parameters

| Parameter | Description | Default | Range |
|-----------|-------------|---------|-------|
| Strength | Amount of pixel displacement | 10 | 0 - 50 |
| Scale | Scale of the noise pattern | 4 | 1 - 100 |
| Seed | Seed for the noise generator | random | any number |

### Use Cases

- Creating underwater effects
- Simulating glass or ice distortions
- Creating heat haze effects
- Adding dynamic movement to static images

## Future Special Filters

The following special filters are planned for future implementation:

- **Displacement Map**: Uses one image to displace another
- **Fractal Noise**: Creates complex, self-similar noise patterns
- **Tilt Shift**: Simulates the miniature effect of tilt-shift photography
- **Light Leaks**: Adds realistic light leak effects
- **Glitch Effects**: Creates digital glitch and corruption effects
- **Chromatic Aberration**: Simulates color fringing from lens imperfections