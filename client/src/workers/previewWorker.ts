/**
 * previewWorker.ts
 * 
 * Web Worker for efficient preview rendering using OffscreenCanvas.
 * 
 * This worker receives an OffscreenCanvas and filter parameters,
 * processes the image with the requested filters, and returns
 * the result as an ImageBitmap.
 */

interface FilterParam {
  id: string;
  name: string;
  type: 'range' | 'select' | 'color' | 'checkbox';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

interface WorkerMessage {
  offscreen: OffscreenCanvas;
  nodeId: string;
  filterType: string;
  params: FilterParam[];
  sourceImageData?: ImageBitmap;
}

self.onmessage = async ({ data }: MessageEvent<WorkerMessage>) => {
  const { offscreen, nodeId, filterType, params, sourceImageData } = data;
  
  try {
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2d context from offscreen canvas');
    }
    
    // Clear the canvas
    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    
    // If we have source image data, draw it
    if (sourceImageData) {
      ctx.drawImage(sourceImageData, 0, 0, offscreen.width, offscreen.height);
    }
    
    // Get the image data from the canvas
    const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    
    // Apply the filter based on the filter type
    switch (filterType) {
      case 'brightness':
        applyBrightnessFilter(imageData.data, params);
        break;
      case 'contrast':
        applyContrastFilter(imageData.data, params);
        break;
      case 'grayscale':
        applyGrayscaleFilter(imageData.data, params);
        break;
      case 'invert':
        applyInvertFilter(imageData.data, params);
        break;
      case 'sepia':
        applySepiaFilter(imageData.data, params);
        break;
      case 'noise':
        applyNoiseFilter(imageData.data, params);
        break;
      // Add more filters as needed
    }
    
    // Put the processed data back onto the canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Create a bitmap from the canvas and transfer it back to the main thread
    const bitmap = await offscreen.transferToImageBitmap();
    self.postMessage({ nodeId, bitmap }, [bitmap as any]);
  } catch (error) {
    self.postMessage({ 
      nodeId, 
      error: error instanceof Error ? error.message : 'Unknown error in worker' 
    });
  }
};

// Filter implementations
function applyBrightnessFilter(data: Uint8ClampedArray, params: FilterParam[]) {
  const brightnessParam = params.find(p => p.id === 'brightness');
  const brightness = brightnessParam ? brightnessParam.value : 0;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + brightness));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness));
  }
}

function applyContrastFilter(data: Uint8ClampedArray, params: FilterParam[]) {
  const contrastParam = params.find(p => p.id === 'contrast');
  const contrast = contrastParam ? contrastParam.value : 0;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
  }
}

function applyGrayscaleFilter(data: Uint8ClampedArray, params: FilterParam[]) {
  const intensityParam = params.find(p => p.id === 'intensity');
  const intensity = intensityParam ? intensityParam.value / 100 : 1;
  
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = data[i] * (1 - intensity) + avg * intensity;
    data[i + 1] = data[i + 1] * (1 - intensity) + avg * intensity;
    data[i + 2] = data[i + 2] * (1 - intensity) + avg * intensity;
  }
}

function applyInvertFilter(data: Uint8ClampedArray, params: FilterParam[]) {
  const intensityParam = params.find(p => p.id === 'intensity');
  const intensity = intensityParam ? intensityParam.value / 100 : 1;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] * (1 - intensity) + (255 - data[i]) * intensity;
    data[i + 1] = data[i + 1] * (1 - intensity) + (255 - data[i + 1]) * intensity;
    data[i + 2] = data[i + 2] * (1 - intensity) + (255 - data[i + 2]) * intensity;
  }
}

function applySepiaFilter(data: Uint8ClampedArray, params: FilterParam[]) {
  const intensityParam = params.find(p => p.id === 'intensity');
  const intensity = intensityParam ? intensityParam.value / 100 : 1;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const tr = 0.393 * r + 0.769 * g + 0.189 * b;
    const tg = 0.349 * r + 0.686 * g + 0.168 * b;
    const tb = 0.272 * r + 0.534 * g + 0.131 * b;
    
    data[i] = r * (1 - intensity) + tr * intensity;
    data[i + 1] = g * (1 - intensity) + tg * intensity;
    data[i + 2] = b * (1 - intensity) + tb * intensity;
  }
}

function applyNoiseFilter(data: Uint8ClampedArray, params: FilterParam[]) {
  const amountParam = params.find(p => p.id === 'amount');
  const amount = amountParam ? amountParam.value : 20;
  
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() > 0.5) {
      const noise = (Math.random() - 0.5) * amount;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
  }
}