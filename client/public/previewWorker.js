/**
 * previewWorker.js
 * 
 * Web Worker for offscreen canvas rendering of node thumbnails
 * Inspired by Filter Forge's approach to efficient filter previews
 */

// Cache of canvas contexts by node ID
const canvasContexts = new Map();

// Function to apply filter effects to canvas context
function applyFilter(ctx, params, filterType) {
  const { width, height } = ctx.canvas;
  
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
  // Get parameters or use defaults
  const intensity = params.intensity !== undefined ? params.intensity : 1.0;
  
  // Apply different filter effects based on type
  switch (filterType) {
    case 'blur':
      // Simple box blur implementation
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      const tempPixels = new Uint8ClampedArray(pixels);
      const radius = Math.max(1, Math.min(20, intensity * 10));
      
      // Horizontal blur pass
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0, g = 0, b = 0, a = 0, count = 0;
          
          for (let i = -radius; i <= radius; i++) {
            if (x + i < 0 || x + i >= width) continue;
            
            const idx = ((y * width) + (x + i)) * 4;
            r += tempPixels[idx];
            g += tempPixels[idx + 1];
            b += tempPixels[idx + 2];
            a += tempPixels[idx + 3];
            count++;
          }
          
          const idx = ((y * width) + x) * 4;
          pixels[idx] = r / count;
          pixels[idx + 1] = g / count;
          pixels[idx + 2] = b / count;
          pixels[idx + 3] = a / count;
        }
      }
      
      // Vertical blur pass
      tempPixels.set(pixels);
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          let r = 0, g = 0, b = 0, a = 0, count = 0;
          
          for (let i = -radius; i <= radius; i++) {
            if (y + i < 0 || y + i >= height) continue;
            
            const idx = (((y + i) * width) + x) * 4;
            r += tempPixels[idx];
            g += tempPixels[idx + 1];
            b += tempPixels[idx + 2];
            a += tempPixels[idx + 3];
            count++;
          }
          
          const idx = ((y * width) + x) * 4;
          pixels[idx] = r / count;
          pixels[idx + 1] = g / count;
          pixels[idx + 2] = b / count;
          pixels[idx + 3] = a / count;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      break;
      
    case 'sharpen':
      // Simple unsharp mask
      const sharpImgData = ctx.getImageData(0, 0, width, height);
      const sharpPixels = sharpImgData.data;
      
      // Create a blurred copy for the unsharp mask
      const blurredCopy = new Uint8ClampedArray(sharpPixels);
      
      // Apply simple box blur
      const blurRadius = 1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0, g = 0, b = 0, count = 0;
          
          for (let ky = -blurRadius; ky <= blurRadius; ky++) {
            for (let kx = -blurRadius; kx <= blurRadius; kx++) {
              const px = x + kx;
              const py = y + ky;
              
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = ((py * width) + px) * 4;
                r += sharpPixels[idx];
                g += sharpPixels[idx + 1];
                b += sharpPixels[idx + 2];
                count++;
              }
            }
          }
          
          const blurIdx = ((y * width) + x) * 4;
          blurredCopy[blurIdx] = r / count;
          blurredCopy[blurIdx + 1] = g / count;
          blurredCopy[blurIdx + 2] = b / count;
        }
      }
      
      // Apply unsharp mask
      const amount = intensity * 1.5;
      for (let i = 0; i < sharpPixels.length; i += 4) {
        sharpPixels[i] = Math.min(255, Math.max(0, sharpPixels[i] + (sharpPixels[i] - blurredCopy[i]) * amount));
        sharpPixels[i + 1] = Math.min(255, Math.max(0, sharpPixels[i + 1] + (sharpPixels[i + 1] - blurredCopy[i + 1]) * amount));
        sharpPixels[i + 2] = Math.min(255, Math.max(0, sharpPixels[i + 2] + (sharpPixels[i + 2] - blurredCopy[i + 2]) * amount));
      }
      
      ctx.putImageData(sharpImgData, 0, 0);
      break;
      
    case 'grayscale':
      const grayImgData = ctx.getImageData(0, 0, width, height);
      const grayPixels = grayImgData.data;
      
      for (let i = 0; i < grayPixels.length; i += 4) {
        const gray = (grayPixels[i] * 0.3 + grayPixels[i + 1] * 0.59 + grayPixels[i + 2] * 0.11);
        
        const mix = intensity; // Use intensity as mix factor
        grayPixels[i] = grayPixels[i] * (1 - mix) + gray * mix;
        grayPixels[i + 1] = grayPixels[i + 1] * (1 - mix) + gray * mix;
        grayPixels[i + 2] = grayPixels[i + 2] * (1 - mix) + gray * mix;
      }
      
      ctx.putImageData(grayImgData, 0, 0);
      break;
      
    case 'invert':
      const invertImgData = ctx.getImageData(0, 0, width, height);
      const invertPixels = invertImgData.data;
      
      for (let i = 0; i < invertPixels.length; i += 4) {
        // Mix between original and inverted based on intensity
        invertPixels[i] = invertPixels[i] * (1 - intensity) + (255 - invertPixels[i]) * intensity;
        invertPixels[i + 1] = invertPixels[i + 1] * (1 - intensity) + (255 - invertPixels[i + 1]) * intensity;
        invertPixels[i + 2] = invertPixels[i + 2] * (1 - intensity) + (255 - invertPixels[i + 2]) * intensity;
      }
      
      ctx.putImageData(invertImgData, 0, 0);
      break;
      
    case 'noise':
      const noiseImgData = ctx.getImageData(0, 0, width, height);
      const noisePixels = noiseImgData.data;
      
      // Generate noise
      const noiseAmount = intensity * 50;
      
      for (let i = 0; i < noisePixels.length; i += 4) {
        // Generate random noise value
        const noise = (Math.random() * 2 - 1) * noiseAmount;
        
        // Apply noise to RGB channels
        noisePixels[i] = Math.min(255, Math.max(0, noisePixels[i] + noise));
        noisePixels[i + 1] = Math.min(255, Math.max(0, noisePixels[i + 1] + noise));
        noisePixels[i + 2] = Math.min(255, Math.max(0, noisePixels[i + 2] + noise));
      }
      
      ctx.putImageData(noiseImgData, 0, 0);
      break;
      
    case 'dither': 
      const ditherImgData = ctx.getImageData(0, 0, width, height);
      const ditherPixels = ditherImgData.data;
      
      // Floyd-Steinberg dithering with intensity control
      const levels = Math.max(2, Math.floor(8 - intensity * 7)); // Higher intensity = fewer levels
      const quantError = new Float32Array(width * height * 3);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const qIdx = (y * width + x) * 3;
          
          // Original value + dithering error from previous pixels
          let r = ditherPixels[idx] + quantError[qIdx];
          let g = ditherPixels[idx + 1] + quantError[qIdx + 1];
          let b = ditherPixels[idx + 2] + quantError[qIdx + 2];
          
          // Quantize to levels
          const r2 = Math.round(r / 255 * (levels - 1)) * (255 / (levels - 1));
          const g2 = Math.round(g / 255 * (levels - 1)) * (255 / (levels - 1));
          const b2 = Math.round(b / 255 * (levels - 1)) * (255 / (levels - 1));
          
          // Mixed based on intensity (allowing a subtle effect)
          const mix = Math.min(1, intensity * 1.5);
          ditherPixels[idx] = r * (1 - mix) + r2 * mix;
          ditherPixels[idx + 1] = g * (1 - mix) + g2 * mix;
          ditherPixels[idx + 2] = b * (1 - mix) + b2 * mix;
          
          // Calculate quantization error
          const errR = r - r2;
          const errG = g - g2;
          const errB = b - b2;
          
          // Distribute error to neighboring pixels
          if (x < width - 1) {
            quantError[qIdx + 3] += errR * 7 / 16;
            quantError[qIdx + 4] += errG * 7 / 16;
            quantError[qIdx + 5] += errB * 7 / 16;
          }
          
          if (y < height - 1) {
            if (x > 0) {
              quantError[qIdx + 3 * width - 3] += errR * 3 / 16;
              quantError[qIdx + 3 * width - 2] += errG * 3 / 16;
              quantError[qIdx + 3 * width - 1] += errB * 3 / 16;
            }
            
            quantError[qIdx + 3 * width] += errR * 5 / 16;
            quantError[qIdx + 3 * width + 1] += errG * 5 / 16;
            quantError[qIdx + 3 * width + 2] += errB * 5 / 16;
            
            if (x < width - 1) {
              quantError[qIdx + 3 * width + 3] += errR * 1 / 16;
              quantError[qIdx + 3 * width + 4] += errG * 1 / 16;
              quantError[qIdx + 3 * width + 5] += errB * 1 / 16;
            }
          }
        }
      }
      
      ctx.putImageData(ditherImgData, 0, 0);
      break;
        
    // Add more filter implementations as needed
    default:
      // For unknown filter types, just draw a colored rectangle to show it's working
      ctx.fillStyle = `rgba(255, 100, 100, ${intensity})`;
      ctx.fillRect(0, 0, width, height);
      break;
  }
}

// Handle messages from the main thread
self.onmessage = async function(e) {
  const { canvas, nodeId, filterType, params, sourceImageData } = e.data;
  
  // If we received a canvas, store its context
  if (canvas) {
    const ctx = canvas.getContext('2d');
    canvasContexts.set(nodeId, { ctx, nodeCanvas: canvas });
  }
  
  // Get the context for this node
  const contextData = canvasContexts.get(nodeId);
  if (!contextData) {
    self.postMessage({ error: `No canvas found for node ${nodeId}` });
    return;
  }
  
  const { ctx, nodeCanvas } = contextData;
  
  try {
    // If we have source image data, draw it to the canvas
    if (sourceImageData) {
      const imageData = new ImageData(
        new Uint8ClampedArray(sourceImageData.data),
        sourceImageData.width,
        sourceImageData.height
      );
      ctx.putImageData(imageData, 0, 0);
    }
    
    // Apply the filter
    applyFilter(ctx, params || {}, filterType);
    
    // Create an ImageBitmap from the canvas
    const bitmap = await nodeCanvas.transferToImageBitmap();
    
    // Send the result back to the main thread
    self.postMessage({ nodeId, bitmap }, [bitmap]);
  } catch (err) {
    self.postMessage({ nodeId, error: err.message });
  }
};