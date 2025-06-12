// NOTE: This file is for future implementation of web workers
// Currently, we are using the main thread for image processing
// This file shows how we would implement worker-based processing
import { FilterType } from '../types';

// Types for the worker messages
interface WorkerMessage {
  type: 'applyFilter' | 'applyFilters';
  imageData: ImageData;
  filter?: {
    type: FilterType;
    params: any[];
  };
  filters?: {
    type: FilterType;
    params: any[];
  }[];
  targetNodeId?: string;
}

type FilterFunction = (data: Uint8ClampedArray, width: number, height: number, ...params: any[]) => void;

// Initialize filter functions
const filterFunctions: Record<string, FilterFunction> = {
  blur: applyBlurFilter,
  sharpen: applySharpenFilter,
  grayscale: applyGrayscaleFilter,
  invert: applyInvertFilter,
  noise: applyNoiseFilter,
  dither: applyDitherFilter,
  texture: applyTextureFilter,
  extrude: applyExtrudeFilter,
  wave: applyWaveFilter,
  pixelate: applyPixelateFilter,
  findEdges: applyFindEdgesFilter,
  glow: applyGlowFilter,
  halftone: applyHalftoneFilter,
  mask: applyMaskFilter
};

// Event listener for messages from main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, imageData, filter, filters, targetNodeId } = event.data;
  
  try {
    // Clone the image data to avoid modifying the original
    const clonedData = new Uint8ClampedArray(imageData.data);
    
    if (type === 'applyFilter' && filter) {
      // Apply a single filter
      const { type: filterType, params } = filter;
      if (filterFunctions[filterType]) {
        filterFunctions[filterType](clonedData, imageData.width, imageData.height, ...params);
      }
      
      // Create a new ImageData to send back
      const resultImageData = new ImageData(clonedData, imageData.width, imageData.height);
      
      // Send the processed data back to the main thread
      self.postMessage({
        type: 'filterApplied',
        imageData: resultImageData,
        targetNodeId
      });
    } 
    else if (type === 'applyFilters' && filters) {
      // Apply multiple filters in sequence
      for (const filter of filters) {
        const { type: filterType, params } = filter;
        if (filterFunctions[filterType]) {
          filterFunctions[filterType](clonedData, imageData.width, imageData.height, ...params);
        }
      }
      
      // Create a new ImageData to send back
      const resultImageData = new ImageData(clonedData, imageData.width, imageData.height);
      
      // Send the processed data back to the main thread
      self.postMessage({
        type: 'filtersApplied',
        imageData: resultImageData,
        targetNodeId
      });
    }
  } catch (error) {
    // Send back any errors
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      targetNodeId
    });
  }
};

// Filter implementation functions

// Blur filter
function applyBlurFilter(data: Uint8ClampedArray, width: number, height: number, radius: number): void {
  // Simple box blur implementation
  const tempData = new Uint8ClampedArray(data.length);
  tempData.set(data);
  
  const radiusSquared = radius * radius;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      let count = 0;
      
      // Sample pixels in a square area
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const pixelX = Math.min(width - 1, Math.max(0, x + kx));
          const pixelY = Math.min(height - 1, Math.max(0, y + ky));
          
          if (kx * kx + ky * ky <= radiusSquared) {
            const idx = (pixelY * width + pixelX) * 4;
            r += tempData[idx];
            g += tempData[idx + 1];
            b += tempData[idx + 2];
            count++;
          }
        }
      }
      
      // Calculate average
      const targetIdx = (y * width + x) * 4;
      data[targetIdx] = r / count;
      data[targetIdx + 1] = g / count;
      data[targetIdx + 2] = b / count;
    }
  }
}

// Sharpen filter
function applySharpenFilter(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
  const tempData = new Uint8ClampedArray(data.length);
  tempData.set(data);
  
  // Sharpen kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  // Apply convolution
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const targetIdx = (y * width + x) * 4;
      
      let r = 0, g = 0, b = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          const idx = ((y + ky) * width + (x + kx)) * 4;
          
          r += tempData[idx] * kernel[kernelIdx];
          g += tempData[idx + 1] * kernel[kernelIdx];
          b += tempData[idx + 2] * kernel[kernelIdx];
        }
      }
      
      // Apply amount as a blend between original and sharpened
      const blend = amount / 100;
      data[targetIdx] = Math.min(255, Math.max(0, tempData[targetIdx] * (1 - blend) + r * blend));
      data[targetIdx + 1] = Math.min(255, Math.max(0, tempData[targetIdx + 1] * (1 - blend) + g * blend));
      data[targetIdx + 2] = Math.min(255, Math.max(0, tempData[targetIdx + 2] * (1 - blend) + b * blend));
    }
  }
}

// Grayscale filter
function applyGrayscaleFilter(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    // Skip fully transparent pixels
    if (data[i + 3] === 0) continue;
    
    // Calculate luminance
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    
    // Set RGB channels to the same value
    data[i] = luminance;
    data[i + 1] = luminance;
    data[i + 2] = luminance;
  }
}

// Invert filter
function applyInvertFilter(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    // Skip fully transparent pixels
    if (data[i + 3] === 0) continue;
    
    // Invert RGB channels
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
}

// Noise filter
function applyNoiseFilter(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
  const intensity = amount * 2.55; // Scale 0-100 to 0-255
  
  for (let i = 0; i < data.length; i += 4) {
    // Skip fully transparent pixels
    if (data[i + 3] === 0) continue;
    
    // Generate random noise value
    const noise = (Math.random() - 0.5) * intensity;
    
    // Apply noise to RGB channels
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
}

// Dither filter - simplified implementation
function applyDitherFilter(data: Uint8ClampedArray, width: number, height: number, threshold: number): void {
  // Convert to grayscale first
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    
    // Apply threshold to create binary image
    const newValue = gray < threshold ? 0 : 255;
    
    data[i] = newValue;
    data[i + 1] = newValue;
    data[i + 2] = newValue;
  }
}

// Texture filter - simplified implementation
function applyTextureFilter(data: Uint8ClampedArray, width: number, height: number, intensity: number): void {
  const tempData = new Uint8ClampedArray(data.length);
  tempData.set(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Generate a noise pattern based on position
      const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 10 * (intensity / 100);
      
      // Apply texture effect by slightly offsetting pixels
      const srcX = Math.min(width - 1, Math.max(0, Math.round(x + noise)));
      const srcY = Math.min(height - 1, Math.max(0, Math.round(y + noise)));
      const srcIdx = (srcY * width + srcX) * 4;
      
      data[idx] = tempData[srcIdx];
      data[idx + 1] = tempData[srcIdx + 1];
      data[idx + 2] = tempData[srcIdx + 2];
    }
  }
}

// Simplified Extrude filter for the worker
function applyExtrudeFilter(data: Uint8ClampedArray, width: number, height: number, blockSize: number, depth: number): void {
  // Save original data
  const originalData = new Uint8ClampedArray(data.length);
  originalData.set(data);
  
  // Process image in blocks
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      // Define the block boundaries
      const blockWidth = Math.min(blockSize, width - x);
      const blockHeight = Math.min(blockSize, height - y);
      
      // Skip if block is too small
      if (blockWidth < 2 || blockHeight < 2) continue;
      
      // Calculate average color for the block
      let sumR = 0, sumG = 0, sumB = 0, pixelCount = 0;
      
      for (let by = 0; by < blockHeight; by++) {
        for (let bx = 0; bx < blockWidth; bx++) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          sumR += originalData[idx];
          sumG += originalData[idx + 1];
          sumB += originalData[idx + 2];
          pixelCount++;
        }
      }
      
      // Average color
      const avgR = Math.round(sumR / pixelCount);
      const avgG = Math.round(sumG / pixelCount);
      const avgB = Math.round(sumB / pixelCount);
      
      // Calculate brightness (0-255)
      const brightness = Math.round(0.299 * avgR + 0.587 * avgG + 0.114 * avgB);
      
      // Map brightness to extrusion height (0-depth)
      const extrusionHeight = Math.round((brightness / 255) * depth);
      
      // Simple implementation: apply darker color based on extrusion height
      const shadowFactor = 1 - extrusionHeight / depth / 2;
      const darkR = Math.round(avgR * shadowFactor);
      const darkG = Math.round(avgG * shadowFactor);
      const darkB = Math.round(avgB * shadowFactor);
      
      // Fill the block with the darker color
      for (let by = 0; by < blockHeight; by++) {
        for (let bx = 0; bx < blockWidth; bx++) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          data[idx] = darkR;
          data[idx + 1] = darkG;
          data[idx + 2] = darkB;
        }
      }
    }
  }
}

// Wave filter
function applyWaveFilter(data: Uint8ClampedArray, width: number, height: number, amplitude: number): void {
  const tempData = new Uint8ClampedArray(data.length);
  tempData.set(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate distortion
      const distortionX = Math.sin(y * 0.1) * amplitude;
      const distortionY = Math.cos(x * 0.1) * amplitude;
      
      // Get source pixel coordinates with wave distortion
      const srcX = Math.min(width - 1, Math.max(0, Math.round(x + distortionX)));
      const srcY = Math.min(height - 1, Math.max(0, Math.round(y + distortionY)));
      
      // Copy the source pixel to the destination
      const destIdx = (y * width + x) * 4;
      const srcIdx = (srcY * width + srcX) * 4;
      
      data[destIdx] = tempData[srcIdx];
      data[destIdx + 1] = tempData[srcIdx + 1];
      data[destIdx + 2] = tempData[srcIdx + 2];
    }
  }
}

// Pixelate filter
function applyPixelateFilter(data: Uint8ClampedArray, width: number, height: number, pixelSize: number): void {
  // Skip if pixel size is too small
  if (pixelSize <= 1) return;
  
  const tempData = new Uint8ClampedArray(data.length);
  tempData.set(data);
  
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      // Calculate block dimensions
      const blockWidth = Math.min(pixelSize, width - x);
      const blockHeight = Math.min(pixelSize, height - y);
      
      // Skip small blocks
      if (blockWidth < 1 || blockHeight < 1) continue;
      
      // Calculate average color for the block
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      
      for (let by = 0; by < blockHeight; by++) {
        for (let bx = 0; bx < blockWidth; bx++) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          sumR += tempData[idx];
          sumG += tempData[idx + 1];
          sumB += tempData[idx + 2];
          count++;
        }
      }
      
      // Calculate average color
      const avgR = Math.round(sumR / count);
      const avgG = Math.round(sumG / count);
      const avgB = Math.round(sumB / count);
      
      // Apply average color to all pixels in the block
      for (let by = 0; by < blockHeight; by++) {
        for (let bx = 0; bx < blockWidth; bx++) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          data[idx] = avgR;
          data[idx + 1] = avgG;
          data[idx + 2] = avgB;
        }
      }
    }
  }
}

// Find Edges filter - simplified version
function applyFindEdgesFilter(data: Uint8ClampedArray, width: number, height: number): void {
  // Convert to grayscale first
  const grayData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    grayData[i] = grayData[i + 1] = grayData[i + 2] = gray;
    grayData[i + 3] = data[i + 3];
  }
  
  // Sobel operator kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  // Apply Sobel operator to detect edges
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      // Apply convolution
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          const idx = ((y + ky) * width + (x + kx)) * 4;
          
          gx += grayData[idx] * sobelX[kernelIdx];
          gy += grayData[idx] * sobelY[kernelIdx];
        }
      }
      
      // Calculate gradient magnitude
      const g = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      
      // Invert the result to get white edges on black background
      const targetIdx = (y * width + x) * 4;
      data[targetIdx] = data[targetIdx + 1] = data[targetIdx + 2] = 255 - g;
    }
  }
}

// Glow filter - simplified version
function applyGlowFilter(data: Uint8ClampedArray, width: number, height: number, radius: number): void {
  // Extract highlights (bright areas)
  const highlightData = new Uint8ClampedArray(data.length);
  
  for (let i = 0; i < data.length; i += 4) {
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    
    if (brightness > 200) {
      highlightData[i] = data[i];
      highlightData[i + 1] = data[i + 1];
      highlightData[i + 2] = data[i + 2];
      highlightData[i + 3] = data[i + 3];
    } else {
      highlightData[i] = 0;
      highlightData[i + 1] = 0;
      highlightData[i + 2] = 0;
      highlightData[i + 3] = 0;
    }
  }
  
  // Blur the highlights
  const blurredData = new Uint8ClampedArray(data.length);
  blurredData.set(highlightData);
  
  // Apply box blur multiple times for better effect
  for (let n = 0; n < 3; n++) {
    const tempData = new Uint8ClampedArray(blurredData.length);
    tempData.set(blurredData);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const pixelX = Math.min(width - 1, Math.max(0, x + kx));
            const pixelY = Math.min(height - 1, Math.max(0, y + ky));
            const idx = (pixelY * width + pixelX) * 4;
            
            r += tempData[idx];
            g += tempData[idx + 1];
            b += tempData[idx + 2];
            a += tempData[idx + 3];
            count++;
          }
        }
        
        // Apply blur
        const targetIdx = (y * width + x) * 4;
        blurredData[targetIdx] = r / count;
        blurredData[targetIdx + 1] = g / count;
        blurredData[targetIdx + 2] = b / count;
        blurredData[targetIdx + 3] = a / count;
      }
    }
  }
  
  // Blend the blurred highlights with original image (screen blend mode)
  for (let i = 0; i < data.length; i += 4) {
    // Screen blend: 1 - (1 - a) * (1 - b)
    data[i] = Math.min(255, data[i] + blurredData[i] - (data[i] * blurredData[i]) / 255);
    data[i + 1] = Math.min(255, data[i + 1] + blurredData[i + 1] - (data[i + 1] * blurredData[i + 1]) / 255);
    data[i + 2] = Math.min(255, data[i + 2] + blurredData[i + 2] - (data[i + 2] * blurredData[i + 2]) / 255);
  }
}

// Halftone filter - simplified version
function applyHalftoneFilter(data: Uint8ClampedArray, width: number, height: number, gridSize: number): void {
  // Create a temporary array to hold the original data
  const tempData = new Uint8ClampedArray(data.length);
  tempData.set(data);
  
  // Fill the data with white (255)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = 255;
  }
  
  // Process the image in grid cells
  for (let y = 0; y < height; y += gridSize) {
    for (let x = 0; x < width; x += gridSize) {
      // Define grid cell boundaries
      const cellWidth = Math.min(gridSize, width - x);
      const cellHeight = Math.min(gridSize, height - y);
      
      // Skip if cell is too small
      if (cellWidth < 1 || cellHeight < 1) continue;
      
      // Calculate average brightness in the cell
      let brightness = 0;
      let pixelCount = 0;
      
      for (let cy = 0; cy < cellHeight; cy++) {
        for (let cx = 0; cx < cellWidth; cx++) {
          const idx = ((y + cy) * width + (x + cx)) * 4;
          brightness += (tempData[idx] + tempData[idx + 1] + tempData[idx + 2]) / 3;
          pixelCount++;
        }
      }
      
      brightness /= pixelCount; // 0-255
      
      // Map brightness to dot radius (0-gridSize/2)
      const dotRadius = Math.round((1 - brightness / 255) * gridSize / 2);
      
      // Draw a black dot at the center of the cell
      if (dotRadius > 0) {
        const centerX = x + Math.floor(cellWidth / 2);
        const centerY = y + Math.floor(cellHeight / 2);
        
        for (let cy = -dotRadius; cy <= dotRadius; cy++) {
          for (let cx = -dotRadius; cx <= dotRadius; cx++) {
            const dist = Math.sqrt(cx * cx + cy * cy);
            
            if (dist <= dotRadius) {
              const pixelX = centerX + cx;
              const pixelY = centerY + cy;
              
              // Ensure pixel is within image bounds
              if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                const idx = (pixelY * width + pixelX) * 4;
                data[idx] = data[idx + 1] = data[idx + 2] = 0; // Black dot
              }
            }
          }
        }
      }
    }
  }
}

// Worker export
export default {} as typeof Worker & { new(): Worker };