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
    applyFilter(filterData.filterType, ctx, canvas, filterData.params);
  }
  
  return canvas.toDataURL();
};

// Build a processing chain from source to leaf nodes
const buildProcessingChain = (sourceNodeId: string, nodes: Node[], edges: Edge[]): Node[] => {
  const sourceNode = nodes.find(node => node.id === sourceNodeId);
  if (!sourceNode) return [];
  
  const chain = [sourceNode];
  const targetNodes = getTargetNodes(sourceNodeId, nodes, edges);
  
  if (targetNodes.length === 0) return chain;
  
  // For simplicity, we'll just take the first target node in the chain
  // In a real app, this would handle multiple branches
  const nextChain = buildProcessingChain(targetNodes[0].id, nodes, edges);
  return [...chain, ...nextChain];
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
      applyDitherFilter(data, canvas.width, canvas.height);
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

// Dither filter using ordered dithering
function applyDitherFilter(data: Uint8ClampedArray, width: number, height: number): void {
  // Bayer matrix for ordered dithering
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Convert to grayscale first
      const gray = Math.floor((data[idx] + data[idx + 1] + data[idx + 2]) / 3);
      
      // Apply threshold based on Bayer matrix
      const threshold = (bayerMatrix[y % 4][x % 4] / 16) * 255;
      const newColor = gray > threshold ? 255 : 0;
      
      data[idx] = newColor;
      data[idx + 1] = newColor;
      data[idx + 2] = newColor;
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
