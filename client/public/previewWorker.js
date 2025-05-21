// previewWorker.js - Web Worker for image filter processing
// This runs in a separate thread to keep the UI responsive

// Handle messages from the main thread
self.onmessage = function(e) {
  const { nodeId, imageDataUrl, filterType, settings } = e.data;
  
  if (!nodeId || !imageDataUrl) {
    self.postMessage({ error: 'Missing required parameters', nodeId });
    return;
  }
  
  // Process the image
  processImage(nodeId, imageDataUrl, filterType, settings);
};

// Main image processing function
function processImage(nodeId, imageDataUrl, filterType, settings) {
  try {
    // Create an image from the data URL
    const img = new Image();
    
    img.onload = function() {
      try {
        // Create a canvas to process the image
        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          self.postMessage({ error: 'Could not get canvas context', nodeId });
          return;
        }
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Apply the filter
        if (filterType && filterFunctions[filterType]) {
          filterFunctions[filterType](ctx, img.width, img.height, settings);
        }
        
        // Convert the canvas to a data URL
        canvas.convertToBlob().then(blob => {
          const reader = new FileReader();
          reader.onloadend = function() {
            // Send the processed image back to the main thread
            self.postMessage({
              nodeId,
              imageDataUrl: reader.result
            });
          };
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        self.postMessage({ error: `Canvas processing error: ${err.message}`, nodeId });
      }
    };
    
    img.onerror = function() {
      self.postMessage({ error: 'Failed to load image', nodeId });
    };
    
    // Load the image
    img.src = imageDataUrl;
    
  } catch (err) {
    self.postMessage({ error: `Processing error: ${err.message}`, nodeId });
  }
}

// Filter implementation functions
const filterFunctions = {
  blur: applyBlurFilter,
  sharpen: applySharpenFilter,
  grayscale: applyGrayscaleFilter,
  invert: applyInvertFilter,
  noise: applyNoiseFilter,
  dither: applyDitherFilter,
  pixelate: applyPixelateFilter
};

// Apply a filter to the canvas context
function applyFilter(ctx, params, filterType) {
  if (filterFunctions[filterType]) {
    filterFunctions[filterType](ctx, ctx.canvas.width, ctx.canvas.height, params);
  }
}

// Filter implementations
function applyBlurFilter(ctx, width, height, settings) {
  const radius = settings.radius || 5;
  
  // Save the original image data
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // Apply blur using a simple box blur algorithm
  const tmpCanvas = new OffscreenCanvas(width, height);
  const tmpCtx = tmpCanvas.getContext('2d');
  tmpCtx.putImageData(imageData, 0, 0);
  
  // Use a built-in filter if available
  ctx.filter = `blur(${radius}px)`;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tmpCanvas, 0, 0);
  ctx.filter = 'none';
}

function applySharpenFilter(ctx, width, height, settings) {
  const amount = settings.amount || 50;
  
  // Save the original image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const factor = amount / 100 * 2; // Convert to a reasonable factor
  
  // Create a temporary copy
  const tmpCanvas = new OffscreenCanvas(width, height);
  const tmpCtx = tmpCanvas.getContext('2d');
  tmpCtx.putImageData(imageData, 0, 0);
  const tmpData = tmpCtx.getImageData(0, 0, width, height).data;
  
  // Apply a simple sharpening convolution
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const centerPos = (y * width + x) * 4;
      const leftPos = (y * width + (x - 1)) * 4;
      const rightPos = (y * width + (x + 1)) * 4;
      const topPos = ((y - 1) * width + x) * 4;
      const bottomPos = ((y + 1) * width + x) * 4;
      
      for (let c = 0; c < 3; c++) {
        const center = tmpData[centerPos + c];
        const left = tmpData[leftPos + c];
        const right = tmpData[rightPos + c];
        const top = tmpData[topPos + c];
        const bottom = tmpData[bottomPos + c];
        
        // Apply sharpening formula with factor
        const sharpened = center * (1 + 4 * factor) - 
                        (left + right + top + bottom) * factor;
                        
        data[centerPos + c] = Math.min(255, Math.max(0, sharpened));
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function applyGrayscaleFilter(ctx, width, height, settings) {
  const intensity = settings.intensity || 100;
  
  // Get the image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const factor = intensity / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    // Standard grayscale conversion
    const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    
    // Apply grayscale with intensity factor
    data[i] = data[i] * (1 - factor) + gray * factor;
    data[i + 1] = data[i + 1] * (1 - factor) + gray * factor;
    data[i + 2] = data[i + 2] * (1 - factor) + gray * factor;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function applyInvertFilter(ctx, width, height, settings) {
  const intensity = settings.intensity || 100;
  
  // Get the image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const factor = intensity / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    // Invert with intensity factor
    data[i] = data[i] * (1 - factor) + (255 - data[i]) * factor;
    data[i + 1] = data[i + 1] * (1 - factor) + (255 - data[i + 1]) * factor;
    data[i + 2] = data[i + 2] * (1 - factor) + (255 - data[i + 2]) * factor;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function applyNoiseFilter(ctx, width, height, settings) {
  const amount = settings.amount || 20;
  const noiseType = settings.type || 'Perlin';
  
  // Get the image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  if (noiseType === 'Gaussian') {
    for (let i = 0; i < data.length; i += 4) {
      // Generate gaussian noise
      const noise = (Math.random() - 0.5) * amount;
      
      // Apply to RGB channels
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
  } else if (noiseType === 'Uniform') {
    for (let i = 0; i < data.length; i += 4) {
      // Generate uniform noise for each channel
      const noiseR = (Math.random() - 0.5) * amount;
      const noiseG = (Math.random() - 0.5) * amount;
      const noiseB = (Math.random() - 0.5) * amount;
      
      // Apply to RGB channels
      data[i] = Math.min(255, Math.max(0, data[i] + noiseR));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noiseG));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noiseB));
    }
  } else {
    // Simple Perlin-like noise
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Simplified perlin-like noise
        const noise = Math.sin(x/10) * Math.cos(y/10) * amount;
        
        // Apply noise
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function applyDitherFilter(ctx, width, height, settings) {
  const threshold = settings.threshold || 128;
  const ditherType = settings.type || 'Floyd-Steinberg';
  
  // Get the image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // First, convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  
  // Apply the selected dithering algorithm
  if (ditherType === 'Floyd-Steinberg') {
    // Floyd-Steinberg dithering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const oldPixel = data[idx];
        const newPixel = oldPixel < threshold ? 0 : 255;
        data[idx] = data[idx + 1] = data[idx + 2] = newPixel;
        
        const error = oldPixel - newPixel;
        
        // Distribute error to neighboring pixels
        if (x + 1 < width) {
          data[(y * width + x + 1) * 4] += error * 7 / 16;
          data[(y * width + x + 1) * 4 + 1] += error * 7 / 16;
          data[(y * width + x + 1) * 4 + 2] += error * 7 / 16;
        }
        
        if (y + 1 < height) {
          if (x - 1 >= 0) {
            data[((y + 1) * width + x - 1) * 4] += error * 3 / 16;
            data[((y + 1) * width + x - 1) * 4 + 1] += error * 3 / 16;
            data[((y + 1) * width + x - 1) * 4 + 2] += error * 3 / 16;
          }
          
          data[((y + 1) * width + x) * 4] += error * 5 / 16;
          data[((y + 1) * width + x) * 4 + 1] += error * 5 / 16;
          data[((y + 1) * width + x) * 4 + 2] += error * 5 / 16;
          
          if (x + 1 < width) {
            data[((y + 1) * width + x + 1) * 4] += error * 1 / 16;
            data[((y + 1) * width + x + 1) * 4 + 1] += error * 1 / 16;
            data[((y + 1) * width + x + 1) * 4 + 2] += error * 1 / 16;
          }
        }
      }
    }
  } else {
    // Simple threshold dithering for other types
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i];
      const newValue = gray < threshold ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = newValue;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function applyPixelateFilter(ctx, width, height, settings) {
  const pixelSize = settings.size || 8;
  
  // Get the original image data
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // Create a temporary canvas to work with
  const tmpCanvas = new OffscreenCanvas(width, height);
  const tmpCtx = tmpCanvas.getContext('2d');
  tmpCtx.putImageData(imageData, 0, 0);
  
  // Clear the original canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw pixelated version
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      // Limit the rectangle to the canvas boundaries
      const pWidth = Math.min(pixelSize, width - x);
      const pHeight = Math.min(pixelSize, height - y);
      
      // Get the pixel data
      const pixelData = tmpCtx.getImageData(x, y, pWidth, pHeight).data;
      
      // Calculate the average color
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let i = 0; i < pixelData.length; i += 4) {
        r += pixelData[i];
        g += pixelData[i + 1];
        b += pixelData[i + 2];
        a += pixelData[i + 3];
        count++;
      }
      
      // Calculate average
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      a = Math.round(a / count);
      
      // Draw the pixel rectangle with the average color
      ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
      ctx.fillRect(x, y, pWidth, pHeight);
    }
  }
}