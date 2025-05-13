import { Node, Edge } from 'reactflow';
import { FilterNodeData, FilterType, ImageNodeData, BlendMode } from '@/types';
import { createNoise2D, createNoise3D } from 'simplex-noise';
import { applyFilterGPU, isGPUAccelerationAvailable, gpuAcceleratedFilters } from './gpuFilters';

// Refraction filter implementation - mimics optical refraction phenomenon
function applyRefractionFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  ctx: CanvasRenderingContext2D,
  params: any[] = []
): void {
  // Extract parameters
  const paramsObj: Record<string, any> = {};
  params.forEach(param => {
    paramsObj[param.name] = param.value;
  });
  
  // Parameters:
  // - Size: Controls the global height scale (max thickness of refractive layer)
  // - Amount: Refraction amount (IOR ratio calculation: 100 * (1 - IOR1/IOR2))
  // - HeightScale: Contrast adjustment for the height map
  // - Precision: Sampling precision level for performance vs. quality
  const size = parseInt(String(paramsObj.size || 30));
  const refractionAmount = parseInt(String(paramsObj.amount || 50)) / 100;
  const heightScale = parseInt(String(paramsObj.heightScale || 50)) / 100;
  const precision = paramsObj.precision || 'Medium';
  
  // Define precision based on parameter (affects sampling rate)
  let sampleStep = 1;
  switch (precision) {
    case 'Low':
      sampleStep = 2;  // Lower quality, better performance
      break;
    case 'Medium':
      sampleStep = 1;  // Balanced
      break;
    case 'High':
      sampleStep = 0.5; // Higher quality, lower performance
      break;
  }
  
  // Create height map for the refractive surface
  // In the real Filter Forge, this would come from a Height input source
  // Since we don't have a second input, we'll generate a height map using Perlin noise
  const heightMap = new Float32Array(width * height);
  
  // Use deterministic random seed for consistent results
  const seed = 12345;
  const randomSeed = () => {
    let s = seed;
    return function() {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  };
  const random = randomSeed();
  const noise2D = createNoise2D(() => random());
  
  // Generate the height map with fractal Perlin noise
  const noiseScale = 1 / size;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Multi-octave noise for natural-looking height map
      let noiseValue = 0;
      noiseValue += noise2D(x * noiseScale, y * noiseScale) * 0.5;
      noiseValue += noise2D(x * noiseScale * 2, y * noiseScale * 2) * 0.25;
      noiseValue += noise2D(x * noiseScale * 4, y * noiseScale * 4) * 0.125;
      
      // Normalize to 0-1 range
      noiseValue = (noiseValue + 1) * 0.5;
      
      // Apply height scale (intensity adjustment)
      noiseValue = noiseValue * heightScale;
      
      // Store in height map
      heightMap[y * width + x] = noiseValue;
    }
  }
  
  // Store original image data for sampling (this is our "Source" input)
  const sourceData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i++) {
    sourceData[i] = data[i];
  }
  
  // Calculate IOR ratio based on refraction amount
  // This follows the formula: Refraction = 100 * (1 - IOR1/IOR2)
  // We reverse it to get the IOR ratio: IOR1/IOR2 = 1 - (Refraction/100)
  const iorRatio = 1 - refractionAmount;
  
  // Apply refraction based on height map and IOR ratio
  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const index = (Math.floor(y) * width + Math.floor(x)) * 4;
      const hmIdx = Math.floor(y) * width + Math.floor(x);
      
      // Calculate surface normal from height map gradients
      // Sampling neighboring pixels to compute the gradient
      const left = x > 0 ? heightMap[hmIdx - 1] : heightMap[hmIdx];
      const right = x < width - 1 ? heightMap[hmIdx + 1] : heightMap[hmIdx];
      const top = y > 0 ? heightMap[hmIdx - width] : heightMap[hmIdx];
      const bottom = y < height - 1 ? heightMap[hmIdx + width] : heightMap[hmIdx];
      
      // Calculate gradients (partial derivatives)
      const gradX = (right - left) * 2.0;
      const gradY = (bottom - top) * 2.0;
      
      // Get height value (thickness) at this point
      const thickness = heightMap[hmIdx] * size;
      
      // Apply substantially increased strength factor to give more dramatic effect
      // This makes the current 100% setting show much more visible refraction
      const amplificationFactor = 15.0;
      
      // Calculate refraction offset based on Snell's law
      // offset = gradient * thickness * (1 - iorRatio) * amplification
      const strengthFactor = thickness * (1 - iorRatio) * refractionAmount * amplificationFactor;
      const offsetX = gradX * strengthFactor;
      const offsetY = gradY * strengthFactor;
      
      // Calculate refracted sample position
      let sampleX = Math.min(Math.max(0, x + offsetX), width - 1);
      let sampleY = Math.min(Math.max(0, y + offsetY), height - 1);
      
      // Use bilinear interpolation for smoother results
      const x0 = Math.floor(sampleX);
      const y0 = Math.floor(sampleY);
      const x1 = Math.min(x0 + 1, width - 1);
      const y1 = Math.min(y0 + 1, height - 1);
      
      const sx = sampleX - x0;
      const sy = sampleY - y0;
      
      // Bilinear interpolation of four surrounding pixels from source image
      const idx00 = (y0 * width + x0) * 4;
      const idx01 = (y0 * width + x1) * 4;
      const idx10 = (y1 * width + x0) * 4;
      const idx11 = (y1 * width + x1) * 4;
      
      // Interpolate each color channel
      for (let c = 0; c < 3; c++) {
        const c00 = sourceData[idx00 + c];
        const c01 = sourceData[idx01 + c];
        const c10 = sourceData[idx10 + c];
        const c11 = sourceData[idx11 + c];
        
        // Bilinear interpolation formula
        const cX0 = c00 * (1 - sx) + c01 * sx;
        const cX1 = c10 * (1 - sx) + c11 * sx;
        const cXY = cX0 * (1 - sy) + cX1 * sy;
        
        // Write refracted pixel to output
        data[index + c] = cXY;
      }
      
      // Preserve alpha channel
      data[index + 3] = sourceData[index + 3];
    }
  }
  
  // Fill in any gaps from sparse sampling in lower precision modes
  if (sampleStep > 1) {
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    // Simple bilinear filtering to fill gaps
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Skip pixels that were directly sampled
        if (x % sampleStep === 0 && y % sampleStep === 0) continue;
        
        const index = (y * width + x) * 4;
        
        // Find the four surrounding sampled points
        const x0 = Math.floor(x / sampleStep) * sampleStep;
        const y0 = Math.floor(y / sampleStep) * sampleStep;
        const x1 = Math.min(x0 + sampleStep, width - 1);
        const y1 = Math.min(y0 + sampleStep, height - 1);
        
        const sx = (x - x0) / sampleStep;
        const sy = (y - y0) / sampleStep;
        
        // Get the four corner samples
        const idx00 = (y0 * width + x0) * 4;
        const idx01 = (y0 * width + x1) * 4;
        const idx10 = (y1 * width + x0) * 4;
        const idx11 = (y1 * width + x1) * 4;
        
        // Interpolate color channels
        for (let c = 0; c < 3; c++) {
          const c00 = tempData[idx00 + c];
          const c01 = tempData[idx01 + c];
          const c10 = tempData[idx10 + c];
          const c11 = tempData[idx11 + c];
          
          // Bilinear interpolation
          const cX0 = c00 * (1 - sx) + c01 * sx;
          const cX1 = c10 * (1 - sx) + c11 * sx;
          const cXY = cX0 * (1 - sy) + cX1 * sy;
          
          // Fill in the gaps
          data[index + c] = cXY;
        }
        
        // Preserve alpha
        data[index + 3] = sourceData[index + 3];
      }
    }
  }
}

// Helper function to find target nodes from a source node
const getTargetNodes = (sourceNodeId: string, nodes: Node[], edges: Edge[]): Node[] => {
  const connectedEdges = edges.filter(edge => edge.source === sourceNodeId);
  return connectedEdges.map(edge => 
    nodes.find(node => node.id === edge.target)
  ).filter((node): node is Node => !!node);
};

// Helper function to find source nodes for a target node
const getSourceNode = (targetNodeId: string, nodes: Node[], edges: Edge[], targetHandle?: string): Node | null => {
  // If a specific target handle is specified, find edge connected to that handle
  const connectedEdge = targetHandle 
    ? edges.find(edge => edge.target === targetNodeId && edge.targetHandle === targetHandle)
    : edges.find(edge => edge.target === targetNodeId);
    
  if (!connectedEdge) return null;
  return nodes.find(node => node.id === connectedEdge.source) || null;
};

// Helper function to find all source nodes for a blend node (with multiple inputs)
const getSourceNodesForBlendNode = (blendNodeId: string, nodes: Node[], edges: Edge[]): { inputA: Node | null, inputB: Node | null } => {
  return {
    inputA: getSourceNode(blendNodeId, nodes, edges, 'inputA'),
    inputB: getSourceNode(blendNodeId, nodes, edges, 'inputB')
  };
};

// Helper to get a path from source to a given node
const getPathToNode = (nodeId: string, nodes: Node[], edges: Edge[], targetHandle?: string): Node[] => {
  const path: Node[] = [];
  let currentNodeId = nodeId;
  
  // Prevent infinite loops
  const maxIterations = nodes.length;
  let iterations = 0;
  
  while (currentNodeId && iterations < maxIterations) {
    const node = nodes.find(n => n.id === currentNodeId);
    if (!node) break;
    
    path.unshift(node);
    
    // For blend nodes, we need to choose the correct input path based on target handle
    if (node.type === 'blendNode' && iterations === 0 && targetHandle) {
      // If we're starting with a blend node and a specific handle is specified,
      // follow only that input path
      const sourceNode = getSourceNode(currentNodeId, nodes, edges, targetHandle);
      if (!sourceNode) break;
      currentNodeId = sourceNode.id;
    } else {
      // For other nodes or when no specific handle is specified,
      // just follow the first available input
      const sourceNode = getSourceNode(currentNodeId, nodes, edges);
      if (!sourceNode) break;
      currentNodeId = sourceNode.id;
    }
    
    iterations++;
  }
  
  return path;
};

// Cache for storing intermediate node results
const nodeResultCache = new Map<string, HTMLCanvasElement>();

// Main function to apply filters
export const applyFilters = (
  sourceImage: HTMLImageElement,
  nodes: Node[],
  edges: Edge[],
  canvas: HTMLCanvasElement,
  targetNodeId?: string
): string | null => {
  // Clear the cache before each processing run
  nodeResultCache.clear();
  
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
  
  // Create a source image canvas and cache it
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = canvas.width;
  sourceCanvas.height = canvas.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return null;
  
  // Draw the source image to the source canvas
  sourceCtx.drawImage(sourceImage, 0, 0);
  
  // Store the source node result in the cache
  nodeResultCache.set(sourceNode.id, sourceCanvas);
  
  // Create a temporary canvas for operations
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return null;
  
  // Process each node in the chain
  for (let i = 1; i < nodesToProcess.length; i++) {
    const node = nodesToProcess[i];
    
    // Skip nodes we've already processed (in the cache)
    if (nodeResultCache.has(node.id)) continue;
    
    if (node.type === 'filterNode') {
      processFilterNode(node, nodes, edges, tempCanvas, tempCtx);
    } else if (node.type === 'blendNode') {
      processBlendNode(node, nodes, edges, tempCanvas, tempCtx);
    }
  }
  
  // The result should be in the cache for the last node (or target node)
  const resultNodeId = targetNodeId || nodesToProcess[nodesToProcess.length - 1].id;
  const resultCanvas = nodeResultCache.get(resultNodeId);
  
  if (resultCanvas) {
    // Draw the result to the output canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(resultCanvas, 0, 0);
    return canvas.toDataURL();
  }
  
  return null;
};

// Process a filter node
const processFilterNode = (
  node: Node, 
  nodes: Node[], 
  edges: Edge[], 
  tempCanvas: HTMLCanvasElement, 
  tempCtx: CanvasRenderingContext2D
) => {
  // Get the filter data
  const filterData = node.data as FilterNodeData;
  
  // Skip disabled filters
  if (!filterData.enabled) {
    // Just pass through the input to the output without processing
    const sourceNode = getSourceNode(node.id, nodes, edges);
    if (sourceNode && nodeResultCache.has(sourceNode.id)) {
      const sourceCanvas = nodeResultCache.get(sourceNode.id)!;
      
      // Create a new canvas for this node's result
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = tempCanvas.width;
      resultCanvas.height = tempCanvas.height;
      const resultCtx = resultCanvas.getContext('2d')!;
      
      // Just copy the source to the result
      resultCtx.drawImage(sourceCanvas, 0, 0);
      
      // Store the result
      nodeResultCache.set(node.id, resultCanvas);
    }
    return;
  }
  
  // Get the input node
  const sourceNode = getSourceNode(node.id, nodes, edges);
  if (!sourceNode || !nodeResultCache.has(sourceNode.id)) return;
  
  // Get the source image from the cache
  const sourceCanvas = nodeResultCache.get(sourceNode.id)!;
  
  // Clear the temp canvas and copy the source image to it
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.drawImage(sourceCanvas, 0, 0);
  
  // Create a new canvas for this node's result
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = tempCanvas.width;
  resultCanvas.height = tempCanvas.height;
  const resultCtx = resultCanvas.getContext('2d')!;
  
  // Create another canvas to keep a copy of the original input (for blend operations)
  const originalCanvas = document.createElement('canvas');
  originalCanvas.width = tempCanvas.width;
  originalCanvas.height = tempCanvas.height;
  const originalCtx = originalCanvas.getContext('2d')!;
  originalCtx.drawImage(sourceCanvas, 0, 0);
  
  // Apply the filter to the temp canvas - Check for GPU acceleration
  if (isGPUAvailable() && gpuAcceleratedFilters.includes(filterData.filterType)) {
    console.log(`Using GPU acceleration for ${filterData.filterType} filter`);
    
    // Create an image from the current canvas state
    const image = new Image();
    image.src = tempCanvas.toDataURL();
    
    // Use a synchronous approach for now
    const processResult = () => {
      // Apply blend mode if needed
      if (filterData.blendMode !== 'normal') {
        // For non-normal blend mode, we need to blend with the original
        resultCtx.drawImage(originalCanvas, 0, 0);
        applyBlendMode(resultCtx, tempCtx, filterData.blendMode, filterData.opacity / 100);
      } else {
        // For normal blend, just copy the filtered result
        resultCtx.drawImage(tempCanvas, 0, 0);
      }
      
      // Store the result
      nodeResultCache.set(node.id, resultCanvas);
    };
    
    // Start loading the image and process when ready
    image.onload = () => {
      const success = applyFilterGPU(filterData.filterType, image, tempCanvas, filterData.params);
      
      if (!success) {
        // Fallback to CPU if GPU acceleration fails
        console.log(`GPU acceleration failed for ${filterData.filterType}, using CPU fallback`);
        applyCPUFilter(filterData.filterType, tempCtx, tempCanvas, filterData.params);
      }
      
      // Complete processing
      processResult();
    };
    
    // For synchronous behavior, use CPU processing for now
    // The GPU version will update the cache when it's ready
    applyCPUFilter(filterData.filterType, tempCtx, tempCanvas, filterData.params);
  } else {
    // Use CPU processing for this filter
    applyCPUFilter(filterData.filterType, tempCtx, tempCanvas, filterData.params);
    
    // Handle blend modes
    if (filterData.blendMode !== 'normal') {
      // Copy the original source
      resultCtx.drawImage(sourceCanvas, 0, 0);
      
      // Now blend the filtered result on top using the specified blend mode
      applyBlendMode(resultCtx, tempCtx, filterData.blendMode, filterData.opacity / 100);
    } else {
      // For normal blend mode, just copy the filtered result
      resultCtx.drawImage(tempCanvas, 0, 0);
    }
  }
  
  // Store the result
  nodeResultCache.set(node.id, resultCanvas);
};

// Process a blend node with two inputs
const processBlendNode = (
  node: Node, 
  nodes: Node[], 
  edges: Edge[], 
  tempCanvas: HTMLCanvasElement, 
  tempCtx: CanvasRenderingContext2D
) => {
  // Get the blend node data
  const blendData = node.data as FilterNodeData;
  
  // Get both input nodes using handleId - inputA comes from the left, inputB from the top
  const inputA = getSourceNode(node.id, nodes, edges, 'inputA');
  const inputB = getSourceNode(node.id, nodes, edges, 'inputB');
  
  // Debug logging for connection issues
  console.log(`Blend Node ${node.id}: Input A: ${inputA?.id}, Input B: ${inputB?.id}`);
  
  // Check if we have at least inputA - we can work with just one input if necessary
  if (!inputA || !nodeResultCache.has(inputA.id)) {
    console.warn(`Blend Node ${node.id} missing Input A, cannot process`);
    return;
  }
  
  // Get the input canvases from the cache
  const inputACanvas = nodeResultCache.get(inputA.id)!;
  const hasInputB = inputB && nodeResultCache.has(inputB.id);
  const inputBCanvas = hasInputB ? nodeResultCache.get(inputB.id)! : null;
  
  // Create a new canvas for this node's result
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = tempCanvas.width;
  resultCanvas.height = tempCanvas.height;
  const resultCtx = resultCanvas.getContext('2d')!;
  
  // If the blend node is disabled, just pass through input A
  if (!blendData.enabled) {
    resultCtx.drawImage(inputACanvas, 0, 0);
    nodeResultCache.set(node.id, resultCanvas);
    return;
  }
  
  // If we don't have input B, just use input A with a subtle tint to show the node is active
  if (!hasInputB) {
    resultCtx.drawImage(inputACanvas, 0, 0);
    
    // Apply a subtle color tint to indicate the blend node is active but missing input B
    const imageData = resultCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
    const data = imageData.data;
    
    // Apply very subtle blue tint
    for (let i = 0; i < data.length; i += 4) {
      data[i + 2] = Math.min(255, data[i + 2] + 15); // Add a bit of blue
    }
    
    resultCtx.putImageData(imageData, 0, 0);
    nodeResultCache.set(node.id, resultCanvas);
    
    console.warn(`Blend Node ${node.id} active but missing Input B`);
    return;
  }
  
  // We have both inputs, proceed with normal blending
  
  // Draw the first input (base layer) to the result canvas
  resultCtx.drawImage(inputACanvas, 0, 0);
  
  // Draw the second input to the temp canvas
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  
  // TypeScript safety check - we already verified inputBCanvas exists with hasInputB check
  if (inputBCanvas) {
    tempCtx.drawImage(inputBCanvas, 0, 0);
  }
  
  // Process with any additional blend-specific filters if needed
  if (blendData.filterType === 'blend') {
    // For a simple blend, we just need to blend the two inputs
    // No additional processing needed
  } else if (blendData.filterType === 'motionBlur' || blendData.filterType === 'noiseDistortion') {
    // Apply the specific filter effect to the second input
    applyFilter(blendData.filterType, tempCtx, tempCanvas, blendData.params);
  }
  
  // Now blend the second input onto the first using the specified blend mode
  // The opacity comes from the blend node's settings (0-100 value)
  const opacity = blendData.opacity / 100; // Convert from percentage (0-100) to decimal (0-1)
  
  // Log the blending operation for debugging
  console.log(`Blending with mode: ${blendData.blendMode}, opacity: ${opacity}`);
  
  // Handle blend mode aliases and consistency
  let finalBlendMode = blendData.blendMode;
  
  // Map any alias blend modes to their standard names
  if (finalBlendMode === 'linear-dodge') {
    finalBlendMode = 'add';
  }
  
  // Apply the blend operation
  applyBlendMode(resultCtx, tempCtx, finalBlendMode, opacity);
  
  // Store the result
  nodeResultCache.set(node.id, resultCanvas);
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
    // For blend nodes, we need special handling
    if (targetNode.type === 'blendNode') {
      // Each blend node needs to process both of its inputs to produce the correct result
      // First, mark the blend node itself as visited to avoid cycles
      visited.add(targetNode.id);
      
      // We'll include the blend node in the chain
      allConnectedNodes.push(targetNode);
      
      // Then continue with any nodes after the blend node
      const nodesAfterBlend = getTargetNodes(targetNode.id, nodes, edges);
      for (const nextNode of nodesAfterBlend) {
        const nextNodeChain = buildProcessingChain(nextNode.id, nodes, edges, visited);
        allConnectedNodes = [...allConnectedNodes, ...nextNodeChain];
      }
    } else {
      // For regular nodes, just continue building the chain normally
      const nextNodes = buildProcessingChain(targetNode.id, nodes, edges, visited);
      allConnectedNodes = [...allConnectedNodes, ...nextNodes];
    }
  }
  
  return [...chain, ...allConnectedNodes];
};

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
      const intensityFactor = (luminance - threshold) / (255 - threshold);
      highlightMask[i] = Math.round(highlightMask[i] * intensityFactor);
      highlightMask[i + 1] = Math.round(highlightMask[i + 1] * intensityFactor);
      highlightMask[i + 2] = Math.round(highlightMask[i + 2] * intensityFactor);
      
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

// Apply a specific filter based on type
// Check if GPU acceleration is available (cached for performance)
// Global vars for acceleration and environment tracking
let gpuAccelerationAvailable: boolean | null = null;
let isReplitPreviewMode = false;
let replitPreviewNoticeShown = false;

// Check if we're in Replit preview mode
const checkReplitPreviewMode = (): boolean => {
  if (typeof window !== 'undefined') {
    const isInIframe = window !== window.top;
    const isReplitDomain = window.location.hostname.includes('replit');
    return isInIframe && isReplitDomain;
  }
  return false;
};

// Show a user-friendly notice about Replit preview mode
const showReplitPreviewModeNotice = () => {
  if (replitPreviewNoticeShown || typeof document === 'undefined') return;
  
  replitPreviewNoticeShown = true;
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.padding = '15px';
  notification.style.background = 'rgba(50, 50, 180, 0.9)';
  notification.style.color = 'white';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '9999';
  notification.style.fontFamily = 'sans-serif';
  notification.style.maxWidth = '80%';
  notification.style.textAlign = 'center';
  notification.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
  
  // Create more detailed notification with HTML
  const content = 
    '<div style="display: flex; align-items: center; gap: 10px; justify-content: center;">' +
    '<div style="font-size: 24px;">ℹ️</div>' +
    '<div>' +
    '<div style="font-weight: bold;">Replit Preview Mode</div>' +
    '<div style="font-size: 12px; opacity: 0.9; font-weight: normal; margin-top: 4px;">Using CPU processing for better compatibility</div>' +
    '</div></div>' +
    '<div style="margin-top: 10px; font-size: 12px;">' +
    'WebGL is limited in preview mode. All filters will work correctly using CPU processing.' +
    '</div>';
  
  notification.innerHTML = content;
  
  // Add to the document
  document.body.appendChild(notification);
  
  // Remove after 8 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 8000);
};

// Track active filters for display purposes
const activeGPUFilters: Record<string, boolean> = {};

// Helper function to show which filters are using GPU acceleration
const showGPUStatusIndicator = (filterType: string, isGPU: boolean) => {
  if (typeof document === 'undefined') return;
  
  // Update the active filters record
  activeGPUFilters[filterType] = isGPU;
  
  // Get or create the status container
  let statusContainer = document.getElementById('gpu-status-container');
  if (!statusContainer) {
    statusContainer = document.createElement('div');
    statusContainer.id = 'gpu-status-container';
    statusContainer.style.position = 'fixed';
    statusContainer.style.top = '10px';
    statusContainer.style.right = '10px';
    statusContainer.style.padding = '10px';
    statusContainer.style.background = 'rgba(0, 0, 0, 0.7)';
    statusContainer.style.color = 'white';
    statusContainer.style.fontFamily = 'sans-serif';
    statusContainer.style.fontSize = '12px';
    statusContainer.style.borderRadius = '5px';
    statusContainer.style.zIndex = '9999';
    statusContainer.style.maxWidth = '250px';
    statusContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    document.body.appendChild(statusContainer);
  }
  
  // Update the content
  let content = '<div style="font-weight: bold; margin-bottom: 5px; text-align: center;">Filter Processing Status</div>';
  
  // Get all filter types being processed
  const filterTypes = Object.keys(activeGPUFilters);
  
  if (filterTypes.length === 0) {
    content += '<div>No filters applied yet</div>';
  } else {
    content += '<ul style="margin: 0; padding: 0 0 0 20px;">';
    filterTypes.forEach(type => {
      const isUsingGPU = activeGPUFilters[type];
      const icon = isUsingGPU ? '✅' : '🔄';
      const processorText = isUsingGPU ? 'GPU' : 'CPU';
      const processorStyle = isUsingGPU ? 'color: #4CAF50' : 'color: #FFC107';
      
      content += `<li style="margin-bottom: 4px;">
        ${icon} ${type.charAt(0).toUpperCase() + type.slice(1)}: 
        <span style="${processorStyle}; font-weight: bold;">${processorText}</span>
      </li>`;
    });
    content += '</ul>';
  }
  
  // Add a performance tip
  content += '<div style="margin-top: 10px; font-size: 10px; color: #BBB; font-style: italic;">';
  if (gpuAccelerationAvailable) {
    const cpuFilters = filterTypes.filter(type => !activeGPUFilters[type]);
    if (cpuFilters.length > 0) {
      content += `Tip: ${cpuFilters.join(', ')} ${cpuFilters.length === 1 ? 'is' : 'are'} running on CPU. Simpler filters may not need GPU acceleration.`;
    } else {
      content += 'All filters are GPU-accelerated for maximum performance!';
    }
  } else {
    content += 'WebGL not available - all filters using CPU processing.';
  }
  content += '</div>';
  
  statusContainer.innerHTML = content;
  
  // Make sure the indicator is visible for at least 5 seconds after the last filter process
  clearTimeout((statusContainer as any)._timeout);
  (statusContainer as any)._timeout = setTimeout(() => {
    if (statusContainer && statusContainer.parentNode) {
      statusContainer.parentNode.removeChild(statusContainer);
    }
  }, 5000);
};

// Helper to check GPU availability with caching
const isGPUAvailable = (): boolean => {
  if (gpuAccelerationAvailable === null) {
    // First check if we're in Replit preview mode
    isReplitPreviewMode = checkReplitPreviewMode();
    
    if (isReplitPreviewMode) {
      // Force CPU mode in Replit preview environment for reliability
      gpuAccelerationAvailable = false;
      console.log('Replit preview mode detected - using CPU processing for compatibility ✓');
      
      // Show a special notice for Replit preview mode
      showReplitPreviewModeNotice();
    } else {
      // For regular environments, check GPU availability normally
      gpuAccelerationAvailable = isGPUAccelerationAvailable();
      console.log('GPU acceleration ' + (gpuAccelerationAvailable ? 'enabled ✅' : 'not available ❌'));
    }
    
    // Display a notification to the user about GPU acceleration status (skip if in Replit preview)
    if (typeof document !== 'undefined' && !isReplitPreviewMode) {
      // Create notification element
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.padding = '15px';
      notification.style.background = gpuAccelerationAvailable ? 'rgba(0, 128, 0, 0.85)' : 'rgba(128, 0, 0, 0.85)';
      notification.style.color = 'white';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '9999';
      notification.style.fontFamily = 'sans-serif';
      notification.style.fontSize = '14px';
      notification.style.fontWeight = 'bold';
      notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
      
      // Create more detailed notification with HTML
      let content = gpuAccelerationAvailable 
        ? '<div style="display: flex; align-items: center; gap: 10px;">' +
          '<div style="font-size: 24px;">✅</div>' +
          '<div>' +
          '<div style="font-weight: bold;">GPU Acceleration Enabled</div>' +
          '<div style="font-size: 12px; opacity: 0.9; font-weight: normal; margin-top: 4px;">Performance boost available for:</div>' +
          '</div></div>'
        : '<div style="display: flex; align-items: center; gap: 10px;">' +
          '<div style="font-size: 24px;">⚠️</div>' +
          '<div>' +
          '<div style="font-weight: bold;">Using CPU Processing</div>' +
          '<div style="font-size: 12px; opacity: 0.9; font-weight: normal; margin-top: 4px;">WebGL not available in your browser</div>' +
          '</div></div>';
      
      // Add filter support details if GPU is available
      if (gpuAccelerationAvailable) {
        content += '<div style="margin-top: 10px; font-size: 12px; font-weight: normal;">';
        content += '<ul style="margin: 0; padding-left: 20px;">';
        
        // List of accelerated filters with icons
        const filters = [
          { name: 'Blur', icon: '🌫️' },
          { name: 'Noise (Perlin/Simplex)', icon: '🔄' },
          { name: 'Halftone', icon: '🔍' },
          { name: 'Glow', icon: '✨' },
          { name: 'Sharpen', icon: '🔪' }
        ];
        
        filters.forEach(filter => {
          content += `<li>${filter.icon} ${filter.name}</li>`;
        });
        
        content += '</ul></div>';
      }
      
      notification.innerHTML = content;
      
      // Add to document
      document.body.appendChild(notification);
      
      // Remove after 8 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 8000);
    }
  }
  // Always return false for Replit preview mode to force CPU processing
  if (isReplitPreviewMode) {
    return false;
  }
  
  return gpuAccelerationAvailable === true;
};

const applyFilter = (
  filterType: FilterType,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  params: { name: string; value: number | string }[]
): void => {
  // Check if we can use GPU acceleration for this filter
  if (isGPUAvailable() && gpuAcceleratedFilters.includes(filterType)) {
    // Get the current image from the canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      // Copy the current canvas content to our temp canvas
      tempCtx.drawImage(canvas, 0, 0);
      
      // Create an image object from the current canvas state
      const image = new Image();
      image.src = tempCanvas.toDataURL();
      
      // Once the image is loaded, apply GPU filter
      image.onload = () => {
        // Try to apply the filter using GPU
        const success = applyFilterGPU(filterType, image, canvas, params);
        
        // If GPU filtering failed, fall back to CPU implementation
        if (!success) {
          console.log(`GPU acceleration failed for ${filterType}, falling back to CPU`);
          showGPUStatusIndicator(filterType, false);
          applyCPUFilter(filterType, ctx, canvas, params);
        } else {
          console.log(`Applied ${filterType} filter using GPU acceleration`);
          showGPUStatusIndicator(filterType, true);
        }
      };
      
      // Start loading the image
      return;
    }
  }
  
  // Fall back to CPU implementation if GPU is not available or not supported for this filter
  applyCPUFilter(filterType, ctx, canvas, params);
};

// The original CPU-based filter implementation
const applyCPUFilter = (
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
    case 'noise': {
      // Check for noise type parameter to match the GPU implementation
      const noiseTypeParam = params.find(p => p.name === 'noiseType');
      const noiseType = noiseTypeParam ? noiseTypeParam.value as string : 'random';
      
      // Log which noise type is being processed by CPU and include Replit status
      const inReplitPreview = checkReplitPreviewMode();
      if (inReplitPreview) {
        console.log(`Applying CPU ${noiseType} noise filter (Replit preview mode)`);
      } else {
        console.log(`Applying CPU ${noiseType} noise filter`);
      }
      
      // Apply the appropriate noise algorithm based on type
      // Pass the noiseType as override to ensure it uses the correct algorithm
      try {
        applyNoiseFilter(data, canvas.width, canvas.height, params, noiseType);
      } catch (err) {
        console.error("Error applying noise filter:", err);
        // Basic fallback in case of error
        for (let i = 0; i < data.length; i += 4) {
          const noise = Math.random() * 50 - 25;
          
          // Apply noise to RGB channels
          for (let j = 0; j < 3; j++) {
            data[i + j] = Math.min(255, Math.max(0, data[i + j] + noise));
          }
        }
      }
      break;
    }
    case 'dither':
      applyDitherFilter(data, canvas.width, canvas.height, params);
      break;
    case 'texture':
      applyTextureFilter(data, canvas.width, canvas.height, params);
      break;
    case 'extrude':
      applyExtrudeFilter(data, canvas.width, canvas.height, params);
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
    case 'halftone':
      applyHalftoneFilter(data, canvas.width, canvas.height, ctx, params);
      break;
    case 'blend':
      applyBlendFilter(data, canvas.width, canvas.height, params);
      break;
    case 'motionBlur':
      applyMotionBlurFilter(data, canvas.width, canvas.height, params);
      break;
    case 'noiseDistortion':
      applyNoiseDistortionFilter(data, canvas.width, canvas.height, params);
      break;
    case 'refraction':
      applyRefractionFilter(data, canvas.width, canvas.height, ctx, params);
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

// Noise filter with Perlin and Simplex noise support

function applyNoiseFilter(
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  params: any[] = [], 
  noiseTypeOverride?: string
): void {
  // Extract parameters
  const paramsObj: Record<string, any> = {};
  params.forEach(param => {
    paramsObj[param.name] = param.value;
  });
  
  // If noiseTypeOverride is provided (from GPU acceleration code), use that instead of the parameter
  // This allows us to use the same noise algorithms from both CPU and GPU pathways
  const noiseType = noiseTypeOverride || paramsObj.noiseType || 'Uniform';
  const amount = parseInt(String(paramsObj.amount || 25)) / 100 * 255;
  const scale = parseFloat(String(paramsObj.scale || 0.1));
  const octaves = parseInt(String(paramsObj.octaves || 4));
  const persistence = parseFloat(String(paramsObj.persistence || 0.5));
  const lacunarity = parseFloat(String(paramsObj.lacunarity || 2.0));
  const seed = parseInt(String(paramsObj.seed || 42));
  const colorize = paramsObj.colorize || 'Off';
  
  // Generate random seed from the given number
  const randomSeed = () => {
    let s = seed;
    return function() {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  };
  const random = randomSeed();
  
  // Initialize simplex noise generator
  const noise2D = createNoise2D(() => random());
  
  // For uniform noise (original implementation)
  if (noiseType === 'Uniform') {
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * amount - amount / 2;
      
      // Apply noise to RGB channels
      for (let j = 0; j < 3; j++) {
        data[i + j] = Math.min(255, Math.max(0, data[i + j] + noise));
      }
    }
    return;
  }
  
  // For Gaussian noise
  if (noiseType === 'Gaussian') {
    for (let i = 0; i < data.length; i += 4) {
      // Box-Muller transform for Gaussian distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      
      const noise = z0 * amount / 3; // Divide by 3 to scale appropriately
      
      // Apply noise to RGB channels
      for (let j = 0; j < 3; j++) {
        data[i + j] = Math.min(255, Math.max(0, data[i + j] + noise));
      }
    }
    return;
  }
  
  // For Salt & Pepper noise
  if (noiseType === 'Salt & Pepper') {
    const threshold = amount / 255;
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < threshold) {
        // Add salt or pepper randomly
        const value = Math.random() < 0.5 ? 0 : 255;
        
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }
    }
    return;
  }
  
  // For Perlin and Simplex noise
  if (noiseType.includes('Perlin') || noiseType.includes('Simplex')) {
    // Determine if we're using fractal noise
    const isFractal = noiseType.includes('Fractal');
    
    // Temporary array to store noise values
    const noiseData = new Float32Array(width * height);
    
    // Generate noise values
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = 0;
        
        if (isFractal) {
          // Fractal noise (multiple octaves)
          let amplitude = 1;
          let frequency = scale;
          let maxValue = 0;
          
          for (let o = 0; o < octaves; o++) {
            // Get noise value based on coordinates and frequency
            const noiseValue = noise2D(x * frequency, y * frequency);
            
            // Add to value with current amplitude
            value += noiseValue * amplitude;
            
            // Track max possible value for normalization
            maxValue += amplitude;
            
            // Update amplitude and frequency for next octave
            amplitude *= persistence;
            frequency *= lacunarity;
          }
          
          // Normalize to [-1, 1] range
          value /= maxValue;
        } else {
          // Simple noise (single octave)
          value = noise2D(x * scale, y * scale);
        }
        
        // Store in our temporary array (normalized to [0, 1])
        noiseData[y * width + x] = (value + 1) / 2;
      }
    }
    
    // Apply noise to image data based on colorization mode
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const noiseValue = noiseData[y * width + x];
        
        // Scale noise value by amount
        const scaledNoise = noiseValue * amount / 128;
        
        if (colorize === 'Off') {
          // Just add noise to existing pixels
          for (let j = 0; j < 3; j++) {
            data[i + j] = Math.min(255, Math.max(0, data[i + j] + scaledNoise - amount / 256));
          }
        } else if (colorize === 'Grayscale') {
          // Grayscale noise
          const grayValue = Math.floor(noiseValue * 255);
          data[i] = grayValue;
          data[i + 1] = grayValue;
          data[i + 2] = grayValue;
        } else if (colorize === 'Rainbow') {
          // Rainbow colorization (HSV to RGB)
          const h = noiseValue; // Hue from noise (0 to 1)
          const s = 1.0; // Saturation
          const v = 1.0; // Value
          
          // HSV to RGB conversion
          const i_hsv = Math.floor(h * 6);
          const f = h * 6 - i_hsv;
          const p = v * (1 - s);
          const q = v * (1 - f * s);
          const t = v * (1 - (1 - f) * s);
          
          let r, g, b;
          switch (i_hsv % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
            default: r = v; g = t; b = p;
          }
          
          data[i] = Math.floor(r * 255);
          data[i + 1] = Math.floor(g * 255);
          data[i + 2] = Math.floor(b * 255);
        } else if (colorize === 'Fire') {
          // Fire colorization
          const temp = noiseValue;
          data[i] = Math.floor(255 * Math.min(1.0, temp * 2));
          data[i + 1] = Math.floor(255 * Math.min(1.0, temp * 1.5));
          data[i + 2] = Math.floor(255 * Math.min(1.0, temp * 0.5));
        } else if (colorize === 'Electric') {
          // Electric blue colorization
          const temp = noiseValue;
          data[i] = Math.floor(255 * Math.min(1.0, temp * 0.5));
          data[i + 1] = Math.floor(255 * Math.min(1.0, temp * 1.0));
          data[i + 2] = Math.floor(255 * Math.min(1.0, temp * 2.0));
        }
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
function applyTextureFilter(data: Uint8ClampedArray, width: number, height: number, params: any[] = []): void {
  // Extract parameters from params array
  const paramsObj: Record<string, any> = {};
  params.forEach(param => {
    paramsObj[param.name] = param.value;
  });
  
  const intensity = parseInt(String(paramsObj.intensity || 30)) / 100;
  const brightness = parseInt(String(paramsObj.brightness || 0));
  const pattern = paramsObj.pattern || 'Grain';
  
  // Apply brightness adjustment factor (-100 to 100 range)
  const brightnessFactor = brightness / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    // Get position coordinates
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    
    // Choose pattern based on the selected type
    let texture = 0;
    if (pattern === 'Noise') {
      // Random noise (less structured)
      texture = (Math.random() * 2 - 1) * intensity * 100;
    } else if (pattern === 'Grain') {
      // Film grain-like texture (more consistent)
      const grainSeed = (x * 0.3) + (y * 0.7);
      texture = (Math.sin(grainSeed) * 0.5 + 0.5) * intensity * 80;
    } else if (pattern === 'Canvas') {
      // Canvas-like pattern (structured horizontal/vertical)
      const canvasPattern = (Math.sin(x * 0.2) * Math.cos(y * 0.2)) * intensity * 60;
      texture = canvasPattern;
    }
    
    // Apply texture
    for (let j = 0; j < 3; j++) {
      data[i + j] = Math.min(255, Math.max(0, data[i + j] + texture));
    }
    
    // Apply brightness adjustment
    if (brightness !== 0) {
      if (brightnessFactor > 0) {
        // Increase brightness (move toward white)
        for (let j = 0; j < 3; j++) {
          data[i + j] = Math.min(255, data[i + j] + (255 - data[i + j]) * brightnessFactor);
        }
      } else {
        // Decrease brightness (move toward black)
        for (let j = 0; j < 3; j++) {
          data[i + j] = Math.max(0, data[i + j] + data[i + j] * brightnessFactor);
        }
      }
    }
  }
}

// Advanced Extrude filter
function applyExtrudeFilter(data: Uint8ClampedArray, width: number, height: number, params: any[] = []): void {
  // Extract parameters
  const paramsObj: Record<string, any> = {};
  params.forEach(param => {
    paramsObj[param.name] = param.value;
  });
  
  // Parse parameters
  const blockSize = parseInt(String(paramsObj.blockSize || '10'));
  const depth = parseInt(String(paramsObj.depth || '20'));
  const shape = paramsObj.shape || 'Cube';
  const lightDirection = paramsObj.lightDirection || 'Top-Left';
  const materialColor = paramsObj.materialColor || 'Original';
  const blendOriginal = paramsObj.blendOriginal === 'On';
  
  // Save original data
  const originalData = new Uint8ClampedArray(data.length);
  originalData.set(data);
  
  // Create a temporary canvas for drawing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
  
  // Fill background with white or transparent depending on blend mode
  if (!blendOriginal) {
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, width, height);
  }
  
  // Calculate light direction offsets
  let lightX = 0, lightY = 0;
  switch (lightDirection) {
    case 'Top-Left':
      lightX = -1; lightY = -1;
      break;
    case 'Top-Right':
      lightX = 1; lightY = -1;
      break;
    case 'Bottom-Left':
      lightX = -1; lightY = 1;
      break;
    case 'Bottom-Right':
      lightX = 1; lightY = 1;
      break;
  }
  
  // Utility function to get brightness
  const getBrightness = (r: number, g: number, b: number): number => {
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  };
  
  // Process image in blocks
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      // Define the block boundaries
      const blockWidth = Math.min(blockSize, width - x);
      const blockHeight = Math.min(blockSize, height - y);
      
      // Skip if block is too small
      if (blockWidth < 2 || blockHeight < 2) continue;
      
      // Calculate average brightness and color of the block
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
      const brightness = getBrightness(avgR, avgG, avgB);
      
      // Map brightness to extrusion height (0-depth)
      const extrusionHeight = Math.round((brightness / 255) * depth);
      
      // Determine fill and stroke colors based on material setting
      let fillR = avgR, fillG = avgG, fillB = avgB;
      
      if (materialColor === 'Grayscale') {
        fillR = fillG = fillB = brightness;
      } else if (materialColor === 'Blue') {
        fillR = Math.round(avgR * 0.5);
        fillG = Math.round(avgG * 0.7);
        fillB = Math.min(255, Math.round(avgB * 1.3));
      } else if (materialColor === 'Red') {
        fillR = Math.min(255, Math.round(avgR * 1.3));
        fillG = Math.round(avgG * 0.7);
        fillB = Math.round(avgB * 0.5);
      } else if (materialColor === 'Green') {
        fillR = Math.round(avgR * 0.5);
        fillG = Math.min(255, Math.round(avgG * 1.3));
        fillB = Math.round(avgB * 0.7);
      }
      
      // Draw the extruded shape
      tempCtx.save();
      
      // Main face color
      tempCtx.fillStyle = `rgb(${fillR}, ${fillG}, ${fillB})`;
      
      if (shape === 'Cube') {
        // Draw main face
        tempCtx.fillRect(x, y, blockWidth, blockHeight);
        
        // Draw side faces based on light direction
        if (extrusionHeight > 0) {
          // Side face 1 (darker)
          const sideFace1R = Math.max(0, fillR - 40);
          const sideFace1G = Math.max(0, fillG - 40);
          const sideFace1B = Math.max(0, fillB - 40);
          tempCtx.fillStyle = `rgb(${sideFace1R}, ${sideFace1G}, ${sideFace1B})`;
          
          if (lightX > 0) {
            // Light from right, draw left face
            tempCtx.beginPath();
            tempCtx.moveTo(x, y);
            tempCtx.lineTo(x, y + blockHeight);
            tempCtx.lineTo(x - extrusionHeight, y + blockHeight + extrusionHeight);
            tempCtx.lineTo(x - extrusionHeight, y + extrusionHeight);
            tempCtx.closePath();
            tempCtx.fill();
          } else {
            // Light from left, draw right face
            tempCtx.beginPath();
            tempCtx.moveTo(x + blockWidth, y);
            tempCtx.lineTo(x + blockWidth, y + blockHeight);
            tempCtx.lineTo(x + blockWidth + extrusionHeight, y + blockHeight + extrusionHeight);
            tempCtx.lineTo(x + blockWidth + extrusionHeight, y + extrusionHeight);
            tempCtx.closePath();
            tempCtx.fill();
          }
          
          // Side face 2 (even darker)
          const sideFace2R = Math.max(0, fillR - 70);
          const sideFace2G = Math.max(0, fillG - 70);
          const sideFace2B = Math.max(0, fillB - 70);
          tempCtx.fillStyle = `rgb(${sideFace2R}, ${sideFace2G}, ${sideFace2B})`;
          
          if (lightY > 0) {
            // Light from bottom, draw top face
            tempCtx.beginPath();
            tempCtx.moveTo(x, y);
            tempCtx.lineTo(x + blockWidth, y);
            tempCtx.lineTo(x + blockWidth + extrusionHeight, y + extrusionHeight);
            tempCtx.lineTo(x - extrusionHeight, y + extrusionHeight);
            tempCtx.closePath();
            tempCtx.fill();
          } else {
            // Light from top, draw bottom face
            tempCtx.beginPath();
            tempCtx.moveTo(x, y + blockHeight);
            tempCtx.lineTo(x + blockWidth, y + blockHeight);
            tempCtx.lineTo(x + blockWidth + extrusionHeight, y + blockHeight + extrusionHeight);
            tempCtx.lineTo(x - extrusionHeight, y + blockHeight + extrusionHeight);
            tempCtx.closePath();
            tempCtx.fill();
          }
        }
      } 
      else if (shape === 'Pyramid') {
        // Calculate pyramid apex at center of block
        const centerX = x + blockWidth / 2;
        const centerY = y + blockHeight / 2;
        const apexX = centerX;
        const apexY = centerY - extrusionHeight;
        
        // Draw pyramid faces
        // Face 1
        const face1R = Math.max(0, fillR - 20);
        const face1G = Math.max(0, fillG - 20);
        const face1B = Math.max(0, fillB - 20);
        tempCtx.fillStyle = `rgb(${face1R}, ${face1G}, ${face1B})`;
        tempCtx.beginPath();
        tempCtx.moveTo(x, y);
        tempCtx.lineTo(x + blockWidth, y);
        tempCtx.lineTo(apexX, apexY);
        tempCtx.closePath();
        tempCtx.fill();
        
        // Face 2
        const face2R = Math.max(0, fillR - 40);
        const face2G = Math.max(0, fillG - 40);
        const face2B = Math.max(0, fillB - 40);
        tempCtx.fillStyle = `rgb(${face2R}, ${face2G}, ${face2B})`;
        tempCtx.beginPath();
        tempCtx.moveTo(x + blockWidth, y);
        tempCtx.lineTo(x + blockWidth, y + blockHeight);
        tempCtx.lineTo(apexX, apexY);
        tempCtx.closePath();
        tempCtx.fill();
        
        // Face 3
        const face3R = Math.max(0, fillR - 60);
        const face3G = Math.max(0, fillG - 60);
        const face3B = Math.max(0, fillB - 60);
        tempCtx.fillStyle = `rgb(${face3R}, ${face3G}, ${face3B})`;
        tempCtx.beginPath();
        tempCtx.moveTo(x + blockWidth, y + blockHeight);
        tempCtx.lineTo(x, y + blockHeight);
        tempCtx.lineTo(apexX, apexY);
        tempCtx.closePath();
        tempCtx.fill();
        
        // Face 4
        const face4R = Math.max(0, fillR - 80);
        const face4G = Math.max(0, fillG - 80);
        const face4B = Math.max(0, fillB - 80);
        tempCtx.fillStyle = `rgb(${face4R}, ${face4G}, ${face4B})`;
        tempCtx.beginPath();
        tempCtx.moveTo(x, y + blockHeight);
        tempCtx.lineTo(x, y);
        tempCtx.lineTo(apexX, apexY);
        tempCtx.closePath();
        tempCtx.fill();
      } 
      else if (shape === 'Bevel') {
        // Draw beveled shape
        const bevelSize = Math.min(blockWidth, blockHeight, extrusionHeight) / 3;
        
        // Main face (slightly smaller for bevel)
        tempCtx.fillRect(
          x + bevelSize, 
          y + bevelSize, 
          blockWidth - 2 * bevelSize, 
          blockHeight - 2 * bevelSize
        );
        
        // Bevel edges with gradient
        const bevelR = Math.max(0, fillR - 30);
        const bevelG = Math.max(0, fillG - 30);
        const bevelB = Math.max(0, fillB - 30);
        tempCtx.fillStyle = `rgb(${bevelR}, ${bevelG}, ${bevelB})`;
        
        // Top bevel
        tempCtx.beginPath();
        tempCtx.moveTo(x, y);
        tempCtx.lineTo(x + blockWidth, y);
        tempCtx.lineTo(x + blockWidth - bevelSize, y + bevelSize);
        tempCtx.lineTo(x + bevelSize, y + bevelSize);
        tempCtx.closePath();
        tempCtx.fill();
        
        // Right bevel
        tempCtx.beginPath();
        tempCtx.moveTo(x + blockWidth, y);
        tempCtx.lineTo(x + blockWidth, y + blockHeight);
        tempCtx.lineTo(x + blockWidth - bevelSize, y + blockHeight - bevelSize);
        tempCtx.lineTo(x + blockWidth - bevelSize, y + bevelSize);
        tempCtx.closePath();
        tempCtx.fill();
        
        // Bottom bevel
        const bottomBevelR = Math.max(0, fillR - 60);
        const bottomBevelG = Math.max(0, fillG - 60);
        const bottomBevelB = Math.max(0, fillB - 60);
        tempCtx.fillStyle = `rgb(${bottomBevelR}, ${bottomBevelG}, ${bottomBevelB})`;
        
        tempCtx.beginPath();
        tempCtx.moveTo(x, y + blockHeight);
        tempCtx.lineTo(x + blockWidth, y + blockHeight);
        tempCtx.lineTo(x + blockWidth - bevelSize, y + blockHeight - bevelSize);
        tempCtx.lineTo(x + bevelSize, y + blockHeight - bevelSize);
        tempCtx.closePath();
        tempCtx.fill();
        
        // Left bevel
        tempCtx.beginPath();
        tempCtx.moveTo(x, y);
        tempCtx.lineTo(x, y + blockHeight);
        tempCtx.lineTo(x + bevelSize, y + blockHeight - bevelSize);
        tempCtx.lineTo(x + bevelSize, y + bevelSize);
        tempCtx.closePath();
        tempCtx.fill();
      }
      
      tempCtx.restore();
    }
  }
  
  // Get the final image data from the temporary canvas
  const tempImageData = tempCtx.getImageData(0, 0, width, height);
  
  // Blend with original if needed or just use the extrude result
  if (blendOriginal) {
    // Simple 50/50 blend (could be parameterized further)
    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        data[i + j] = Math.round((originalData[i + j] + tempImageData.data[i + j]) / 2);
      }
    }
  } else {
    // Use extrude result only
    for (let i = 0; i < data.length; i++) {
      data[i] = tempImageData.data[i];
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
  const brightness = parseInt(String(paramsObj.brightness || '0'));
  const shouldInvert = paramsObj.invert === 'On';
  
  // Calculate brightness adjustment factor
  const brightnessFactor = brightness / 100;
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
  for (let i = 0; i < data.length; i += 4) {
    data[i] = edgeData[i];
    data[i + 1] = edgeData[i + 1];
    data[i + 2] = edgeData[i + 2];
    data[i + 3] = edgeData[i + 3];
    
    // Apply brightness adjustment if needed
    if (brightness !== 0) {
      if (brightnessFactor > 0) {
        // Increase brightness (move toward white)
        for (let j = 0; j < 3; j++) {
          data[i + j] = Math.min(255, data[i + j] + (255 - data[i + j]) * brightnessFactor);
        }
      } else {
        // Decrease brightness (move toward black)
        for (let j = 0; j < 3; j++) {
          data[i + j] = Math.max(0, data[i + j] + data[i + j] * brightnessFactor);
        }
      }
    }
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

// Halftone filter implementation based on the provided requirements
function applyHalftoneFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  ctx: CanvasRenderingContext2D,
  params: any[] = []
): void {
  // Extract parameters
  const paramsObj: Record<string, any> = {};
  params.forEach(param => {
    paramsObj[param.name] = param.value;
  });
  
  // Parse parameters
  const gridSize = parseInt(String(paramsObj.gridSize || '8'));
  const minDotSize = parseFloat(String(paramsObj.minDotSize || '0')) / 100; // Convert from percentage to 0-1 range
  const maxDotSize = parseFloat(String(paramsObj.maxDotSize || '90')) / 100; // Convert from percentage to 0-1 range
  const shape = paramsObj.shape || 'Circle';
  const angle = parseInt(String(paramsObj.angle || '0'));
  const dotColor = paramsObj.dotColor || 'Black';
  const channelMode = paramsObj.channelMode || 'Grayscale';
  
  // Save original image data
  const originalData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i++) {
    originalData[i] = data[i];
  }
  
  // Create a temporary canvas for drawing the halftone pattern
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
  
  // Fill with a background color - will be visible between dots
  if (dotColor === 'Black') {
    tempCtx.fillStyle = 'white';
  } else if (dotColor === 'White') {
    tempCtx.fillStyle = 'black';
  } else {
    tempCtx.fillStyle = 'white'; // Default for Original and Custom
  }
  
  tempCtx.fillRect(0, 0, width, height);
  
  // Define dot color
  let fillColorR = 0, fillColorG = 0, fillColorB = 0;
  
  if (dotColor === 'Black') {
    fillColorR = fillColorG = fillColorB = 0;
  } else if (dotColor === 'White') {
    fillColorR = fillColorG = fillColorB = 255;
  } else if (dotColor === 'Custom') {
    // Some preset custom color - could be parameterized further
    fillColorR = 50;
    fillColorG = 100;
    fillColorB = 200;
  }
  
  // Save context state
  tempCtx.save();
  
  // Note: We don't apply rotation to the entire canvas here anymore
  // The rotation angle will be passed to the drawHalftonePattern function
  // and applied individually to each dot pattern
  
  // Handle different channel modes
  if (channelMode === 'Grayscale') {
    // Process as grayscale
    drawHalftonePattern(
      originalData,
      tempCtx,
      width,
      height,
      gridSize,
      minDotSize,
      maxDotSize,
      shape,
      dotColor === 'Original' ? null : { r: fillColorR, g: fillColorG, b: fillColorB },
      null,
      null,
      angle // Pass the rotation angle to pattern
    );
  } 
  else if (channelMode === 'RGB') {
    // Process R, G, B channels separately with different angles
    // First clear to white/black
    tempCtx.clearRect(0, 0, width, height);
    
    // Calculate base angles for each channel with user's rotation added
    const redAngle = (15 + angle) % 90; // Red at 15° + user angle
    const greenAngle = (75 + angle) % 90; // Green at 75° + user angle
    const blueAngle = (0 + angle) % 90; // Blue at 0° + user angle
    
    // Red channel
    drawHalftonePattern(
      originalData,
      tempCtx,
      width,
      height,
      gridSize,
      minDotSize,
      maxDotSize,
      shape,
      { r: 255, g: 0, b: 0 },
      0, // red channel
      null,
      redAngle // Pass appropriate angle to the pattern
    );
    
    // Green channel
    drawHalftonePattern(
      originalData,
      tempCtx,
      width,
      height,
      gridSize,
      minDotSize,
      maxDotSize,
      shape,
      { r: 0, g: 255, b: 0 },
      1, // green channel
      null,
      greenAngle
    );
    
    // Blue channel
    drawHalftonePattern(
      originalData,
      tempCtx,
      width,
      height,
      gridSize,
      minDotSize,
      maxDotSize,
      shape,
      { r: 0, g: 0, b: 255 },
      2, // blue channel
      null,
      blueAngle
    );
  }
  else if (channelMode === 'CMYK') {
    // Process C, M, Y, K channels separately 
    // First clear to white
    tempCtx.clearRect(0, 0, width, height);
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, width, height);
    tempCtx.globalCompositeOperation = 'multiply'; // Use multiply blend mode to simulate CMYK
    
    // Cyan channel (typically at 15 degrees in print)
    tempCtx.save();
    tempCtx.translate(width / 2, height / 2);
    tempCtx.rotate((15 * Math.PI) / 180);
    tempCtx.translate(-width / 2, -height / 2);
    
    // Use RGB to simulate CMYK
    drawHalftonePattern(
      originalData,
      tempCtx,
      width,
      height,
      gridSize,
      minDotSize,
      maxDotSize,
      shape,
      { r: 0, g: 255, b: 255 }, // Cyan
      null, // all channels
      invertBrightness
    );
    tempCtx.restore();
    
    // Magenta channel (typically at 75 degrees in print)
    tempCtx.save();
    tempCtx.translate(width / 2, height / 2);
    tempCtx.rotate((75 * Math.PI) / 180);
    tempCtx.translate(-width / 2, -height / 2);
    
    drawHalftonePattern(
      originalData,
      tempCtx,
      width,
      height,
      gridSize,
      minDotSize,
      maxDotSize,
      shape,
      { r: 255, g: 0, b: 255 }, // Magenta
      null, // all channels
      invertBrightness
    );
    tempCtx.restore();
    
    // Yellow channel (typically at 0 degrees in print)
    tempCtx.save();
    tempCtx.translate(width / 2, height / 2);
    tempCtx.rotate((0 * Math.PI) / 180);
    tempCtx.translate(-width / 2, -height / 2);
    
    drawHalftonePattern(
      originalData,
      tempCtx,
      width,
      height,
      gridSize,
      minDotSize,
      maxDotSize,
      shape,
      { r: 255, g: 255, b: 0 }, // Yellow
      null, // all channels
      invertBrightness
    );
    tempCtx.restore();
    
    // Black/Key channel (typically at 45 degrees in print)
    tempCtx.save();
    tempCtx.translate(width / 2, height / 2);
    tempCtx.rotate((45 * Math.PI) / 180);
    tempCtx.translate(-width / 2, -height / 2);
    
    drawHalftonePattern(
      originalData,
      tempCtx,
      width,
      height,
      gridSize,
      minDotSize,
      maxDotSize,
      shape,
      { r: 0, g: 0, b: 0 }, // Black
      null, // all channels
      // For K channel we use luminance calculation
      (r, g, b) => {
        const luminance = 0.3 * r + 0.59 * g + 0.11 * b;
        return 255 - luminance; // Inverted for K channel
      }
    );
    tempCtx.restore();
    
    // Reset blend mode
    tempCtx.globalCompositeOperation = 'source-over';
  }
  
  // Restore context state
  tempCtx.restore();
  
  // Get the halftone image data and replace original
  const halftoneData = tempCtx.getImageData(0, 0, width, height).data;
  for (let i = 0; i < data.length; i++) {
    data[i] = halftoneData[i];
  }
  
  // Helper functions
  
  // Function to draw the halftone pattern
  function drawHalftonePattern(
    sourceData: Uint8ClampedArray,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gridSize: number,
    minDotSize: number,
    maxDotSize: number,
    shape: string,
    color: { r: number, g: number, b: number } | null,
    channel: number | null = null,
    brightnessMapper: ((r: number, g: number, b: number) => number) | null = null,
    rotationAngle: number = 0 // Add rotation angle parameter
  ) {
    // Step through the image in grid cells
    for (let y = 0; y < height; y += gridSize) {
      for (let x = 0; x < width; x += gridSize) {
        // Calculate center of the grid cell
        const centerX = x + gridSize / 2;
        const centerY = y + gridSize / 2;
        
        // Get the average brightness in this grid cell
        let brightness = getAverageBrightnessInGrid(sourceData, x, y, gridSize, width, height, channel, brightnessMapper);
        
        // Map brightness to dot size radius (smaller dots for darker areas in normal halftone)
        const radius = mapBrightnessToRadius(brightness, gridSize, minDotSize, maxDotSize);
        
        // Set the fill color
        if (color) {
          ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        } else {
          // Use original image color at this cell
          const centerIdx = ((Math.min(y + Math.floor(gridSize / 2), height - 1)) * width + (Math.min(x + Math.floor(gridSize / 2), width - 1))) * 4;
          const r = sourceData[centerIdx];
          const g = sourceData[centerIdx + 1];
          const b = sourceData[centerIdx + 2];
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        }
        
        // Draw the appropriate shape with rotation
        drawShape(ctx, centerX, centerY, radius, shape, rotationAngle);
      }
    }
  }
  
  // Function to get average brightness in a grid cell
  function getAverageBrightnessInGrid(
    data: Uint8ClampedArray,
    startX: number,
    startY: number,
    gridSize: number,
    width: number,
    height: number,
    channel: number | null = null,
    brightnessMapper: ((r: number, g: number, b: number) => number) | null = null
  ): number {
    let totalBrightness = 0;
    let pixelCount = 0;
    
    const endX = Math.min(startX + gridSize, width);
    const endY = Math.min(startY + gridSize, height);
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * width + x) * 4;
        
        let brightness;
        if (channel !== null) {
          // Use specific RGB channel
          brightness = data[idx + channel]; 
        } else if (brightnessMapper) {
          // Use custom brightness mapping function
          brightness = brightnessMapper(data[idx], data[idx + 1], data[idx + 2]);
        } else {
          // Use standard luminance formula
          brightness = Math.round(0.3 * data[idx] + 0.59 * data[idx + 1] + 0.11 * data[idx + 2]);
        }
        
        totalBrightness += brightness;
        pixelCount++;
      }
    }
    
    return pixelCount > 0 ? totalBrightness / pixelCount : 0;
  }
  
  // Function to map brightness to dot radius
  function mapBrightnessToRadius(brightness: number, gridSize: number, minDotSize: number, maxDotSize: number): number {
    // Map brightness (0-255) to dot size (min to max of grid size)
    const normalizedBrightness = brightness / 255;
    const dotSizeRange = maxDotSize - minDotSize;
    return (normalizedBrightness * dotSizeRange + minDotSize) * (gridSize / 2);
  }
  
  // Function to draw different shapes with rotation
  function drawShape(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, shape: string, angle: number = 0): void {
    // Save the context state to restore later
    ctx.save();
    
    // Apply rotation if needed - translate to the center point, rotate, then translate back
    if (angle !== 0) {
      ctx.translate(x, y);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.translate(-x, -y);
    }
    
    switch (shape) {
      case 'Circle':
        // Circles look the same when rotated, so no special handling needed
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        break;
        
      case 'Square':
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        break;
        
      case 'Line':
        ctx.beginPath();
        ctx.lineWidth = radius / 2;
        ctx.moveTo(x - radius, y);
        ctx.lineTo(x + radius, y);
        ctx.stroke();
        break;
        
      case 'Cross':
        ctx.beginPath();
        ctx.lineWidth = radius / 2;
        ctx.moveTo(x - radius, y);
        ctx.lineTo(x + radius, y);
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x, y + radius);
        ctx.stroke();
        break;
        
      case 'Diamond':
        ctx.beginPath();
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x + radius, y);
        ctx.lineTo(x, y + radius);
        ctx.lineTo(x - radius, y);
        ctx.closePath();
        ctx.fill();
        break;
        
      default:
        // Default to circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Restore the context state
    ctx.restore();
  }
  
  // Function to invert brightness (for CMYK-like effects)
  function invertBrightness(r: number, g: number, b: number): number {
    const luminance = 0.3 * r + 0.59 * g + 0.11 * b;
    return 255 - luminance;
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



// HSY color model conversion functions
// These functions convert between RGB and HSY color spaces
// HSY handles human perception of brightness better than HSL/HSV
function rgbToHsy(r: number, g: number, b: number): [number, number, number] {
  // First normalize RGB values to 0-1 range
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  
  // Calculate perceived luminance using the standard coefficients
  // These coefficients account for human eye sensitivity to different colors
  const y = 0.299 * rn + 0.587 * gn + 0.114 * bn;
  
  // Calculate hue and saturation (similar to HSL calculation)
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const chroma = max - min;
  
  let h = 0;
  if (chroma !== 0) {
    if (max === rn) {
      h = ((gn - bn) / chroma) % 6;
    } else if (max === gn) {
      h = (bn - rn) / chroma + 2;
    } else {
      h = (rn - gn) / chroma + 4;
    }
  }
  
  h = (h * 60) % 360;
  if (h < 0) h += 360;
  
  // Calculate saturation (0 for black/white/gray, higher for more colorful)
  let s = 0;
  if (y > 0 && y < 1) {
    s = chroma / (1 - Math.abs(2 * y - 1));
  }
  
  // Return HSY values (hue in 0-360, saturation and luminance in 0-1)
  return [h, s, y];
}

function hsyToRgb(h: number, s: number, y: number): [number, number, number] {
  // If saturation is 0, it's a shade of gray
  if (s === 0) {
    return [y * 255, y * 255, y * 255];
  }
  
  // Calculate chroma and other HSL intermediates
  const c = (1 - Math.abs(2 * y - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = y - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  // Apply the luminance adjustment and convert back to 0-255 range
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

// Implement blend modes for combining layers
function applyBlendMode(
  destCtx: CanvasRenderingContext2D, 
  srcCtx: CanvasRenderingContext2D, 
  blendMode: BlendMode, 
  opacity: number = 1.0
): void {
  const width = destCtx.canvas.width;
  const height = destCtx.canvas.height;
  
  // Debug information
  console.log(`Applying blend mode: ${blendMode} with opacity: ${opacity}`);
  
  // Get image data from both canvases
  const destData = destCtx.getImageData(0, 0, width, height);
  const srcData = srcCtx.getImageData(0, 0, width, height);
  
  // Process each pixel according to the blend mode
  for (let i = 0; i < destData.data.length; i += 4) {
    // Get source and destination pixel values
    const srcR = srcData.data[i];
    const srcG = srcData.data[i + 1];
    const srcB = srcData.data[i + 2];
    const srcA = (srcData.data[i + 3] / 255) * opacity; // Apply opacity to the source/blend layer
    
    const destR = destData.data[i];
    const destG = destData.data[i + 1];
    const destB = destData.data[i + 2];
    
    // Skip fully transparent pixels in blend layer
    if (srcA === 0) continue;
    
    // Calculate blended values based on blend mode
    let resultR = 0, resultG = 0, resultB = 0;
    
    // Process boundaries and areas of high contrast differently to create
    // more interesting algorithmic interaction (the "filter baby" effect)
    const contrast = Math.abs(srcR - destR) + Math.abs(srcG - destG) + Math.abs(srcB - destB);
    const isHighContrast = contrast > 100; // Threshold for high contrast areas
    
    // Normalize blend mode to lowercase for case-insensitive comparison
    const normalizedBlendMode = typeof blendMode === 'string' ? blendMode.toLowerCase() : 'normal';
    
    switch (normalizedBlendMode) {
      case 'normal':
        resultR = srcR;
        resultG = srcG;
        resultB = srcB;
        break;
        
      case 'multiply':
        resultR = (destR * srcR) / 255;
        resultG = (destG * srcG) / 255;
        resultB = (destB * srcB) / 255;
        break;
        
      case 'screen':
        resultR = 255 - ((255 - destR) * (255 - srcR)) / 255;
        resultG = 255 - ((255 - destG) * (255 - srcG)) / 255;
        resultB = 255 - ((255 - destB) * (255 - srcB)) / 255;
        break;
        
      case 'overlay':
        resultR = destR < 128 ? (2 * destR * srcR) / 255 : 255 - 2 * ((255 - destR) * (255 - srcR)) / 255;
        resultG = destG < 128 ? (2 * destG * srcG) / 255 : 255 - 2 * ((255 - destG) * (255 - srcG)) / 255;
        resultB = destB < 128 ? (2 * destB * srcB) / 255 : 255 - 2 * ((255 - destB) * (255 - srcB)) / 255;
        break;
        
      case 'darken':
        resultR = Math.min(destR, srcR);
        resultG = Math.min(destG, srcG);
        resultB = Math.min(destB, srcB);
        break;
        
      case 'lighten':
        resultR = Math.max(destR, srcR);
        resultG = Math.max(destG, srcG);
        resultB = Math.max(destB, srcB);
        break;
        
      case 'color-dodge':
        resultR = destR === 0 ? 0 : srcR === 255 ? 255 : Math.min(255, (destR * 255) / (255 - srcR));
        resultG = destG === 0 ? 0 : srcG === 255 ? 255 : Math.min(255, (destG * 255) / (255 - srcG));
        resultB = destB === 0 ? 0 : srcB === 255 ? 255 : Math.min(255, (destB * 255) / (255 - srcB));
        break;
        
      case 'color-burn':
        resultR = destR === 255 ? 255 : srcR === 0 ? 0 : 255 - Math.min(255, ((255 - destR) * 255) / srcR);
        resultG = destG === 255 ? 255 : srcG === 0 ? 0 : 255 - Math.min(255, ((255 - destG) * 255) / srcG);
        resultB = destB === 255 ? 255 : srcB === 0 ? 0 : 255 - Math.min(255, ((255 - destB) * 255) / srcB);
        break;
        
      case 'hard-light':
        resultR = srcR < 128 ? (2 * srcR * destR) / 255 : 255 - 2 * ((255 - srcR) * (255 - destR)) / 255;
        resultG = srcG < 128 ? (2 * srcG * destG) / 255 : 255 - 2 * ((255 - srcG) * (255 - destG)) / 255;
        resultB = srcB < 128 ? (2 * srcB * destB) / 255 : 255 - 2 * ((255 - srcB) * (255 - destB)) / 255;
        break;
        
      case 'soft-light':
        const softLight = (a: number, b: number) => {
          return b < 128 ? 
            2 * ((a * b) / 255) + ((a * a) / 255) * (1 - 2 * (b / 255)) :
            2 * (a * (1 - b / 255)) + Math.sqrt(a / 255) * (2 * b - 255);
        };
        resultR = softLight(destR, srcR);
        resultG = softLight(destG, srcG);
        resultB = softLight(destB, srcB);
        break;
        
      case 'difference':
        resultR = Math.abs(destR - srcR);
        resultG = Math.abs(destG - srcG);
        resultB = Math.abs(destB - srcB);
        break;
        
      case 'exclusion':
        resultR = destR + srcR - (2 * destR * srcR) / 255;
        resultG = destG + srcG - (2 * destG * srcG) / 255;
        resultB = destB + srcB - (2 * destB * srcB) / 255;
        break;
        
      case 'linear-light':
        resultR = srcR < 128 
          ? Math.max(0, destR + 2 * srcR - 255)
          : Math.min(255, destR + 2 * (srcR - 128));
        resultG = srcG < 128 
          ? Math.max(0, destG + 2 * srcG - 255)
          : Math.min(255, destG + 2 * (srcG - 128));
        resultB = srcB < 128 
          ? Math.max(0, destB + 2 * srcB - 255)
          : Math.min(255, destB + 2 * (srcB - 128));
        break;
        
      case 'vivid-light':
        resultR = srcR < 128 
          ? (destR === 0 ? 0 : Math.max(0, 255 - ((255 - 2 * srcR) * 255) / destR))
          : (destR === 255 ? 255 : Math.min(255, ((2 * srcR - 256) * 255) / (255 - destR)));
        resultG = srcG < 128 
          ? (destG === 0 ? 0 : Math.max(0, 255 - ((255 - 2 * srcG) * 255) / destG))
          : (destG === 255 ? 255 : Math.min(255, ((2 * srcG - 256) * 255) / (255 - destG)));
        resultB = srcB < 128 
          ? (destB === 0 ? 0 : Math.max(0, 255 - ((255 - 2 * srcB) * 255) / destB))
          : (destB === 255 ? 255 : Math.min(255, ((2 * srcB - 256) * 255) / (255 - destB)));
        break;
      
      case 'add':
        resultR = Math.min(255, destR + srcR);
        resultG = Math.min(255, destG + srcG);
        resultB = Math.min(255, destB + srcB);
        break;
        
      case 'subtract':
        resultR = Math.max(0, destR - srcR);
        resultG = Math.max(0, destG - srcG);
        resultB = Math.max(0, destB - srcB);
        break;
        
      case 'divide':
        resultR = srcR === 0 ? 255 : Math.min(255, (destR / srcR) * 255);
        resultG = srcG === 0 ? 255 : Math.min(255, (destG / srcG) * 255);
        resultB = srcB === 0 ? 255 : Math.min(255, (destB / srcB) * 255);
        break;
        
      // Additional blend modes using HSY color model for perception-based blending
      case 'hue':
        // Take hue from source, saturation and luminance from destination
        const destHsy = rgbToHsy(destR, destG, destB);
        const srcHsy = rgbToHsy(srcR, srcG, srcB);
        const hueResult = hsyToRgb(srcHsy[0], destHsy[1], destHsy[2]);
        resultR = hueResult[0];
        resultG = hueResult[1];
        resultB = hueResult[2];
        break;
        
      case 'saturation':
        // Take saturation from source, hue and luminance from destination
        const destHsySat = rgbToHsy(destR, destG, destB);
        const srcHsySat = rgbToHsy(srcR, srcG, srcB);
        const satResult = hsyToRgb(destHsySat[0], srcHsySat[1], destHsySat[2]);
        resultR = satResult[0];
        resultG = satResult[1];
        resultB = satResult[2];
        break;
        
      case 'color':
        // Take hue and saturation from source, luminance from destination
        const destHsyColor = rgbToHsy(destR, destG, destB);
        const srcHsyColor = rgbToHsy(srcR, srcG, srcB);
        const colorResult = hsyToRgb(srcHsyColor[0], srcHsyColor[1], destHsyColor[2]);
        resultR = colorResult[0];
        resultG = colorResult[1];
        resultB = colorResult[2];
        break;
        
      case 'luminosity':
        // Take luminance from source, hue and saturation from destination
        const destHsyLum = rgbToHsy(destR, destG, destB);
        const srcHsyLum = rgbToHsy(srcR, srcG, srcB);
        const lumResult = hsyToRgb(destHsyLum[0], destHsyLum[1], srcHsyLum[2]);
        resultR = lumResult[0];
        resultG = lumResult[1];
        resultB = lumResult[2];
        break;
        
      default:
        // Default to normal blend if the mode isn't recognized
        console.warn(`Unrecognized blend mode: ${blendMode}, defaulting to normal`);
        resultR = srcR;
        resultG = srcG;
        resultB = srcB;
        break;
    }
    
    // Apply opacity to the blended result
    resultR = destR + (resultR - destR) * opacity * srcA;
    resultG = destG + (resultG - destG) * opacity * srcA;
    resultB = destB + (resultB - destB) * opacity * srcA;
    
    // Create the "filter baby" effect at high contrast boundaries
    // This helps create a more interesting algorithmic combination of the two filters
    if (isHighContrast) {
      // Calculate a blend factor based on contrast
      const blendFactor = Math.min(1.0, contrast / 300);
      
      // Create subtle variation at boundaries to enhance the algorithmic interaction
      const variation = Math.sin(i * 0.01) * 15 * blendFactor;
      
      // Apply the variation to create more interesting hybrid effects at boundaries
      resultR = Math.min(255, Math.max(0, resultR + variation));
      resultG = Math.min(255, Math.max(0, resultG + variation));
      resultB = Math.min(255, Math.max(0, resultB + variation));
    }
    
    // Write back the blended values
    destData.data[i] = Math.round(resultR);
    destData.data[i + 1] = Math.round(resultG);
    destData.data[i + 2] = Math.round(resultB);
  }
  
  // Log that we've completed the blend operation
  console.log(`Completed blend with mode: ${blendMode}`);
  
  // Put the modified pixels back on the destination canvas
  destCtx.putImageData(destData, 0, 0);
}

// Blend filter implementation
function applyBlendFilter(
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
  
  // Note: This function is no longer directly used for blending two inputs
  // Instead, the BlendNode uses processBlendNode directly which handles the two inputs
  // This function remains for compatibility with the filter system
  
  // We'll just apply a simple tint effect to demonstrate that this filter was applied
  const tint = Math.random() * 30; // Small random tint to show the filter effect
  
  for (let i = 0; i < data.length; i += 4) {
    // Apply a subtle tint to show the filter effect
    data[i] = Math.min(255, data[i] + tint);
    data[i + 1] = Math.min(255, data[i + 1] + tint);
    data[i + 2] = Math.min(255, data[i + 2] + tint);
  }
}

// Motion Blur filter implementation
function applyMotionBlurFilter(
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
  
  const distance = parseInt(String(paramsObj.distance || 20));
  const angle = parseInt(String(paramsObj.angle || 45)) * Math.PI / 180; // Convert to radians
  const centerWeighted = paramsObj.centerWeighted === 'On';
  const blurMode = paramsObj.blurMode || 'Linear';
  
  // Make a copy of the original data
  const originalData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i++) {
    originalData[i] = data[i];
  }
  
  // Number of samples to take along the motion path
  const samples = Math.max(3, Math.ceil(distance / 2));
  
  // Apply motion blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      let sumR = 0, sumG = 0, sumB = 0, weightSum = 0;
      
      // For each sample along the motion path
      for (let s = -samples; s <= samples; s++) {
        // Calculate sample position
        let sampleX = x, sampleY = y;
        const t = s / samples;
        
        if (blurMode === 'Linear') {
          // Linear motion blur
          sampleX = x + Math.cos(angle) * distance * t;
          sampleY = y + Math.sin(angle) * distance * t;
        } else if (blurMode === 'Radial') {
          // Radial motion blur from center
          const centerX = width / 2;
          const centerY = height / 2;
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const sampleAngle = Math.atan2(dy, dx);
          
          sampleX = centerX + Math.cos(sampleAngle) * (dist + t * distance);
          sampleY = centerY + Math.sin(sampleAngle) * (dist + t * distance);
        } else if (blurMode === 'Zoom') {
          // Zoom motion blur
          const centerX = width / 2;
          const centerY = height / 2;
          const dx = x - centerX;
          const dy = y - centerY;
          
          sampleX = centerX + dx * (1 + t * distance / 100);
          sampleY = centerY + dy * (1 + t * distance / 100);
        }
        
        // Ensure sample is in bounds
        if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
          // Bilinear sampling would be better, but for simplicity use nearest-neighbor
          const sx = Math.round(sampleX);
          const sy = Math.round(sampleY);
          const sampleIndex = (sy * width + sx) * 4;
          
          let weight = 1.0;
          
          // Center weighted blur decreases sample weight as we move away from center
          if (centerWeighted) {
            weight = 1.0 - Math.abs(t);
          }
          
          sumR += originalData[sampleIndex] * weight;
          sumG += originalData[sampleIndex + 1] * weight;
          sumB += originalData[sampleIndex + 2] * weight;
          weightSum += weight;
        }
      }
      
      // Write averaged result back to image
      if (weightSum > 0) {
        data[pixelIndex] = Math.round(sumR / weightSum);
        data[pixelIndex + 1] = Math.round(sumG / weightSum);
        data[pixelIndex + 2] = Math.round(sumB / weightSum);
      }
    }
  }
}

// Noise Distortion filter implementation
function applyNoiseDistortionFilter(
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
  
  const amplitude = parseInt(String(paramsObj.amplitude || 20));
  const scale = parseFloat(String(paramsObj.scale || 0.1));
  const biasX = parseInt(String(paramsObj.biasX || 100)) / 100;
  const biasY = parseInt(String(paramsObj.biasY || 100)) / 100;
  const seed = parseInt(String(paramsObj.seed || 42));
  const noiseType = paramsObj.noiseType || 'Perlin';
  
  // Initialize noise generator with seed
  const randomSeed = () => {
    let s = seed;
    return function() {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  };
  const random = randomSeed();
  const noise2D = createNoise2D(() => random());
  
  // Make a copy of the original data
  const originalData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i++) {
    originalData[i] = data[i];
  }
  
  // Create distortion map
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      // Generate two independent noise values for X and Y offsets
      let noiseX, noiseY;
      
      if (noiseType === 'Perlin' || noiseType === 'Simplex') {
        // Basic Perlin/Simplex noise
        noiseX = noise2D(x * scale, y * scale);
        noiseY = noise2D((x + 9999) * scale, (y + 9999) * scale); // Offset for independence
      } else if (noiseType === 'Worley') {
        // Simplified Worley (cellular) noise - using a kind of hash function
        const cellSize = 1 / scale;
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
        
        // Find distance to nearest "feature point"
        let minDist = 1.0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            // Pseudo-random position in each cell
            const hash = Math.sin(cellX + i * 13.5 + (cellY + j * 17.7) * 31.1 + seed) * 43758.5453;
            const fractHash = hash - Math.floor(hash);
            
            const featX = (cellX + i) * cellSize + fractHash * cellSize;
            const featY = (cellY + j) * cellSize + fractHash * cellSize;
            
            const dx = featX - x;
            const dy = featY - y;
            const dist = Math.sqrt(dx * dx + dy * dy) / cellSize;
            
            minDist = Math.min(minDist, dist);
          }
        }
        
        noiseX = minDist * 2 - 1;
        noiseY = (1 - minDist) * 2 - 1;
      } else if (noiseType === 'FBM' || noiseType === 'Ridged') {
        // Fractal Brownian Motion (FBM) noise
        let valueX = 0, valueY = 0;
        let amplitude = 1.0;
        let frequency = scale;
        
        for (let o = 0; o < 4; o++) {
          let noiseValueX = noise2D(x * frequency, y * frequency);
          let noiseValueY = noise2D((x + 9999) * frequency, (y + 9999) * frequency);
          
          if (noiseType === 'Ridged') {
            // Ridged multifractal: 1.0 - abs(noise)
            noiseValueX = 1.0 - Math.abs(noiseValueX);
            noiseValueY = 1.0 - Math.abs(noiseValueY);
          }
          
          valueX += noiseValueX * amplitude;
          valueY += noiseValueY * amplitude;
          
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        noiseX = valueX;
        noiseY = valueY;
      } else {
        // Fallback to simple Perlin
        noiseX = noise2D(x * scale, y * scale);
        noiseY = noise2D((x + 9999) * scale, (y + 9999) * scale);
      }
      
      // Scale noise to appropriate displacement range
      const displaceX = Math.round(noiseX * amplitude * biasX);
      const displaceY = Math.round(noiseY * amplitude * biasY);
      
      // Calculate source pixel coordinates with displacement
      const sourceX = Math.min(Math.max(0, x + displaceX), width - 1);
      const sourceY = Math.min(Math.max(0, y + displaceY), height - 1);
      const sourceIndex = (sourceY * width + sourceX) * 4;
      
      // Copy pixel from displaced position
      data[pixelIndex] = originalData[sourceIndex];
      data[pixelIndex + 1] = originalData[sourceIndex + 1];
      data[pixelIndex + 2] = originalData[sourceIndex + 2];
    }
  }
}
