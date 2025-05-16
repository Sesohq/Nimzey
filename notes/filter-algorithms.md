# Filter Algorithms

## Implementation Overview

Filter Kit's filter algorithms are implemented in JavaScript/TypeScript and operate on image data at the pixel level. Most filters work with the Canvas API's `ImageData` objects, manipulating RGB and alpha values directly.

## Core Concepts

### Image Data Structure

Each image is represented as an `ImageData` object with:
- `data`: A `Uint8ClampedArray` containing RGBA values (0-255)
- `width`: The width of the image in pixels
- `height`: The height of the image in pixels

For a pixel at position (x, y), its RGBA values are at indices:
- Red: `(y * width + x) * 4`
- Green: `(y * width + x) * 4 + 1`
- Blue: `(y * width + x) * 4 + 2`
- Alpha: `(y * width + x) * 4 + 3`

### Processing Pipeline

1. Image data enters a filter function
2. The filter applies its algorithm to the pixel data
3. The resulting image data is passed to the next filter

## Filter Categories

### Basic Filters

1. **Blur**
   - Implementation: Gaussian blur algorithm
   - Parameters: Radius (spread of the blur)
   - Performance: O(n*radius) with separable kernel optimization

2. **Sharpen**
   - Implementation: Unsharp mask technique
   - Parameters: Amount (intensity of sharpening)
   - Notes: Uses a combination of blur and original image

3. **Grayscale**
   - Implementation: Weighted RGB conversion (0.299R + 0.587G + 0.114B)
   - Notes: Perceptual weights to match human vision

4. **Invert**
   - Implementation: Simple 255-value calculation for RGB
   - Notes: Alpha channel is preserved

### Special Effects

1. **Noise**
   - Implementation: Random value addition to RGB channels
   - Parameters: Amount (intensity of noise)
   - Variants: Gaussian, uniform, salt & pepper

2. **Dither**
   - Implementation: Multiple dithering algorithms
   - Types:
     - Bayer: Ordered dithering with Bayer matrices
     - Error Diffusion: Floyd-Steinberg algorithm
     - Blue Noise: Using precomputed blue noise textures
   - Parameters: Threshold, matrix size

3. **Glow**
   - Implementation: Highlight extraction + blur + blend
   - Parameters: Radius, intensity, threshold
   - Notes: Multi-step process for realistic bloom effect

4. **Halftone**
   - Implementation: Converts continuous tone to dot patterns
   - Parameters: Cell size, shape, angle
   - Types: Circle, diamond, line, cross

### Distortion Filters

1. **Wave**
   - Implementation: Pixel displacement based on sine/cosine functions
   - Parameters: Amplitude, frequency, direction

2. **Pixelate**
   - Implementation: Averaging pixel values in blocks
   - Parameters: Pixel size

3. **Extrude**
   - Implementation: 3D-like effect using luminance as height
   - Parameters: Depth, direction

### Edge Detection

1. **Find Edges**
   - Implementation: Kernel-based edge detection
   - Types:
     - Sobel: Gradient-based (horizontal and vertical)
     - Laplacian: Second-derivative based
     - Prewitt: Simpler gradient alternative to Sobel
   - Parameters: Threshold, invert option

## Optimization Strategies

1. **Web Workers**
   - All heavy filtering operations run in separate threads
   - Communication via structured cloning of ImageData

2. **Kernel Optimization**
   - Separable kernels for 2D convolution filters (e.g., blur)
   - Pre-computed kernel weights

3. **Area Processing**
   - Only process affected areas for certain filters
   - Skip transparent pixels when appropriate

4. **Caching**
   - Results cached by node ID
   - Prevent redundant processing of unchanged inputs

## Future Algorithm Improvements

1. **WebGL Acceleration**
   - Shader-based implementation for GPU acceleration
   - Especially for convolution filters (blur, edge detection)

2. **Machine Learning Filters**
   - Style transfer
   - Super-resolution
   - Smart object removal

3. **Performance**
   - Web Assembly implementations for critical algorithms
   - Adaptive processing based on image size