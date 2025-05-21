// Filter settings definitions
export function getFilterSettings(filterType) {
  switch (filterType) {
    case 'blur':
      return [
        {
          name: 'radius',
          label: 'Radius',
          type: 'range',
          defaultValue: 5,
          min: 0,
          max: 20,
          step: 0.5
        }
      ];
    case 'noise':
      return [
        {
          name: 'amount',
          label: 'Amount',
          type: 'range',
          defaultValue: 20,
          min: 0,
          max: 100,
          step: 1
        },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          defaultValue: 'Perlin',
          options: ['Perlin', 'Gaussian', 'Uniform']
        }
      ];
    case 'sharpen':
      return [
        {
          name: 'amount',
          label: 'Amount',
          type: 'range',
          defaultValue: 50,
          min: 0,
          max: 100,
          step: 1
        }
      ];
    case 'grayscale':
      return [
        {
          name: 'intensity',
          label: 'Intensity',
          type: 'range',
          defaultValue: 100,
          min: 0,
          max: 100,
          step: 1
        }
      ];
    case 'invert':
      return [
        {
          name: 'intensity',
          label: 'Intensity',
          type: 'range',
          defaultValue: 100,
          min: 0,
          max: 100,
          step: 1
        }
      ];
    case 'dither':
      return [
        {
          name: 'threshold',
          label: 'Threshold',
          type: 'range',
          defaultValue: 128,
          min: 0,
          max: 255,
          step: 1
        },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          defaultValue: 'Floyd-Steinberg',
          options: ['Floyd-Steinberg', 'Bayer', 'Ordered']
        }
      ];
    case 'pixelate':
      return [
        {
          name: 'size',
          label: 'Pixel Size',
          type: 'range',
          defaultValue: 8,
          min: 2,
          max: 32,
          step: 1
        }
      ];
    // Add more filter types as needed
    default:
      return [];
  }
}

// Each filter has its own implementation
export async function applyFilter(
  imageDataUrl,
  filterType,
  settings
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Create a canvas to process the image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Apply the appropriate filter based on type
      switch (filterType) {
        case 'blur':
          applyBlurFilter(ctx, canvas.width, canvas.height, settings);
          break;
        case 'noise':
          applyNoiseFilter(ctx, canvas.width, canvas.height, settings);
          break;
        case 'sharpen':
          applySharpenFilter(ctx, canvas.width, canvas.height, settings);
          break;
        case 'grayscale':
          applyGrayscaleFilter(ctx, canvas.width, canvas.height, settings);
          break;
        case 'invert':
          applyInvertFilter(ctx, canvas.width, canvas.height, settings);
          break;
        case 'dither':
          applyDitherFilter(ctx, canvas.width, canvas.height, settings);
          break;
        case 'pixelate':
          applyPixelateFilter(ctx, canvas.width, canvas.height, settings);
          break;
        // Add more filter implementations as needed
      }
      
      // Return the processed image as a data URL
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageDataUrl;
  });
}

// Filter implementation functions
function applyBlurFilter(ctx, width, height, settings) {
  // Use the radius from settings, or fallback to default
  const radius = settings.radius || 5;
  
  // Apply the filter with the current setting value
  ctx.filter = `blur(${radius}px)`;
  
  // We need to draw the image again with the filter applied
  const imageData = ctx.getImageData(0, 0, width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.putImageData(imageData, 0, 0);
  ctx.drawImage(ctx.canvas, 0, 0);
  
  // Reset filter for subsequent operations
  ctx.filter = 'none';
}

function applyNoiseFilter(ctx, width, height, settings) {
  // Get settings or use defaults
  const amount = settings.amount || 20;
  const noiseType = settings.type || 'Perlin';
  
  // Get the image data to manipulate
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Apply noise based on the type
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
    // Perlin noise implementation
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Simplified perlin-like noise
        const noise = perlinNoise(x, y) * amount;
        
        // Apply noise
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
    }
  }
  
  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
}

// Simple perlin-like noise function
function perlinNoise(x, y) {
  // This is a very simple approximation
  return Math.sin(x/10) * Math.cos(y/10) * 20;
}

function applySharpenFilter(ctx, width, height, settings) {
  // Get the amount from settings or use default
  const amount = settings.amount || 50;
  
  // Create a temporary canvas for processing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Copy the original image
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  // Apply a sharpening convolution
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const factor = amount / 100 * 2; // Convert to a reasonable factor
  
  // Simple sharpening kernel
  // [  0, -1,  0 ]
  // [ -1,  5, -1 ]
  // [  0, -1,  0 ]
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const centerPos = (y * width + x) * 4;
      const leftPos = (y * width + (x - 1)) * 4;
      const rightPos = (y * width + (x + 1)) * 4;
      const topPos = ((y - 1) * width + x) * 4;
      const bottomPos = ((y + 1) * width + x) * 4;
      
      for (let c = 0; c < 3; c++) {
        const center = data[centerPos + c];
        const left = data[leftPos + c];
        const right = data[rightPos + c];
        const top = data[topPos + c];
        const bottom = data[bottomPos + c];
        
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
  // Get intensity from settings or use default
  const intensity = settings.intensity || 100;
  
  // Get the image data to manipulate
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
  // Get intensity from settings or use default
  const intensity = settings.intensity || 100;
  
  // Get the image data to manipulate
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

function applyDitherFilter(ctx, width, height, settings) {
  // Get settings or use defaults
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
    // Implement other dithering algorithms (Bayer, Ordered, etc.)
    // This is a simplified placeholder
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i];
      const newValue = gray < threshold ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = newValue;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function applyPixelateFilter(ctx, width, height, settings) {
  // Get pixel size from settings or use default
  const pixelSize = settings.size || 8;
  
  // Create a temporary canvas for processing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Draw the original image
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  // Clear the original canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw pixelated version
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      // Limit the rectangle to the canvas boundaries
      const pWidth = Math.min(pixelSize, width - x);
      const pHeight = Math.min(pixelSize, height - y);
      
      // Get the average color of the pixel block
      const pixelData = tempCtx.getImageData(x, y, pWidth, pHeight).data;
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