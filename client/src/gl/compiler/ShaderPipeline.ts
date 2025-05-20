/**
 * ShaderPipeline.ts
 * 
 * Implements the pipeline that compiles a ReactFlow node graph into
 * optimized WebGL shader code. This is the core of the filter engine's
 * GPU acceleration system.
 */

import { Node, Edge } from 'reactflow';
import { CompiledGraph, CompiledNode } from './GraphCompiler';
import { GLShader } from '../core/GLShader';
import { generateFusedShaderSource } from '../shaders/fusedShaderTemplate';
import { FilterNodeData, ImageNodeData } from '@/types';

export interface ShaderPipelineNode {
  id: string;
  type: string;
  shader: GLShader;
  uniforms: Record<string, any>;
  inputs: string[];
  outputs: string[];
}

export interface ShaderPipeline {
  nodes: ShaderPipelineNode[];
  entryPoints: string[];
  exitPoints: string[];
  uniforms: Record<string, any>;
}

export class ShaderPipelineBuilder {
  /**
   * Build a shader pipeline from a ReactFlow graph
   */
  public static buildPipeline(nodes: Node[], edges: Edge[]): ShaderPipeline {
    // Create a map of node IDs to their indices
    const nodeMap = new Map<string, Node>();
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
    });
    
    // Create a dependency graph
    const dependencyMap = new Map<string, string[]>();
    const outputMap = new Map<string, string[]>();
    
    // Initialize maps
    nodes.forEach(node => {
      dependencyMap.set(node.id, []);
      outputMap.set(node.id, []);
    });
    
    // Build dependency and output maps from edges
    edges.forEach(edge => {
      const sourceId = edge.source;
      const targetId = edge.target;
      
      // Add target as dependent on source
      const dependencies = dependencyMap.get(targetId) || [];
      dependencies.push(sourceId);
      dependencyMap.set(targetId, dependencies);
      
      // Add source as output to target
      const outputs = outputMap.get(sourceId) || [];
      outputs.push(targetId);
      outputMap.set(sourceId, outputs);
    });
    
    // Find entry points (nodes with no inputs)
    const entryPoints: string[] = [];
    nodes.forEach(node => {
      const deps = dependencyMap.get(node.id) || [];
      if (deps.length === 0) {
        entryPoints.push(node.id);
      }
    });
    
    // Find exit points (nodes with no outputs)
    const exitPoints: string[] = [];
    nodes.forEach(node => {
      const outputs = outputMap.get(node.id) || [];
      if (outputs.length === 0) {
        exitPoints.push(node.id);
      }
    });
    
    // Perform topological sort to get execution order
    const visitedNodes = new Set<string>();
    const executionOrder: string[] = [];
    
    const visit = (nodeId: string) => {
      // Skip if already visited
      if (visitedNodes.has(nodeId)) return;
      
      // Mark as visited
      visitedNodes.add(nodeId);
      
      // Visit all dependencies first
      const dependencies = dependencyMap.get(nodeId) || [];
      for (const depId of dependencies) {
        visit(depId);
      }
      
      // Add to execution order
      executionOrder.push(nodeId);
    };
    
    // Visit all nodes starting from exit points
    for (const exitId of exitPoints) {
      visit(exitId);
    }
    
    // If not all nodes were visited, visit remaining entry points
    for (const entryId of entryPoints) {
      if (!visitedNodes.has(entryId)) {
        visit(entryId);
      }
    }
    
    // Finally, visit any remaining nodes
    nodes.forEach(node => {
      if (!visitedNodes.has(node.id)) {
        visit(node.id);
      }
    });
    
    // Create shader pipeline nodes
    const pipelineNodes: ShaderPipelineNode[] = [];
    const pipelineUniforms: Record<string, any> = {};
    
    // Create nodes in execution order
    executionOrder.forEach(nodeId => {
      const node = nodeMap.get(nodeId);
      if (!node) return;
      
      const inputs = dependencyMap.get(nodeId) || [];
      const outputs = outputMap.get(nodeId) || [];
      
      // Create shader based on node type
      let shader: GLShader | null = null;
      const uniforms: Record<string, any> = {};
      
      switch (node.type) {
        case 'imageNode':
          // Image nodes provide textures
          const imageData = node.data as ImageNodeData;
          shader = this.createImageNodeShader(nodeId, imageData);
          
          // Add source image as a uniform
          if (imageData.src) {
            uniforms[`u_${nodeId}_texture`] = imageData.src;
          }
          break;
          
        case 'filterNode':
          // Filter nodes apply effects
          const filterData = node.data as FilterNodeData;
          shader = this.createFilterNodeShader(nodeId, filterData, inputs);
          
          // Add filter parameters as uniforms
          if (filterData.filter?.params) {
            filterData.filter.params.forEach(param => {
              uniforms[`u_${nodeId}_${param.id}`] = param.value;
            });
          }
          
          // Add blend mode and opacity
          if (filterData.blendMode) {
            uniforms[`u_${nodeId}_blendMode`] = filterData.blendMode;
          }
          
          if (typeof filterData.opacity === 'number') {
            uniforms[`u_${nodeId}_opacity`] = filterData.opacity;
          } else {
            uniforms[`u_${nodeId}_opacity`] = 1.0; // Default opacity
          }
          break;
          
        case 'outputNode':
          // Output nodes just pass through
          shader = this.createOutputNodeShader(nodeId);
          break;
          
        default:
          // Unknown node type
          console.warn(`Unknown node type: ${node.type}`);
          break;
      }
      
      // Add to pipeline if shader was created
      if (shader) {
        pipelineNodes.push({
          id: nodeId,
          type: node.type,
          shader,
          uniforms,
          inputs,
          outputs
        });
        
        // Add uniforms to pipeline uniforms
        Object.assign(pipelineUniforms, uniforms);
      }
    });
    
    return {
      nodes: pipelineNodes,
      entryPoints,
      exitPoints,
      uniforms: pipelineUniforms
    };
  }
  
  /**
   * Create a shader for an image node
   */
  private static createImageNodeShader(nodeId: string, nodeData: ImageNodeData): GLShader {
    // Create a simple passthrough shader
    const fragmentSource = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_${nodeId}_texture;
out vec4 fragColor;

void main() {
  fragColor = texture(u_${nodeId}_texture, v_texCoord);
}`;
    
    return new GLShader(`shader_${nodeId}`, fragmentSource, `Image node shader for ${nodeId}`);
  }
  
  /**
   * Create a shader for a filter node
   */
  private static createFilterNodeShader(
    nodeId: string, 
    nodeData: FilterNodeData, 
    inputs: string[]
  ): GLShader {
    const filterType = nodeData.filter?.type || 'passthrough';
    const params = nodeData.filter?.params || [];
    
    // Build uniform declarations
    const uniformDeclarations: string[] = [];
    
    // Input texture uniform (from previous node)
    if (inputs.length > 0) {
      uniformDeclarations.push(`uniform sampler2D u_${inputs[0]}_output;`);
    }
    
    // Parameter uniforms
    params.forEach(param => {
      const uniformType = this.getUniformTypeForParam(param.value);
      uniformDeclarations.push(`uniform ${uniformType} u_${nodeId}_${param.id};`);
    });
    
    // Blend mode and opacity uniforms
    uniformDeclarations.push(`uniform float u_${nodeId}_opacity;`);
    
    // Generate shader functions for this filter type
    const shaderFunctions: string[] = this.generateShaderFunctionsForFilter(filterType);
    
    // Generate main code based on filter type
    const mainCode = this.generateMainCodeForFilter(
      nodeId, 
      filterType, 
      params.map(p => p.id),
      inputs
    );
    
    // Generate the full shader source
    const fragmentSource = generateFusedShaderSource(
      uniformDeclarations,
      shaderFunctions,
      [mainCode]
    );
    
    return new GLShader(
      `shader_${nodeId}`, 
      fragmentSource, 
      `Filter shader for ${nodeId} (${filterType})`
    );
  }
  
  /**
   * Create a shader for an output node
   */
  private static createOutputNodeShader(nodeId: string): GLShader {
    // Simple passthrough shader
    const fragmentSource = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_inputTexture;
out vec4 fragColor;

void main() {
  fragColor = texture(u_inputTexture, v_texCoord);
}`;
    
    return new GLShader(`shader_${nodeId}`, fragmentSource, `Output node shader for ${nodeId}`);
  }
  
  /**
   * Get GLSL uniform type for a parameter value
   */
  private static getUniformTypeForParam(value: any): string {
    if (typeof value === 'number') {
      return 'float';
    } else if (typeof value === 'boolean') {
      return 'bool';
    } else if (Array.isArray(value)) {
      if (value.length === 2) return 'vec2';
      if (value.length === 3) return 'vec3';
      if (value.length === 4) return 'vec4';
    }
    
    // Default to float
    return 'float';
  }
  
  /**
   * Generate shader functions for a specific filter type
   */
  private static generateShaderFunctionsForFilter(filterType: string): string[] {
    const functions: string[] = [];
    
    switch (filterType) {
      case 'blur':
        functions.push(`
// Gaussian blur function
vec4 applyGaussianBlur(sampler2D tex, vec2 uv, vec2 resolution, float radius) {
  vec4 color = vec4(0.0);
  float total = 0.0;
  
  // Calculate pixel size
  vec2 pixelSize = 1.0 / resolution;
  
  // Apply blur in both directions
  for (float x = -radius; x <= radius; x += 1.0) {
    for (float y = -radius; y <= radius; y += 1.0) {
      vec2 offset = vec2(x, y) * pixelSize;
      float weight = gaussian(length(offset) / pixelSize.x, radius * 0.5);
      color += texture(tex, uv + offset) * weight;
      total += weight;
    }
  }
  
  return color / total;
}`);
        break;
        
      case 'sharpen':
        functions.push(`
// Sharpen function
vec4 applySharpen(sampler2D tex, vec2 uv, vec2 resolution, float strength) {
  vec2 pixelSize = 1.0 / resolution;
  
  // Sample center and neighboring pixels
  vec4 center = texture(tex, uv);
  vec4 top = texture(tex, uv + vec2(0.0, pixelSize.y));
  vec4 bottom = texture(tex, uv + vec2(0.0, -pixelSize.y));
  vec4 left = texture(tex, uv + vec2(-pixelSize.x, 0.0));
  vec4 right = texture(tex, uv + vec2(pixelSize.x, 0.0));
  
  // Apply sharpening
  vec4 result = center * (1.0 + 4.0 * strength) - (top + bottom + left + right) * strength;
  
  return clamp(result, 0.0, 1.0);
}`);
        break;
        
      case 'grayscale':
        functions.push(`
// Grayscale function
vec4 applyGrayscale(vec4 color, float intensity) {
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  vec3 grayColor = vec3(gray);
  return vec4(mix(color.rgb, grayColor, intensity), color.a);
}`);
        break;
        
      case 'invert':
        functions.push(`
// Invert function
vec4 applyInvert(vec4 color, float intensity) {
  vec3 inverted = 1.0 - color.rgb;
  return vec4(mix(color.rgb, inverted, intensity), color.a);
}`);
        break;
        
      case 'noise':
        functions.push(`
// Pseudo-random number generator
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Apply noise function
vec4 applyNoise(vec4 color, vec2 uv, float amount) {
  float noise = random(uv) * amount;
  return vec4(color.rgb + vec3(noise - amount * 0.5), color.a);
}`);
        break;
        
      // Add more filter function implementations as needed
      
      default:
        // No functions needed for passthrough
        break;
    }
    
    return functions;
  }
  
  /**
   * Generate the main code for a specific filter type
   */
  private static generateMainCodeForFilter(
    nodeId: string,
    filterType: string,
    paramIds: string[],
    inputs: string[]
  ): string {
    let mainCode = '';
    
    // First, get the input texture
    if (inputs.length > 0) {
      mainCode += `// Get input from previous node\n`;
      mainCode += `vec4 inputColor_${nodeId} = texture(u_${inputs[0]}_output, v_texCoord);\n`;
    } else {
      mainCode += `// No inputs, use default color\n`;
      mainCode += `vec4 inputColor_${nodeId} = color;\n`;
    }
    
    // Apply the filter effect
    switch (filterType) {
      case 'blur':
        mainCode += `// Apply gaussian blur\n`;
        mainCode += `vec4 filteredColor_${nodeId} = applyGaussianBlur(`;
        mainCode += `u_${inputs[0]}_output, v_texCoord, u_resolution, `;
        
        // Get radius parameter
        const radiusParamId = paramIds.find(id => id === 'radius') || paramIds[0];
        mainCode += `u_${nodeId}_${radiusParamId});\n`;
        break;
        
      case 'sharpen':
        mainCode += `// Apply sharpen effect\n`;
        mainCode += `vec4 filteredColor_${nodeId} = applySharpen(`;
        mainCode += `u_${inputs[0]}_output, v_texCoord, u_resolution, `;
        
        // Get strength parameter
        const strengthParamId = paramIds.find(id => id === 'strength') || paramIds[0];
        mainCode += `u_${nodeId}_${strengthParamId});\n`;
        break;
        
      case 'grayscale':
        mainCode += `// Apply grayscale effect\n`;
        mainCode += `vec4 filteredColor_${nodeId} = applyGrayscale(`;
        mainCode += `inputColor_${nodeId}, `;
        
        // Get intensity parameter
        const intensityParamId = paramIds.find(id => id === 'intensity') || paramIds[0];
        mainCode += `u_${nodeId}_${intensityParamId});\n`;
        break;
        
      case 'invert':
        mainCode += `// Apply invert effect\n`;
        mainCode += `vec4 filteredColor_${nodeId} = applyInvert(`;
        mainCode += `inputColor_${nodeId}, `;
        
        // Get intensity parameter
        const invertIntensityParamId = paramIds.find(id => id === 'intensity') || paramIds[0];
        mainCode += `u_${nodeId}_${invertIntensityParamId});\n`;
        break;
        
      case 'noise':
        mainCode += `// Apply noise effect\n`;
        mainCode += `vec4 filteredColor_${nodeId} = applyNoise(`;
        mainCode += `inputColor_${nodeId}, v_texCoord, `;
        
        // Get amount parameter
        const amountParamId = paramIds.find(id => id === 'amount') || paramIds[0];
        mainCode += `u_${nodeId}_${amountParamId});\n`;
        break;
        
      // Add more filter implementations as needed
      
      default:
        // Passthrough
        mainCode += `// Passthrough filter\n`;
        mainCode += `vec4 filteredColor_${nodeId} = inputColor_${nodeId};\n`;
        break;
    }
    
    // Apply opacity / blend
    mainCode += `// Apply opacity\n`;
    mainCode += `filteredColor_${nodeId} = mix(inputColor_${nodeId}, filteredColor_${nodeId}, u_${nodeId}_opacity);\n`;
    
    // Set as output
    mainCode += `// Set as output for this node\n`;
    mainCode += `color = filteredColor_${nodeId};\n`;
    
    return mainCode;
  }
  
  /**
   * Generate a single fused shader from a pipeline
   * that combines multiple filter effects into one efficient shader
   */
  public static generateFusedShader(pipeline: ShaderPipeline): GLShader | null {
    if (pipeline.nodes.length === 0) return null;
    
    // Collect all uniform declarations, functions, and main code from nodes
    const uniformDeclarations: string[] = [];
    const functions: string[] = [];
    const mainCode: string[] = [];
    
    // Special uniform for input texture
    uniformDeclarations.push('uniform sampler2D u_inputTexture;');
    uniformDeclarations.push('uniform vec2 u_resolution;');
    
    // Extract shader parts from each pipeline node
    pipeline.nodes.forEach(node => {
      const source = node.shader.getFragmentSource();
      
      // Extract uniform declarations
      extractUniforms(source).forEach(uniform => {
        if (!uniformDeclarations.includes(uniform)) {
          uniformDeclarations.push(uniform);
        }
      });
      
      // Extract functions
      extractFunctions(source).forEach(func => {
        if (!functions.some(f => f.startsWith(func.split('(')[0]))) {
          functions.push(func);
        }
      });
      
      // Extract main code
      const mainCodeBlock = extractMainCode(source);
      if (mainCodeBlock) {
        mainCode.push(`// Code from node ${node.id}\n${mainCodeBlock}`);
      }
    });
    
    // Generate the fused shader source
    const fusedSource = generateFusedShaderSource(
      uniformDeclarations,
      functions,
      mainCode
    );
    
    return new GLShader(
      'fused_pipeline_shader',
      fusedSource,
      'Automatically fused shader pipeline'
    );
  }
}

/**
 * Helper function to extract uniform declarations from shader source
 */
function extractUniforms(source: string): string[] {
  const uniforms: string[] = [];
  const lines = source.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('uniform') && trimmed.includes(';')) {
      uniforms.push(trimmed);
    }
  }
  
  return uniforms;
}

/**
 * Helper function to extract function declarations from shader source
 */
function extractFunctions(source: string): string[] {
  const functions: string[] = [];
  const lines = source.split('\n');
  
  let inFunction = false;
  let currentFunction = '';
  let braceCount = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip if in main function
    if (trimmed.startsWith('void main()')) {
      inFunction = false;
      continue;
    }
    
    // Check for function start
    if (!inFunction && 
        (trimmed.startsWith('vec4 ') || 
         trimmed.startsWith('vec3 ') || 
         trimmed.startsWith('vec2 ') || 
         trimmed.startsWith('float ') ||
         trimmed.startsWith('void '))) {
      
      if (trimmed.includes('(') && !trimmed.includes(';')) {
        inFunction = true;
        currentFunction = line + '\n';
        
        // Count opening braces
        braceCount = (trimmed.match(/{/g) || []).length;
        braceCount -= (trimmed.match(/}/g) || []).length;
        
        // If function is complete on this line, add it
        if (braceCount === 0 && trimmed.includes('}')) {
          functions.push(currentFunction);
          inFunction = false;
          currentFunction = '';
        }
        
        continue;
      }
    }
    
    // If in a function, add the line
    if (inFunction) {
      currentFunction += line + '\n';
      
      // Count braces to track function end
      braceCount += (trimmed.match(/{/g) || []).length;
      braceCount -= (trimmed.match(/}/g) || []).length;
      
      // If function is complete, add it
      if (braceCount === 0) {
        functions.push(currentFunction);
        inFunction = false;
        currentFunction = '';
      }
    }
  }
  
  return functions;
}

/**
 * Helper function to extract the main function body from shader source
 */
function extractMainCode(source: string): string | null {
  const mainStart = source.indexOf('void main()');
  if (mainStart === -1) return null;
  
  // Find the opening brace
  const braceStart = source.indexOf('{', mainStart);
  if (braceStart === -1) return null;
  
  // Find the matching closing brace
  let braceCount = 1;
  let position = braceStart + 1;
  
  while (braceCount > 0 && position < source.length) {
    const char = source[position];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
    }
    position++;
  }
  
  if (braceCount !== 0) return null;
  
  // Return content between braces
  return source.substring(braceStart + 1, position - 1).trim();
}