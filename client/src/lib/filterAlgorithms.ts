import { Node, Edge } from 'reactflow';
import { FilterNodeData, FilterType, ImageNodeData } from '@/types';

// Helper function to find target nodes from a source node
const getTargetNodes = (sourceNodeId: string, nodes: Node[], edges: Edge[]): Node[] => {
  const connectedEdges = edges.filter(edge => edge.source === sourceNodeId);
  return connectedEdges.map(edge => 
    nodes.find(node => node.id === edge.target)
  ).filter((node): node is Node => !!node);
};

// Helper function to find source nodes for a target node
const getSourceNode = (targetNodeId: string, nodes: Node[], edges: Edge[]): Node | null => {
  const connectedEdge = edges.find(edge => edge.target === targetNodeId);
  if (!connectedEdge) return null;
  return nodes.find(node => node.id === connectedEdge.source) || null;
};

// Helper to get a path from source to a given node
const getPathToNode = (nodeId: string, nodes: Node[], edges: Edge[]): Node[] => {
  const path: Node[] = [];
  let currentNodeId = nodeId;
  
  // Prevent infinite loops
  const maxIterations = nodes.length;
  let iterations = 0;
  
  while (currentNodeId && iterations < maxIterations) {
    const node = nodes.find(n => n.id === currentNodeId);
    if (!node) break;
    
    path.unshift(node);
    
    const sourceNode = getSourceNode(currentNodeId, nodes, edges);
    if (!sourceNode) break;
    
    currentNodeId = sourceNode.id;
    iterations++;
  }
  
  return path;
};

// Main function to apply filters
export const applyFilters = (
  sourceImage: HTMLImageElement,
  nodes: Node[],
  edges: Edge[],
  canvas: HTMLCanvasElement,
  targetNodeId?: string
): string | null => {
  // Find the source node
  const sourceNode = nodes.find(node => node.type === 'imageNode');
  if (!sourceNode) return null;
  
  // If a target node is specified, get the path to it
  const nodesToProcess = targetNodeId 
    ? getPathToNode(targetNodeId, nodes, edges)
    : buildProcessingChain(sourceNode.id, nodes, edges);

  if (nodesToProcess.length === 0) return null;
  
  // Set up the canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  canvas.width = sourceImage.width;
  canvas.height = sourceImage.height;
  
  // Draw the source image
  ctx.drawImage(sourceImage, 0, 0);
  
  // Apply each filter in the chain
  for (let i = 1; i < nodesToProcess.length; i++) {
    const node = nodesToProcess[i];
    if (node.type !== 'filterNode') continue;
    
    const filterData = node.data as FilterNodeData;
    // Skip disabled filters
    if (!filterData.enabled) continue;
    
    applyFilter(filterData.filterType, ctx, canvas, filterData.params);
  }
  
  return canvas.toDataURL();
};

// Build a processing chain from source to all connected nodes
const buildProcessingChain = (sourceNodeId: string, nodes: Node[], edges: Edge[], visited: Set<string> = new Set()): Node[] => {
  const sourceNode = nodes.find(node => node.id === sourceNodeId);
  if (!sourceNode || visited.has(sourceNodeId)) return [];
  
  // Mark this node as visited to avoid cycles
  visited.add(sourceNodeId);
  
  const chain = [sourceNode];
  const targetNodes = getTargetNodes(sourceNodeId, nodes, edges);
  
  if (targetNodes.length === 0) return chain;
  
  // Process all branches from this node
  let allConnectedNodes: Node[] = [];
  
  for (const targetNode of targetNodes) {
    const nextNodes = buildProcessingChain(targetNode.id, nodes, edges, visited);
    allConnectedNodes = [...allConnectedNodes, ...nextNodes];
  }
  
  return [...chain, ...allConnectedNodes];
};

// Apply a specific filter based on type
const applyFilter = (
  filterType: FilterType,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  params: { name: string; value: number | string }[]
): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  switch (filterType) {
    case 'blur':
      applyBlurFilter(data, canvas.width, canvas.height, getParamValue(params, 'radius', 10));
      break;
    case 'sharpen':
      applySharpenFilter(data, canvas.width, canvas.height, getParamValue(params, 'amount', 50));
      break;
    case 'grayscale':
      applyGrayscaleFilter(data);
      break;
    case 'invert':
      applyInvertFilter(data);
      break;
    case 'noise':
      applyNoiseFilter(data, getParamValue(params, 'amount', 25));
      break;
    case 'dither':
      applyDitherFilter(data, canvas.width, canvas.height, params);
      break;
    case 'texture':
      applyTextureFilter(data, getParamValue(params, 'intensity', 30));
      break;
    case 'extrude':
      applyExtrudeFilter(data, canvas.width, canvas.height, getParamValue(params, 'depth', 10));
      break;
    case 'wave':
      applyWaveFilter(data, canvas.width, canvas.height, getParamValue(params, 'amplitude', 10));
      break;
    case 'pixelate':
      applyPixelateFilter(data, canvas.width, canvas.height, getParamValue(params, 'pixelSize', 8));
      break;
    case 'findEdges':
      applyFindEdgesFilter(data, canvas.width, canvas.height, params);
      break;
    case 'glow':
      applyGlowFilter(data, canvas.width, canvas.height, params);
      break;
  }
  
  ctx.putImageData(imageData, 0, 0);
};

// Helper to get parameter value with fallback
const getParamValue = (params: { name: string; value: number | string }[], name: string, defaultValue: number): number => {
  const param = params.find(p => p.name === name);
  return param ? Number(param.value) : defaultValue;
};

// Filter implementations

// Blur filter using box blur technique
function applyBlurFilter(data: Uint8ClampedArray, width: number, height: number, radius: number): void {
  // Simple box blur implementation
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  const tempImgData = tempCtx.createImageData(width, height);
  tempImgData.data.set(data);
  tempCtx.putImageData(tempImgData, 0, 0);
  
  // Apply horizontal blur
  const tempData = tempCtx.getImageData(0, 0, width, height).data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let i = -radius; i <= radius; i++) {
        const posX = Math.min(Math.max(x + i, 0), width - 1);
        const idx = (y * width + posX) * 4;
        
        r += tempData[idx];
        g += tempData[idx + 1];
        b += tempData[idx + 2];
        a += tempData[idx + 3];
        count++;
      }
      
      const outIdx = (y * width + x) * 4;
      data[outIdx] = r / count;
      data[outIdx + 1] = g / count;
      data[outIdx + 2] = b / count;
      data[outIdx + 3] = a / count;
    }
  }
  
  // Apply vertical blur
  tempCtx.putImageData(tempImgData, 0, 0);
  tempData.set(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let i = -radius; i <= radius; i++) {
        const posY = Math.min(Math.max(y + i, 0), height - 1);
        const idx = (posY * width + x) * 4;
        
        r += tempData[idx];
        g += tempData[idx + 1];
        b += tempData[idx + 2];
        a += tempData[idx + 3];
        count++;
      }
      
      const outIdx = (y * width + x) * 4;
      data[outIdx] = r / count;
      data[outIdx + 1] = g / count;
      data[outIdx + 2] = b / count;
      data[outIdx + 3] = a / count;
    }
  }
}

// Sharpen filter using simple convolution
function applySharpenFilter(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
  const factor = amount / 100;
  const tempData = new Uint8ClampedArray(data.length);
  tempData.set(data);
  
  // Apply sharpening convolution
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const centerIdx = (y * width + x) * 4;
      const topIdx = ((y - 1) * width + x) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;
      const bottomIdx = ((y + 1) * width + x) * 4;
      const leftIdx = (y * width + (x - 1)) * 4;
      
      for (let c = 0; c < 3; c++) {
        const val = (5 * tempData[centerIdx + c] - 
                    tempData[topIdx + c] - 
                    tempData[rightIdx + c] - 
                    tempData[bottomIdx + c] - 
                    tempData[leftIdx + c]) * factor + 
                    tempData[centerIdx + c];
        
        data[centerIdx + c] = Math.min(255, Math.max(0, val));
      }
    }
  }
}

// Grayscale filter
function applyGrayscaleFilter(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }
}

// Invert filter
function applyInvertFilter(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
}

// Noise filter
function applyNoiseFilter(data: Uint8ClampedArray, amount: number): void {
  const factor = amount / 100 * 255;
  
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() > 0.5) {
      const noise = (Math.random() - 0.5) * factor;
      
      for (let j = 0; j < 3; j++) {
        data[i + j] = Math.min(255, Math.max(0, data[i + j] + noise));
      }
    }
  }
}

// Enhanced dither filter with multiple algorithms and parameters based on detailed requirements
function applyDitherFilter(
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  params: any[] = []
): void {
  // Extract parameters
  const paramsObj: Record<string, any> = {};
  params.forEach(param => {
    paramsObj[param.name] = param.value;
  });

  const ditherType = paramsObj.ditherType || 'Floyd-Steinberg';
  const ditherSize = paramsObj.size !== undefined ? parseFloat(paramsObj.size) : 5;
  const brightness = paramsObj.brightness !== undefined ? parseInt(paramsObj.brightness) : 0;
  const contrast = paramsObj.contrast !== undefined ? parseInt(paramsObj.contrast) : 0;
  const threshold = paramsObj.threshold !== undefined ? parseInt(paramsObj.threshold) : 128;
  const noiseAmount = paramsObj.noise !== undefined ? parseInt(paramsObj.noise) : 0;
  const useGrayscale = paramsObj.useGrayscale === 'On';
  const applyGradient = paramsObj.applyGradient === 'On';
  
  // Create a temporary canvas for processing with ditherSize
  const tempCanvas = document.createElement('canvas');
  const effectiveWidth = Math.max(1, Math.floor(width / ditherSize));
  const effectiveHeight = Math.max(1, Math.floor(height / ditherSize));
  tempCanvas.width = effectiveWidth;
  tempCanvas.height = effectiveHeight;
  
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tempCtx) return;
  
  // Create an intermediate ImageData for processing
  const tempImageData = tempCtx.createImageData(effectiveWidth, effectiveHeight);
  const tempData = tempImageData.data;
  
  // Step 1: Downscale image based on ditherSize (spatial resolution control)
  // Sample pixels from the original data to the smaller canvas
  for (let y = 0; y < effectiveHeight; y++) {
    for (let x = 0; x < effectiveWidth; x++) {
      const targetIdx = (y * effectiveWidth + x) * 4;
      
      // Find the corresponding pixel in the original image
      const sourceX = Math.min(Math.floor(x * ditherSize), width - 1);
      const sourceY = Math.min(Math.floor(y * ditherSize), height - 1);
      const sourceIdx = (sourceY * width + sourceX) * 4;
      
      // Copy pixel values
      tempData[targetIdx] = data[sourceIdx];
      tempData[targetIdx + 1] = data[sourceIdx + 1];
      tempData[targetIdx + 2] = data[sourceIdx + 2];
      tempData[targetIdx + 3] = data[sourceIdx + 3];
    }
  }
  
  // Step 2: Apply brightness adjustment (linear shift)
  if (brightness !== 0) {
    for (let i = 0; i < tempData.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        // Direct addition as specified in requirements
        tempData[i + j] = Math.max(0, Math.min(255, tempData[i + j] + brightness));
      }
    }
  }
  
  // Step 3: Apply contrast adjustment (nonlinear amplification)
  if (contrast !== 0) {
    // Using the exact contrast formula as provided in the requirements
    for (let i = 0; i < tempData.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        // Apply the contrast formula: (pixel - 128) * (contrast+1) / 256 + 128
        const pixelValue = tempData[i + j];
        const newValue = ((pixelValue / 255 - 0.5) * (contrast / 100 + 1) + 0.5) * 255;
        tempData[i + j] = Math.max(0, Math.min(255, Math.round(newValue)));
      }
    }
  }
  
  // Step 4: Convert to grayscale if needed
  if (useGrayscale) {
    for (let i = 0; i < tempData.length; i += 4) {
      // Using proper luminance weights for grayscale conversion
      const gray = Math.round(0.299 * tempData[i] + 0.587 * tempData[i + 1] + 0.114 * tempData[i + 2]);
      tempData[i] = tempData[i + 1] = tempData[i + 2] = gray;
    }
  }
  
  // Step 5: Apply noise if specified
  if (noiseAmount > 0) {
    for (let i = 0; i < tempData.length; i += 4) {
      if (Math.random() > 0.5) { // Only apply to some pixels for more natural noise
        for (let j = 0; j < 3; j++) {
          // Apply noise proportional to the specified amount
          const noise = (Math.random() - 0.5) * 2 * noiseAmount; // Range: -noiseAmount to +noiseAmount
          tempData[i + j] = Math.max(0, Math.min(255, Math.round(tempData[i + j] + noise)));
        }
      }
    }
  }
  
  // Step 6: Apply dithering based on the selected algorithm
  switch (ditherType) {
    case 'Bayer 4x4':
      applyBayerDithering(tempData, effectiveWidth, effectiveHeight, 4, threshold);
      break;
    case 'Bayer 8x8':
      applyBayerDithering(tempData, effectiveWidth, effectiveHeight, 8, threshold);
      break;
    case 'Blue Noise':
      applyBlueNoiseDithering(tempData, effectiveWidth, effectiveHeight, threshold);
      break;
    case 'Floyd-Steinberg':
      applyErrorDiffusionDithering(tempData, effectiveWidth, effectiveHeight, 'floyd-steinberg', threshold, 1);
      break;
    case 'Sierra Lite':
      applyErrorDiffusionDithering(tempData, effectiveWidth, effectiveHeight, 'sierra-lite', threshold, 1);
      break;
    case 'Stucki Sharp':
      applyErrorDiffusionDithering(tempData, effectiveWidth, effectiveHeight, 'stucki', threshold, 1);
      break;
    case 'Burkes Flow':
      applyErrorDiffusionDithering(tempData, effectiveWidth, effectiveHeight, 'burkes', threshold, 1);
      break;
    case 'Stevenson-Arce':
      applyErrorDiffusionDithering(tempData, effectiveWidth, effectiveHeight, 'stevenson-arce', threshold, 1);
      break;
    case 'Fan Spread Pro':
      applyErrorDiffusionDithering(tempData, effectiveWidth, effectiveHeight, 'fan', threshold, 1);
      break;
    case 'Atkinson':
      applyErrorDiffusionDithering(tempData, effectiveWidth, effectiveHeight, 'atkinson', threshold, 1);
      break;
    case 'Jarvis':
      applyErrorDiffusionDithering(tempData, effectiveWidth, effectiveHeight, 'jarvis', threshold, 1);
      break;
    default:
      applyErrorDiffusionDithering(tempData, effectiveWidth, effectiveHeight, 'floyd-steinberg', threshold, 1);
  }
  
  // Step 7: Apply gradient if specified
  if (applyGradient) {
    for (let y = 0; y < effectiveHeight; y++) {
      const gradientFactor = y / effectiveHeight; // Vertical gradient
      for (let x = 0; x < effectiveWidth; x++) {
        const idx = (y * effectiveWidth + x) * 4;
        if (tempData[idx] === 255) { // Only apply to white pixels
          const gradientValue = Math.round(255 * (1 - gradientFactor));
          tempData[idx] = tempData[idx + 1] = tempData[idx + 2] = gradientValue;
        }
      }
    }
  }
  
  // Step 8: Put the processed image data back to the temp context
  tempCtx.putImageData(tempImageData, 0, 0);
  
  // Step 9: Scale back up to original size and draw to the output canvas
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = height;
  const finalCtx = finalCanvas.getContext('2d');
  
  if (finalCtx) {
    // Set proper pixel scaling for crisp dithered results
    finalCtx.imageSmoothingEnabled = false;
    
    // Draw the processed dithered image scaled back to original size
    finalCtx.drawImage(tempCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
    
    // Get the final image data
    const finalImageData = finalCtx.getImageData(0, 0, width, height);
    
    // Copy the result back to the original data array
    for (let i = 0; i < data.length; i++) {
      data[i] = finalImageData.data[i];
    }
  }
}

// Helper function for Bayer dithering
function applyBayerDithering(data: Uint8ClampedArray, width: number, height: number, matrixSize: number, threshold: number): void {
  // Generate Bayer matrix of the specified size
  const bayerMatrix = generateBayerMatrix(matrixSize);
  const matrixDivisor = matrixSize * matrixSize;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Get pixel value (assuming already processed for grayscale if needed)
      const pixelValue = data[idx];
      
      // Apply threshold based on Bayer matrix
      const bayerValue = bayerMatrix[y % matrixSize][x % matrixSize];
      const bayerThreshold = (bayerValue / matrixDivisor) * 255;
      const adjustedThreshold = threshold + bayerThreshold - 128; // Center around the user threshold
      
      const newColor = pixelValue > adjustedThreshold ? 255 : 0;
      
      data[idx] = data[idx + 1] = data[idx + 2] = newColor;
    }
  }
}

// Helper function to generate Bayer matrix of given size
function generateBayerMatrix(size: number): number[][] {
  if (size === 4) {
    return [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ];
  } else if (size === 8) {
    // 8x8 Bayer matrix
    return [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21]
    ];
  }
  
  // Fallback to 2x2 matrix
  return [
    [0, 2],
    [3, 1]
  ];
}

// Helper function for Blue Noise dithering
function applyBlueNoiseDithering(data: Uint8ClampedArray, width: number, height: number, threshold: number): void {
  // Blue noise texture (64x64 pseudo-blue noise pattern - this is a simplified version)
  // In a real implementation, this would be a proper blue noise texture
  const blueNoiseSize = 64;
  const blueNoise = new Array(blueNoiseSize * blueNoiseSize);
  
  // Generate pseudo-blue noise
  for (let i = 0; i < blueNoiseSize * blueNoiseSize; i++) {
    // This is a very rough approximation - real blue noise has special properties
    blueNoise[i] = (Math.sin(i * 0.1) * Math.cos(i * 0.1) + 1) * 127.5;
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Get pixel value
      const pixelValue = data[idx];
      
      // Sample blue noise texture (tiling it across the image)
      const noiseX = x % blueNoiseSize;
      const noiseY = y % blueNoiseSize;
      const noiseIdx = noiseY * blueNoiseSize + noiseX;
      const noiseValue = blueNoise[noiseIdx];
      
      // Apply thresholding with blue noise
      const adjustedThreshold = threshold + noiseValue - 128;
      const newColor = pixelValue > adjustedThreshold ? 255 : 0;
      
      data[idx] = data[idx + 1] = data[idx + 2] = newColor;
    }
  }
}

// Helper function for various error diffusion dithering algorithms
function applyErrorDiffusionDithering(
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  algorithm: string,
  threshold: number,
  size: number // Scaling factor for error diffusion
): void {
  // Create a copy of the data to work with
  const tempData = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    tempData[i] = data[i];
  }
  
  // Define diffusion matrices for different algorithms
  let diffusionMatrix: [number, number, number][] = [];
  let divisor = 1;
  
  switch (algorithm) {
    case 'floyd-steinberg':
      // Floyd-Steinberg: right, bottom-left, bottom, bottom-right
      diffusionMatrix = [[1, 0, 7/16], [1, -1, 3/16], [0, 1, 5/16], [-1, 1, 1/16]];
      divisor = 1;
      break;
    case 'sierra-lite':
      // Sierra Lite: right, bottom-left, bottom
      diffusionMatrix = [[1, 0, 2/4], [-1, 1, 1/4], [0, 1, 1/4]];
      divisor = 1;
      break;
    case 'stucki':
      // Stucki: more precise but spreads error further
      diffusionMatrix = [
        [1, 0, 8/42], [2, 0, 4/42],
        [-2, 1, 2/42], [-1, 1, 4/42], [0, 1, 8/42], [1, 1, 4/42], [2, 1, 2/42],
        [-2, 2, 1/42], [-1, 2, 2/42], [0, 2, 4/42], [1, 2, 2/42], [2, 2, 1/42]
      ];
      divisor = 1;
      break;
    case 'burkes':
      // Burkes: smoother transitions
      diffusionMatrix = [
        [1, 0, 8/32], [2, 0, 4/32],
        [-2, 1, 2/32], [-1, 1, 4/32], [0, 1, 8/32], [1, 1, 4/32], [2, 1, 2/32]
      ];
      divisor = 1;
      break;
    case 'stevenson-arce':
      // Stevenson-Arce: high quality results
      diffusionMatrix = [
        [2, 0, 32/200], [3, 0, 12/200],
        [-3, 1, 5/200], [-1, 1, 12/200], [1, 1, 26/200], [3, 1, 12/200],
        [-2, 2, 12/200], [0, 2, 26/200], [2, 2, 12/200],
        [-3, 3, 5/200], [-1, 3, 12/200], [1, 3, 12/200], [3, 3, 5/200]
      ];
      divisor = 1;
      break;
    case 'fan':
      // Fan: block-like pattern
      diffusionMatrix = [
        [1, 0, 7/16], [2, 0, 1/16],
        [-2, 1, 1/16], [-1, 1, 3/16], [0, 1, 5/16], [1, 1, 3/16], [2, 1, 1/16]
      ];
      divisor = 1.32;
      break;
    case 'atkinson':
      // Atkinson: classic Apple algorithm, 3/4 error distributed
      diffusionMatrix = [
        [1, 0, 1/8], [2, 0, 1/8],
        [-1, 1, 1/8], [0, 1, 1/8], [1, 1, 1/8],
        [0, 2, 1/8]
      ];
      divisor = 1;
      break;
    case 'jarvis':
      // Jarvis: similar to Stucki
      diffusionMatrix = [
        [1, 0, 7/48], [2, 0, 5/48],
        [-2, 1, 3/48], [-1, 1, 5/48], [0, 1, 7/48], [1, 1, 5/48], [2, 1, 3/48],
        [-2, 2, 1/48], [-1, 2, 3/48], [0, 2, 5/48], [1, 2, 3/48], [2, 2, 1/48]
      ];
      divisor = 1;
      break;
    default:
      // Default to Floyd-Steinberg
      diffusionMatrix = [[1, 0, 7/16], [-1, 1, 3/16], [0, 1, 5/16], [1, 1, 1/16]];
      divisor = 1;
  }
  
  // Apply error diffusion
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Process each color channel
      for (let c = 0; c < 3; c++) {
        const oldPixel = tempData[idx + c];
        const newPixel = oldPixel > threshold ? 255 : 0;
        
        // Set the new pixel value
        data[idx + c] = newPixel;
        
        // Calculate error
        const error = (oldPixel - newPixel) / divisor;
        
        // Distribute error to neighboring pixels based on the diffusion matrix
        for (const [dx, dy, factor] of diffusionMatrix) {
          const nx = x + dx;
          const ny = y + dy;
          
          // Check bounds
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const neighborIdx = (ny * width + nx) * 4 + c;
            tempData[neighborIdx] += error * factor * size;
          }
        }
      }
    }
  }
}

// Texture filter
function applyTextureFilter(data: Uint8ClampedArray, intensity: number): void {
  const factor = intensity / 100 * 255;
  
  for (let i = 0; i < data.length; i += 4) {
    // Generate texture pattern (could be more complex in a real app)
    const texture = Math.sin(i * 0.01) * Math.cos(i * 0.005) * factor;
    
    for (let j = 0; j < 3; j++) {
      data[i + j] = Math.min(255, Math.max(0, data[i + j] + texture));
    }
  }
}

// Extrude filter
function applyExtrudeFilter(data: Uint8ClampedArray, width: number, height: number, depth: number): void {
  const tempData = new Uint8ClampedArray(data.length);
  tempData.set(data);
  
  for (let y = depth; y < height; y++) {
    for (let x = depth; x < width; x++) {
      const currentIdx = (y * width + x) * 4;
      const offsetIdx = ((y - depth) * width + (x - depth)) * 4;
      
      for (let c = 0; c < 3; c++) {
        data[currentIdx + c] = tempData[offsetIdx + c];
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
      const offsetX = Math.round(amplitude * Math.sin(y * 0.1));
      const sourceX = Math.min(Math.max(x + offsetX, 0), width - 1);
      
      const currentIdx = (y * width + x) * 4;
      const sourceIdx = (y * width + sourceX) * 4;
      
      for (let c = 0; c < 4; c++) {
        data[currentIdx + c] = tempData[sourceIdx + c];
      }
    }
  }
}

// Pixelate filter
function applyPixelateFilter(data: Uint8ClampedArray, width: number, height: number, pixelSize: number): void {
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      // Get color from the center of the pixel block
      const sourceX = Math.min(x + Math.floor(pixelSize / 2), width - 1);
      const sourceY = Math.min(y + Math.floor(pixelSize / 2), height - 1);
      const sourceIdx = (sourceY * width + sourceX) * 4;
      
      // Apply this color to the entire block
      for (let blockY = 0; blockY < pixelSize && y + blockY < height; blockY++) {
        for (let blockX = 0; blockX < pixelSize && x + blockX < width; blockX++) {
          const targetIdx = ((y + blockY) * width + (x + blockX)) * 4;
          
          for (let c = 0; c < 4; c++) {
            data[targetIdx + c] = data[sourceIdx + c];
          }
        }
      }
    }
  }
}

// Find Edges filter implementation based on Photoshop-like edge detection
function applyFindEdgesFilter(
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  params: any[] = []
): void {
  // Extract parameters
  const paramsObj: Record<string, any> = {};
  params.forEach(param => {
    paramsObj[param.name] = param.value;
  });
  
  // Parse parameters
  const method = paramsObj.method || 'Sobel';
  const strength = parseInt(String(paramsObj.strength || '50')) / 100;
  const threshold = parseInt(String(paramsObj.threshold || '25'));
  const shouldInvert = paramsObj.invert === 'On';
  const preserveColor = paramsObj.preserveColor === 'On';
  
  // Make a copy of the original data to work with
  const tempData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i++) {
    tempData[i] = data[i];
  }
  
  // Create a second temporary buffer for edge detection results
  const edgeData = new Uint8ClampedArray(data.length);
  
  // Step 1: Convert to grayscale (unless preserveColor is true)
  if (!preserveColor) {
    for (let i = 0; i < data.length; i += 4) {
      // Standard luminance conversion using the formula specified in requirements
      const gray = Math.round(0.3 * tempData[i] + 0.59 * tempData[i + 1] + 0.11 * tempData[i + 2]);
      tempData[i] = tempData[i + 1] = tempData[i + 2] = gray;
    }
  }
  
  // Step 2: Apply edge detection kernel based on selected method
  switch (method) {
    case 'Sobel':
      applySobelOperator(tempData, edgeData, width, height, strength, threshold, preserveColor);
      break;
    case 'Laplacian':
      applyLaplacianOperator(tempData, edgeData, width, height, strength, threshold, preserveColor);
      break;
    case 'Prewitt':
      applyPrewittOperator(tempData, edgeData, width, height, strength, threshold, preserveColor);
      break;
    case 'Canny':
      applyCannyEdgeDetection(tempData, edgeData, width, height, strength, threshold, preserveColor);
      break;
    default:
      applySobelOperator(tempData, edgeData, width, height, strength, threshold, preserveColor);
  }
  
  // Step 3: Invert if requested (Photoshop default is white edges on black)
  if (shouldInvert) {
    for (let i = 0; i < data.length; i += 4) {
      edgeData[i] = 255 - edgeData[i];
      edgeData[i + 1] = 255 - edgeData[i + 1];
      edgeData[i + 2] = 255 - edgeData[i + 2];
    }
  }
  
  // Copy the result back to the original data
  for (let i = 0; i < data.length; i++) {
    data[i] = edgeData[i];
  }
}

// Sobel operator for edge detection
function applySobelOperator(
  srcData: Uint8ClampedArray,
  dstData: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number,
  threshold: number,
  preserveColor: boolean
): void {
  // Sobel kernels for x and y directions
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];
  
  // Initialize the destination array
  for (let i = 0; i < dstData.length; i += 4) {
    dstData[i] = dstData[i + 1] = dstData[i + 2] = 0;
    dstData[i + 3] = srcData[i + 3]; // Preserve alpha
  }
  
  // Apply Sobel operator
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      if (preserveColor) {
        // Process each color channel separately
        for (let c = 0; c < 3; c++) {
          // Apply the sobel operators in X and Y directions
          let gradientX = 0;
          let gradientY = 0;
          
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
              gradientX += srcData[neighborIdx + c] * sobelX[ky + 1][kx + 1];
              gradientY += srcData[neighborIdx + c] * sobelY[ky + 1][kx + 1];
            }
          }
          
          // Calculate gradient magnitude
          let magnitude = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
          
          // Apply strength modifier
          magnitude *= strength;
          
          // Apply threshold
          if (magnitude < threshold) {
            magnitude = 0;
          } else {
            magnitude = Math.min(255, magnitude);
          }
          
          // Store the edge value
          dstData[pixelIndex + c] = magnitude;
        }
      } else {
        // When not preserving color, just use the R channel as the grayscale value
        let gradientX = 0;
        let gradientY = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
            gradientX += srcData[neighborIdx] * sobelX[ky + 1][kx + 1];
            gradientY += srcData[neighborIdx] * sobelY[ky + 1][kx + 1];
          }
        }
        
        // Calculate gradient magnitude
        let magnitude = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
        
        // Apply strength modifier
        magnitude *= strength;
        
        // Apply threshold
        if (magnitude < threshold) {
          magnitude = 0;
        } else {
          magnitude = Math.min(255, magnitude);
        }
        
        // Apply the same edge value to all channels
        dstData[pixelIndex] = dstData[pixelIndex + 1] = dstData[pixelIndex + 2] = magnitude;
      }
    }
  }
}

// Laplacian operator for edge detection
function applyLaplacianOperator(
  srcData: Uint8ClampedArray,
  dstData: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number,
  threshold: number,
  preserveColor: boolean
): void {
  // Laplacian kernel
  const laplacian = [
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0]
  ];
  
  // Initialize the destination array
  for (let i = 0; i < dstData.length; i += 4) {
    dstData[i] = dstData[i + 1] = dstData[i + 2] = 0;
    dstData[i + 3] = srcData[i + 3]; // Preserve alpha
  }
  
  // Apply Laplacian operator
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      if (preserveColor) {
        // Process each color channel separately
        for (let c = 0; c < 3; c++) {
          let result = 0;
          
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
              result += srcData[neighborIdx + c] * laplacian[ky + 1][kx + 1];
            }
          }
          
          // Take absolute value for edge magnitude
          result = Math.abs(result) * strength;
          
          // Apply threshold
          if (result < threshold) {
            result = 0;
          } else {
            result = Math.min(255, result);
          }
          
          // Store the edge value
          dstData[pixelIndex + c] = result;
        }
      } else {
        // When not preserving color, just use the R channel
        let result = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
            result += srcData[neighborIdx] * laplacian[ky + 1][kx + 1];
          }
        }
        
        // Take absolute value for edge magnitude
        result = Math.abs(result) * strength;
        
        // Apply threshold
        if (result < threshold) {
          result = 0;
        } else {
          result = Math.min(255, result);
        }
        
        // Apply the same edge value to all channels
        dstData[pixelIndex] = dstData[pixelIndex + 1] = dstData[pixelIndex + 2] = result;
      }
    }
  }
}

// Prewitt operator for edge detection
function applyPrewittOperator(
  srcData: Uint8ClampedArray,
  dstData: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number,
  threshold: number,
  preserveColor: boolean
): void {
  // Prewitt kernels for x and y directions
  const prewittX = [
    [-1, 0, 1],
    [-1, 0, 1],
    [-1, 0, 1]
  ];
  
  const prewittY = [
    [-1, -1, -1],
    [0, 0, 0],
    [1, 1, 1]
  ];
  
  // Initialize the destination array
  for (let i = 0; i < dstData.length; i += 4) {
    dstData[i] = dstData[i + 1] = dstData[i + 2] = 0;
    dstData[i + 3] = srcData[i + 3]; // Preserve alpha
  }
  
  // Apply Prewitt operator (similar to Sobel but with different weights)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      if (preserveColor) {
        // Process each color channel separately
        for (let c = 0; c < 3; c++) {
          let gradientX = 0;
          let gradientY = 0;
          
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
              gradientX += srcData[neighborIdx + c] * prewittX[ky + 1][kx + 1];
              gradientY += srcData[neighborIdx + c] * prewittY[ky + 1][kx + 1];
            }
          }
          
          // Calculate gradient magnitude
          let magnitude = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
          
          // Apply strength modifier
          magnitude *= strength;
          
          // Apply threshold
          if (magnitude < threshold) {
            magnitude = 0;
          } else {
            magnitude = Math.min(255, magnitude);
          }
          
          // Store the edge value
          dstData[pixelIndex + c] = magnitude;
        }
      } else {
        // When not preserving color, just use the R channel
        let gradientX = 0;
        let gradientY = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
            gradientX += srcData[neighborIdx] * prewittX[ky + 1][kx + 1];
            gradientY += srcData[neighborIdx] * prewittY[ky + 1][kx + 1];
          }
        }
        
        // Calculate gradient magnitude
        let magnitude = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
        
        // Apply strength modifier
        magnitude *= strength;
        
        // Apply threshold
        if (magnitude < threshold) {
          magnitude = 0;
        } else {
          magnitude = Math.min(255, magnitude);
        }
        
        // Apply the same edge value to all channels
        dstData[pixelIndex] = dstData[pixelIndex + 1] = dstData[pixelIndex + 2] = magnitude;
      }
    }
  }
}

// Highlight Glow filter implementation
function applyGlowFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  params: any[] = []
): void {
  // Extract parameters
  const paramsObj: Record<string, any> = {};
  params.forEach(param => {
    paramsObj[param.name] = param.value;
  });

  // Parse parameters
  const radius = parseInt(String(paramsObj.radius || '10'));
  const threshold = parseInt(String(paramsObj.threshold || '220')); // Luminance threshold for highlights
  const intensity = parseInt(String(paramsObj.intensity || '100')) / 100;
  const blendMode = paramsObj.blendMode || 'Screen';
  const glowColor = paramsObj.glowColor || 'Original';
  
  // Step 1: Create a copy of the original data
  const originalData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i++) {
    originalData[i] = data[i];
  }
  
  // Step 2: Create a highlight mask - extract only the bright parts
  const highlightMask = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    // Calculate luminance using the formula from the requirements
    const luminance = Math.round(0.3 * originalData[i] + 0.59 * originalData[i + 1] + 0.11 * originalData[i + 2]);
    
    if (luminance > threshold) {
      // If pixel is bright enough, keep it (with original color or apply a tint)
      if (glowColor === 'Original') {
        highlightMask[i] = originalData[i];        // R
        highlightMask[i + 1] = originalData[i + 1]; // G
        highlightMask[i + 2] = originalData[i + 2]; // B
      } else if (glowColor === 'White') {
        highlightMask[i] = highlightMask[i + 1] = highlightMask[i + 2] = 255;
      } else if (glowColor === 'Golden') {
        // Warm golden glow
        highlightMask[i] = 255;           // R (full)
        highlightMask[i + 1] = 215;       // G (high)
        highlightMask[i + 2] = 120;       // B (medium-low)
      } else if (glowColor === 'Blue') {
        // Cool blue glow
        highlightMask[i] = 100;           // R (low)
        highlightMask[i + 1] = 180;       // G (medium-high)
        highlightMask[i + 2] = 255;       // B (full)
      } else if (glowColor === 'Pink') {
        // Pink glow
        highlightMask[i] = 255;           // R (full)
        highlightMask[i + 1] = 105;       // G (low-medium)
        highlightMask[i + 2] = 210;       // B (high)
      }
      
      // Scale by how far above threshold (creates smoother transition at edges)
      const intensity = (luminance - threshold) / (255 - threshold);
      highlightMask[i] = Math.round(highlightMask[i] * intensity);
      highlightMask[i + 1] = Math.round(highlightMask[i + 1] * intensity);
      highlightMask[i + 2] = Math.round(highlightMask[i + 2] * intensity);
      
      // Copy alpha
      highlightMask[i + 3] = originalData[i + 3];
    } else {
      // If not bright enough, set to black (no glow)
      highlightMask[i] = highlightMask[i + 1] = highlightMask[i + 2] = 0;
      highlightMask[i + 3] = originalData[i + 3]; // Keep original alpha
    }
  }
  
  // Step 3: Apply blur to the highlight mask to create the glow effect
  const blurredMask = new Uint8ClampedArray(highlightMask.length);
  
  // Copy initial data
  for (let i = 0; i < highlightMask.length; i++) {
    blurredMask[i] = highlightMask[i];
  }
  
  // Box blur for simplicity and performance - can be applied multiple times for smoother result
  const iterations = Math.min(3, Math.max(1, Math.floor(radius / 5))); // 1-3 iterations based on radius
  
  for (let iteration = 0; iteration < iterations; iteration++) {
    const tempMask = new Uint8ClampedArray(blurredMask.length);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
        let count = 0;
        
        // Sample surrounding pixels in horizontal direction
        for (let kx = -radius; kx <= radius; kx++) {
          const sampleX = Math.min(Math.max(0, x + kx), width - 1);
          const idx = (y * width + sampleX) * 4;
          
          rSum += blurredMask[idx];
          gSum += blurredMask[idx + 1];
          bSum += blurredMask[idx + 2];
          aSum += blurredMask[idx + 3];
          count++;
        }
        
        // Write average to temp buffer
        const targetIdx = (y * width + x) * 4;
        tempMask[targetIdx] = rSum / count;
        tempMask[targetIdx + 1] = gSum / count;
        tempMask[targetIdx + 2] = bSum / count;
        tempMask[targetIdx + 3] = aSum / count;
      }
    }
    
    // Vertical pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
        let count = 0;
        
        // Sample surrounding pixels in vertical direction
        for (let ky = -radius; ky <= radius; ky++) {
          const sampleY = Math.min(Math.max(0, y + ky), height - 1);
          const idx = (sampleY * width + x) * 4;
          
          rSum += tempMask[idx];
          gSum += tempMask[idx + 1];
          bSum += tempMask[idx + 2];
          aSum += tempMask[idx + 3];
          count++;
        }
        
        // Write average to blurred buffer
        const targetIdx = (y * width + x) * 4;
        blurredMask[targetIdx] = rSum / count;
        blurredMask[targetIdx + 1] = gSum / count;
        blurredMask[targetIdx + 2] = bSum / count;
        blurredMask[targetIdx + 3] = aSum / count;
      }
    }
  }
  
  // Step 4: Blend the blurred highlights back with the original image
  for (let i = 0; i < data.length; i += 4) {
    // Apply the intensity parameter
    const glowR = blurredMask[i] * intensity;
    const glowG = blurredMask[i + 1] * intensity;
    const glowB = blurredMask[i + 2] * intensity;
    
    // Apply different blend modes 
    if (blendMode === 'Screen') {
      // Screen blend mode: 1 - (1 - a) * (1 - b)
      data[i] = 255 - ((255 - data[i]) * (255 - glowR)) / 255;
      data[i + 1] = 255 - ((255 - data[i + 1]) * (255 - glowG)) / 255;
      data[i + 2] = 255 - ((255 - data[i + 2]) * (255 - glowB)) / 255;
    } 
    else if (blendMode === 'Add') {
      // Add blend mode: simply add values with clamping
      data[i] = Math.min(255, data[i] + glowR);
      data[i + 1] = Math.min(255, data[i + 1] + glowG);
      data[i + 2] = Math.min(255, data[i + 2] + glowB);
    }
    else if (blendMode === 'Lighten') {
      // Lighten blend mode: take max of each channel
      data[i] = Math.max(data[i], glowR);
      data[i + 1] = Math.max(data[i + 1], glowG);
      data[i + 2] = Math.max(data[i + 2], glowB);
    }
    else if (blendMode === 'Soft Light') {
      // Soft Light blend mode formula (simplified version)
      for (let c = 0; c < 3; c++) {
        const base = data[i + c] / 255;
        const blend = blurredMask[i + c] * intensity / 255;
        
        let result;
        if (blend < 0.5) {
          result = base - (1 - 2 * blend) * base * (1 - base);
        } else {
          result = base + (2 * blend - 1) * (Math.sqrt(base) - base);
        }
        
        data[i + c] = Math.min(255, Math.max(0, result * 255));
      }
    }
  }
}

// Simplified Canny edge detection
function applyCannyEdgeDetection(
  srcData: Uint8ClampedArray,
  dstData: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number,
  threshold: number,
  preserveColor: boolean
): void {
  // First apply Gaussian blur to reduce noise
  const tempData = new Uint8ClampedArray(srcData.length);
  for (let i = 0; i < srcData.length; i++) {
    tempData[i] = srcData[i];
  }
  
  // Apply simple box blur as an approximation of Gaussian blur
  const blurRadius = 1;
  for (let y = blurRadius; y < height - blurRadius; y++) {
    for (let x = blurRadius; x < width - blurRadius; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let count = 0;
        
        for (let ky = -blurRadius; ky <= blurRadius; ky++) {
          for (let kx = -blurRadius; kx <= blurRadius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += srcData[idx];
            count++;
          }
        }
        
        tempData[(y * width + x) * 4 + c] = sum / count;
      }
    }
  }
  
  // Now apply Sobel operator for edge detection, but with additional non-maximum suppression
  const gradientX = new Float32Array(width * height);
  const gradientY = new Float32Array(width * height);
  const gradientMag = new Float32Array(width * height);
  const gradientDir = new Float32Array(width * height);
  
  // Sobel kernels for x and y directions
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];
  
  // Initialize the destination array
  for (let i = 0; i < dstData.length; i += 4) {
    dstData[i] = dstData[i + 1] = dstData[i + 2] = 0;
    dstData[i + 3] = srcData[i + 3]; // Preserve alpha
  }
  
  // Step 1: Calculate gradients and their directions
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const pixelIndex = idx * 4;
      
      // We'll use the R channel for grayscale calculation
      let gx = 0;
      let gy = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
          gx += tempData[neighborIdx] * sobelX[ky + 1][kx + 1];
          gy += tempData[neighborIdx] * sobelY[ky + 1][kx + 1];
        }
      }
      
      gradientX[idx] = gx;
      gradientY[idx] = gy;
      
      // Calculate gradient magnitude and direction
      const mag = Math.sqrt(gx * gx + gy * gy);
      gradientMag[idx] = mag;
      
      // Calculate gradient direction (in radians)
      gradientDir[idx] = Math.atan2(gy, gx);
    }
  }
  
  // Step 2: Non-maximum suppression
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const pixelIndex = idx * 4;
      
      const dir = gradientDir[idx];
      const mag = gradientMag[idx];
      
      // Find adjacent pixels in the gradient direction
      let adjacent1X = 0, adjacent1Y = 0, adjacent2X = 0, adjacent2Y = 0;
      
      // Normalize direction to 0-180 degrees (we're only interested in the axis, not direction)
      const angle = ((Math.round(dir * (180 / Math.PI)) + 180) % 180);
      
      if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle < 180)) {
        // Horizontal direction: compare with left and right pixels
        adjacent1X = x + 1;
        adjacent1Y = y;
        adjacent2X = x - 1;
        adjacent2Y = y;
      } else if (angle >= 22.5 && angle < 67.5) {
        // 45 degree diagonal: compare with top-right and bottom-left
        adjacent1X = x + 1;
        adjacent1Y = y - 1;
        adjacent2X = x - 1;
        adjacent2Y = y + 1;
      } else if (angle >= 67.5 && angle < 112.5) {
        // Vertical direction: compare with top and bottom pixels
        adjacent1X = x;
        adjacent1Y = y + 1;
        adjacent2X = x;
        adjacent2Y = y - 1;
      } else if (angle >= 112.5 && angle < 157.5) {
        // 135 degree diagonal: compare with top-left and bottom-right
        adjacent1X = x - 1;
        adjacent1Y = y - 1;
        adjacent2X = x + 1;
        adjacent2Y = y + 1;
      }
      
      // Check if the current pixel is a local maximum in the gradient direction
      const idx1 = adjacent1Y * width + adjacent1X;
      const idx2 = adjacent2Y * width + adjacent2X;
      
      if (adjacent1X >= 0 && adjacent1X < width && adjacent1Y >= 0 && adjacent1Y < height &&
          adjacent2X >= 0 && adjacent2X < width && adjacent2Y >= 0 && adjacent2Y < height) {
        if (mag < gradientMag[idx1] || mag < gradientMag[idx2]) {
          // Not a local maximum, suppress this edge
          gradientMag[idx] = 0;
        }
      }
    }
  }
  
  // Step 3: Apply strength, threshold, and copy to destination
  const lowThreshold = threshold * 0.5;
  const highThreshold = threshold;
  
  // Hysteresis thresholding
  const strongEdges = new Uint8Array(width * height);
  const weakEdges = new Uint8Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixelIndex = idx * 4;
      
      const mag = gradientMag[idx] * strength;
      
      if (mag >= highThreshold) {
        strongEdges[idx] = 1;
        dstData[pixelIndex] = dstData[pixelIndex + 1] = dstData[pixelIndex + 2] = 255;
      } else if (mag >= lowThreshold) {
        weakEdges[idx] = 1;
      }
    }
  }
  
  // Convert weak edges connected to strong edges to strong edges
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const pixelIndex = idx * 4;
      
      if (weakEdges[idx] === 1) {
        // Check 8-connected neighbors
        let hasStrongNeighbor = false;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            if (kx === 0 && ky === 0) continue; // Skip the center pixel
            
            const neighborIdx = (y + ky) * width + (x + kx);
            if (strongEdges[neighborIdx] === 1) {
              hasStrongNeighbor = true;
              break;
            }
          }
          if (hasStrongNeighbor) break;
        }
        
        if (hasStrongNeighbor) {
          // Convert to strong edge
          dstData[pixelIndex] = dstData[pixelIndex + 1] = dstData[pixelIndex + 2] = 255;
        }
      }
    }
  }
  
  // If preserveColor is true, handle the color channels
  if (preserveColor) {
    for (let i = 0; i < dstData.length; i += 4) {
      if (dstData[i] === 255) { // If it's an edge
        // Get original color
        dstData[i] = srcData[i];
        dstData[i + 1] = srcData[i + 1];
        dstData[i + 2] = srcData[i + 2];
      }
    }
  }
}
