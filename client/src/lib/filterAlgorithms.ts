import { Node, Edge } from 'reactflow';
import { FilterNodeData, FilterType, ImageNodeData, BlendMode } from '@/types';

// Function to apply image overlay with blend mode and opacity
function applyImageBlending(
  ctx: CanvasRenderingContext2D, 
  canvas: HTMLCanvasElement, 
  overlayImage: HTMLImageElement, 
  blendMode: string = 'normal',
  opacity: number = 100
) {
  // Save current context state
  ctx.save();
  
  // Set global alpha for opacity
  ctx.globalAlpha = opacity / 100;
  
  // Set blend mode
  ctx.globalCompositeOperation = convertBlendMode(blendMode);
  
  // Calculate dimensions to maintain aspect ratio but fill the canvas
  const canvasRatio = canvas.width / canvas.height;
  const imageRatio = overlayImage.width / overlayImage.height;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (canvasRatio > imageRatio) {
    // Canvas is wider than image - scale image to fill width
    drawWidth = canvas.width;
    drawHeight = canvas.width / imageRatio;
    drawX = 0;
    drawY = (canvas.height - drawHeight) / 2;
  } else {
    // Canvas is taller than image - scale image to fill height
    drawHeight = canvas.height;
    drawWidth = canvas.height * imageRatio;
    drawX = (canvas.width - drawWidth) / 2;
    drawY = 0;
  }
  
  // Draw the overlay image
  ctx.drawImage(overlayImage, drawX, drawY, drawWidth, drawHeight);
  
  // Restore context to previous state (except for the pixels we've drawn)
  ctx.restore();
}

// Convert our blend mode strings to canvas globalCompositeOperation values
function convertBlendMode(blendMode: string): GlobalCompositeOperation {
  switch (blendMode) {
    case 'normal': return 'source-over';
    case 'multiply': return 'multiply';
    case 'screen': return 'screen';
    case 'overlay': return 'overlay';
    case 'darken': return 'darken';
    case 'lighten': return 'lighten';
    case 'color-dodge': return 'color-dodge';
    case 'color-burn': return 'color-burn';
    case 'hard-light': return 'hard-light';
    case 'soft-light': return 'soft-light';
    case 'difference': return 'difference';
    case 'exclusion': return 'exclusion';
    default: return 'source-over';
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
    
    // Add node to the beginning of the path (we're working backward)
    path.unshift(node);
    
    // Find the source node that connects to the current node
    const sourceNode = getSourceNode(currentNodeId, nodes, edges);
    if (!sourceNode) break;
    
    // Move to the next node up the chain
    currentNodeId = sourceNode.id;
    iterations++;
  }
  
  // Make sure we have the source image node at the start
  const sourceImageNode = nodes.find(node => node.type === 'imageNode');
  if (sourceImageNode && !path.some(node => node.id === sourceImageNode.id)) {
    path.unshift(sourceImageNode);
  }
  
  return path;
};

// Main function to apply filters
export const applyFilters = (
  sourceImage: HTMLImageElement,
  nodes: Node[],
  edges: Edge[],
  canvas: HTMLCanvasElement,
  targetNodeId?: string,
  outputNodeId?: string
): string | null => {
  // Find the source node
  const sourceNode = nodes.find(node => node.type === 'imageNode');
  if (!sourceNode) return null;
  
  // Process nodes differently based on which nodes were specified
  let nodesToProcess;
  
  if (targetNodeId && outputNodeId) {
    // If both target and output are specified, find the path from target to output
    const targetNode = nodes.find(node => node.id === targetNodeId);
    const outputNode = nodes.find(node => node.id === outputNodeId);
    
    if (targetNode && outputNode) {
      const pathToTarget = getPathToNode(targetNodeId, nodes, edges);
      const pathToOutput = getPathToNode(outputNodeId, nodes, edges);
      
      // Determine which path to use based on whether target is in path to output
      const targetInPathToOutput = pathToOutput.some(node => node.id === targetNodeId);
      
      if (targetInPathToOutput) {
        // If target is in path to output, use subpath from target to output
        const targetIndex = pathToOutput.findIndex(node => node.id === targetNodeId);
        nodesToProcess = pathToOutput.slice(targetIndex);
      } else {
        // Otherwise, just process to the target
        nodesToProcess = pathToTarget;
      }
    } else {
      // Fall back to just target if we can't find one of the nodes
      nodesToProcess = targetNodeId 
        ? getPathToNode(targetNodeId, nodes, edges)
        : buildProcessingChain(sourceNode.id, nodes, edges);
    }
  } else if (outputNodeId) {
    // If only output node specified, process path to output
    nodesToProcess = getPathToNode(outputNodeId, nodes, edges);
  } else {
    // Otherwise use standard processing
    nodesToProcess = targetNodeId 
      ? getPathToNode(targetNodeId, nodes, edges)
      : buildProcessingChain(sourceNode.id, nodes, edges);
  }

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
    
    if (node.type === 'filterNode' || node.type === 'imageFilterNode') {
      const filterData = node.data as FilterNodeData;
      // Skip disabled filters
      if (!filterData.enabled) continue;
      
      // Convert FilterParam array to the expected format (only using name and value)
      const convertedParams = filterData.params?.map(param => ({
        name: param.name,
        value: typeof param.value === 'boolean' ? (param.value ? 1 : 0) : param.value
      })) || [];
      
      // Add blend mode and opacity parameters for image nodes
      if (node.type === 'imageFilterNode') {
        convertedParams.push({ name: 'blendMode', value: filterData.blendMode });
        convertedParams.push({ name: 'opacity', value: filterData.opacity });
      }
      
      // Special handling for mask filter - need to find the mask input
      let nodeDataWithMask = node.data;
      if (filterData.filterType === 'mask') {
        // Find edges connecting to this mask node
        const maskEdges = edges.filter(edge => edge.target === node.id);
        
        // Look for ANY node connected as mask - but exclude the main source image connection
        const sourceImageNode = nodes.find(n => n.type === 'imageNode');
        const maskSourceEdge = maskEdges.find(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          // Only accept nodes that are NOT the main source image
          return sourceNode && sourceNode.id !== sourceImageNode?.id;
        });
        
        if (maskSourceEdge) {
          const maskSourceNode = nodes.find(n => n.id === maskSourceEdge.source);
          if (maskSourceNode) {
            // Generate the mask pattern based on node type
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = canvas.width;
            maskCanvas.height = canvas.height;
            const maskCtx = maskCanvas.getContext('2d');
            
            if (maskCtx && maskSourceNode.data) {
              const maskNodeData = maskSourceNode.data as FilterNodeData;
              
              console.log("Mask source node type:", maskNodeData.filterType, "Node type:", maskSourceNode.type);
              
              if (maskSourceNode.type === 'generatorNode') {
                // Handle generator nodes (checkerboard, perlinNoise, etc.)
                if (maskNodeData.filterType === 'checkerboard') {
                  console.log("Generating checkerboard mask pattern");
                  generateCheckerboardPattern(maskCtx, maskCanvas, maskNodeData);
                } else if (maskNodeData.filterType === 'perlinNoise') {
                  console.log("Generating Perlin noise mask pattern");
                  generatePerlinNoisePattern(maskCtx, maskCanvas, maskNodeData);
                  
                  // Debug: Check what the Perlin noise actually looks like
                  const debugImageData = maskCtx.getImageData(0, 0, Math.min(20, maskCanvas.width), 1);
                  const debugSample = [];
                  for (let i = 0; i < Math.min(20, debugImageData.data.length); i += 4) {
                    debugSample.push({
                      r: debugImageData.data[i],
                      g: debugImageData.data[i + 1],
                      b: debugImageData.data[i + 2]
                    });
                  }
                  console.log("Perlin noise mask first 5 pixels:", debugSample.slice(0, 5));
                } else {
                  console.warn("Unknown mask generator type:", maskNodeData.filterType);
                }
              } else if (maskSourceNode.type === 'filterNode') {
                // Handle filter nodes - apply their filter to create a mask
                console.log("Creating mask from filter node");
                
                // Create a base white canvas for the filter to work on
                maskCtx.fillStyle = 'white';
                maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
                
                // Apply the filter to create the mask pattern
                if (maskNodeData.filterType && maskNodeData.params) {
                  const maskParams = maskNodeData.params.map(param => ({
                    name: param.name,
                    value: typeof param.value === 'boolean' ? (param.value ? 1 : 0) : param.value
                  }));
                  
                  // Apply the filter to the white canvas to create the mask
                  applyFilter(maskNodeData.filterType, maskCtx, maskCanvas, maskParams, maskNodeData);
                  
                  // Convert the result to grayscale for masking
                  const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
                  convertToGrayscaleMask(imageData.data);
                  maskCtx.putImageData(imageData, 0, 0);
                }
              } else if (maskSourceNode.type === 'imageFilterNode' || maskSourceNode.type === 'imageNode') {
                // Handle uploaded image nodes as mask input
                console.log("Using uploaded image as mask");
                
                // Get the image data from the node - check multiple possible data locations
                const imageNodeData = maskSourceNode.data as any;
                console.log("Debug: Image node data structure:", Object.keys(imageNodeData || {}));
                console.log("Debug: Full imageNodeData:", imageNodeData);
                let imageSource = null;
                
                // Check for different ways image data might be stored
                if (imageNodeData.imageUrl) {
                  imageSource = imageNodeData.imageUrl;
                  console.log("Found imageUrl:", imageSource);
                } else if (imageNodeData.src) {
                  imageSource = imageNodeData.src;
                  console.log("Found src:", imageSource);
                } else if (imageNodeData.params) {
                  console.log("Checking params:", imageNodeData.params);
                  // Check for image data in params (for ImageFilterNode)
                  const imageParam = imageNodeData.params.find((p: any) => p.name === 'image-data' || p.id === 'image-data');
                  if (imageParam && imageParam.value) {
                    imageSource = imageParam.value;
                    console.log("Found image in params:", imageSource.substring(0, 50) + "...");
                  }
                } else {
                  console.log("No params found in imageNodeData");
                }
                
                if (imageSource) {
                  console.log("Found image source for mask:", imageSource.substring(0, 50) + "...");
                  
                  // Look for existing loaded images in the DOM
                  let foundImage: HTMLImageElement | null = null;
                  document.querySelectorAll('img').forEach(img => {
                    if (img.src === imageSource && img.complete && img.naturalWidth > 0) {
                      foundImage = img;
                    }
                  });
                  
                  if (foundImage) {
                    console.log("Using already loaded image for mask");
                    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
                    maskCtx.drawImage(foundImage, 0, 0, maskCanvas.width, maskCanvas.height);
                    
                    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
                    convertToGrayscaleMask(imageData.data);
                    maskCtx.putImageData(imageData, 0, 0);
                  } else {
                    // Try to load the image
                    const maskImage = new Image();
                    maskImage.crossOrigin = 'anonymous';
                    maskImage.onload = () => {
                      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
                      maskCtx.drawImage(maskImage, 0, 0, maskCanvas.width, maskCanvas.height);
                      
                      const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
                      convertToGrayscaleMask(imageData.data);
                      maskCtx.putImageData(imageData, 0, 0);
                      console.log("Loaded and processed mask image");
                    };
                    maskImage.onerror = () => {
                      console.warn("Failed to load mask image, using white fallback");
                      maskCtx.fillStyle = 'white';
                      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
                    };
                    maskImage.src = imageSource;
                    
                    // Provide immediate fallback
                    console.log("Creating temporary pattern while image loads");
                    const imgData = maskCtx.createImageData(maskCanvas.width, maskCanvas.height);
                    const data = imgData.data;
                    for (let i = 0; i < data.length; i += 4) {
                      data[i] = 128;     // Gray fallback
                      data[i + 1] = 128;
                      data[i + 2] = 128;
                      data[i + 3] = 255;
                    }
                    maskCtx.putImageData(imgData, 0, 0);
                  }
                } else {
                  console.warn("Image node missing imageUrl/src/image-data");
                  maskCtx.fillStyle = 'white';
                  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
                }
              }
              
              const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
              
              // Add mask data to node data
              nodeDataWithMask = {
                ...node.data,
                maskImageData: maskImageData.data
              };
            }
          }
        } else {
          // No mask input connected - skip mask processing entirely
          console.log("No mask input connected, skipping mask filter");
          continue; // Skip this filter node entirely if no mask is connected
        }
      }
      
      if (filterData.filterType) {
        applyFilter(filterData.filterType, ctx, canvas, convertedParams, nodeDataWithMask);
      }
    }
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

// Generate checkerboard pattern for mask
function generateCheckerboardPattern(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  nodeData: FilterNodeData
): void {
  const params = nodeData.params || [];
  
  // Extract parameters
  const repeatH = Number(params.find(p => p.name === 'repeatH')?.value || 8);
  const repeatV = Number(params.find(p => p.name === 'repeatV')?.value || 8);
  const color1 = String(params.find(p => p.name === 'color1')?.value || '#ffffff');
  const color2 = String(params.find(p => p.name === 'color2')?.value || '#000000');
  
  const cellWidth = canvas.width / repeatH;
  const cellHeight = canvas.height / repeatV;
  
  // Draw checkerboard pattern
  for (let row = 0; row < repeatV; row++) {
    for (let col = 0; col < repeatH; col++) {
      const isEven = (row + col) % 2 === 0;
      ctx.fillStyle = isEven ? color1 : color2;
      
      ctx.fillRect(
        col * cellWidth,
        row * cellHeight,
        cellWidth,
        cellHeight
      );
    }
  }
}

// Generate Perlin noise pattern for mask
function generatePerlinNoisePattern(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  nodeData: FilterNodeData
): void {
  const params = nodeData.params || [];
  
  // Extract parameters with proper defaults
  const width = Number(params.find(p => p.name === 'width')?.value || canvas.width);
  const height = Number(params.find(p => p.name === 'height')?.value || canvas.height);
  const scale = Number(params.find(p => p.name === 'scale')?.value || 4.0);
  const seed = Number(params.find(p => p.name === 'seed')?.value || 0);
  
  console.log("Generating Perlin noise with params:", { width, height, scale, seed });
  
  // Create ImageData for the noise
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  
  // Improved Perlin-like noise implementation to match the diagonal pattern
  const seedOffset = seed * 12.345;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const nx = (x / canvas.width) * scale + seedOffset;
      const ny = (y / canvas.height) * scale + seedOffset;
      
      // Create diagonal hatch pattern similar to what's shown in the Perlin noise preview
      const noise1 = Math.sin(nx * 3.14159 + ny * 3.14159) * 0.5 + 0.5;
      const noise2 = Math.sin(nx * 6.28318 - ny * 2.0) * 0.3;
      const noise3 = Math.sin(nx * 1.5 + ny * 1.5) * 0.2;
      
      const combinedNoise = (noise1 + noise2 + noise3) / 1.5;
      const clampedNoise = Math.max(0, Math.min(1, combinedNoise));
      const value = Math.floor(clampedNoise * 255);
      
      const index = (y * canvas.width + x) * 4;
      data[index] = value;     // Red
      data[index + 1] = value; // Green
      data[index + 2] = value; // Blue
      data[index + 3] = 255;   // Alpha
    }
  }
  
  // Put the noise data on the canvas
  ctx.putImageData(imageData, 0, 0);
  console.log("Perlin noise pattern generated successfully");
}

// Convert image data to grayscale mask values
function convertToGrayscaleMask(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate luminance using Rec.709 formula
    const luminance = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    
    // Set RGB to luminance value (creates grayscale)
    data[i] = luminance;     // Red
    data[i + 1] = luminance; // Green
    data[i + 2] = luminance; // Blue
    // Keep original alpha
  }
}

// Canvas-based mask filter implementation
function applyMaskFilterCanvas(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  maskData: Uint8ClampedArray,
  useLuma: boolean = false
): void {
  console.log("Applying mask filter - useLuma:", useLuma);
  
  // Apply mask to each pixel
  for (let i = 0; i < data.length; i += 4) {
    const sourceR = data[i];
    const sourceG = data[i + 1];
    const sourceB = data[i + 2];
    const sourceA = data[i + 3];
    
    const maskR = maskData[i];
    const maskG = maskData[i + 1];
    const maskB = maskData[i + 2];
    const maskA = maskData[i + 3];
    
    // Calculate mask value based on mode
    let maskValue: number;
    const luminance = (0.2126 * maskR + 0.7152 * maskG + 0.0722 * maskB) / 255;
    
    if (useLuma) {
      // Luma mode: WHITE pixels are masked out (become transparent)
      maskValue = 1.0 - luminance; // Invert: white=0 (transparent), black=1 (visible)
    } else {
      // Non-luma mode: BLACK pixels are masked out (become transparent)
      maskValue = luminance; // Direct: black=0 (transparent), white=1 (visible)
    }
    
    // Apply mask as transparency - keep RGB colors, modify alpha
    data[i] = sourceR;     // Keep original Red
    data[i + 1] = sourceG; // Keep original Green
    data[i + 2] = sourceB; // Keep original Blue
    data[i + 3] = Math.round(sourceA * maskValue); // Apply mask to alpha for transparency
  }
}

// Helper to get parameter value with fallback
const getParamValue = (params: { name: string; value: number | string }[], name: string, defaultValue: number): number => {
  const param = params.find(p => p.name === name);
  return param ? Number(param.value) : defaultValue;
};

// Apply a specific filter based on type
const applyFilter = (
  filterType: FilterType,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  params: { name: string; value: number | string }[],
  nodeData?: any
): void => {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let data = imageData.data;
  
  switch (filterType) {
    case 'mask':
      // Handle mask filter - requires both source and mask inputs
      const lumaParam = params.find(p => p.name === 'lumaMode')?.value;
      const useLuma = lumaParam === true || lumaParam === 1 || lumaParam === 'true';
      
      console.log("Applying mask filter with luma mode:", useLuma);
      
      // Check if we have mask data from the preprocessing step
      if (nodeData?.maskImageData) {
        console.log("Using preprocessed mask data");
        applyMaskFilterCanvas(data, canvas.width, canvas.height, nodeData.maskImageData, useLuma);
      } else {
        console.warn("No mask data available for mask filter");
      }
      break;
      
    case 'image':
      // Handle image node - overlay a texture image on top of the filter chain
      const blendMode = params.find(p => p.name === 'blendMode')?.value as string || 'normal';
      const opacity = Number(params.find(p => p.name === 'opacity')?.value || 100);
      
      // First put the current filter chain data back to the canvas
      ctx.putImageData(imageData, 0, 0);
      
      // Get current canvas content (previous filter results) before applying the image
      // Note: We must preserve the original state of the canvas that was passed to this node
      const currentCanvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use pre-loaded texture pixels if available (from the node data)
      if (nodeData && nodeData.texturePixels) {
        console.log("Image node: Using preloaded texture with blend mode:", blendMode);
        
        try {
          // Get the texture pixels we preloaded during upload
          const texturePixels = nodeData.texturePixels;
          
          // Create a temporary canvas for the texture
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) break;
          
          // Set dimensions for the temp canvas (same as main canvas)
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          
          // First, draw the current canvas content (the result of previous filters)
          tempCtx.putImageData(currentCanvasData, 0, 0);
          
          // Create another canvas just for the texture image
          const textureCanvas = document.createElement('canvas');
          const textureCtx = textureCanvas.getContext('2d');
          if (!textureCtx) break;
          
          // Adjust texture canvas to original texture size
          textureCanvas.width = texturePixels.width;
          textureCanvas.height = texturePixels.height;
          
          // Draw the texture pixels
          textureCtx.putImageData(texturePixels, 0, 0);
          
          // Now apply the texture with blend mode on the temp canvas
          tempCtx.save();
          tempCtx.globalAlpha = opacity / 100;
          tempCtx.globalCompositeOperation = convertBlendMode(blendMode);
          
          // Draw the texture scaled to fit the temp canvas
          tempCtx.drawImage(
            textureCanvas, 
            0, 0, textureCanvas.width, textureCanvas.height,
            0, 0, tempCanvas.width, tempCanvas.height
          );
          
          tempCtx.restore();
          
          // Now draw the combined result back to the main canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempCanvas, 0, 0);
          
          // Update the imageData variable to reflect the updated canvas
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          data = imageData.data;
          
          console.log("Image node: Texture applied successfully");
        } catch (error) {
          console.error("Error applying texture from image node:", error);
        }
      }
      break;
      
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
  }
  
  ctx.putImageData(imageData, 0, 0);
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
