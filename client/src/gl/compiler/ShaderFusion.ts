/**
 * ShaderFusion.ts
 * 
 * Implements the fusion of multiple shader nodes into a single optimized shader.
 * This is a key optimization that generates one GLSL fragment shader from a DAG
 * of filter nodes, eliminating intermediate texture reads/writes.
 */

import { CompiledGraph, CompiledNode } from './GraphCompiler';
import { GLShader } from '../core/GLShader';

// Represents a code block in the fused shader
interface ShaderCodeBlock {
  id: string;
  uniformDeclarations: string;
  functionDeclarations: string;
  mainCode: string;
  inputs: string[];
  output: string;
  parameters: Record<string, any>;
}

export class ShaderFusion {
  /**
   * Fuse multiple shader nodes into a single optimized shader
   */
  public static fuseNodes(compiledGraph: CompiledGraph): CompiledGraph {
    // First identify fusion candidates - chains of compatible nodes
    const fusionGroups = this.identifyFusionCandidates(compiledGraph);
    
    // If no fusion groups, return original graph
    if (fusionGroups.length === 0) {
      return compiledGraph;
    }
    
    // Generate fused shaders for each group
    const fusedNodes: CompiledNode[] = [];
    const processedNodeIds = new Set<string>();
    
    // Process each fusion group
    for (const group of fusionGroups) {
      // Generate fused shader
      const fusedNode = this.generateFusedNode(group, compiledGraph);
      if (fusedNode) {
        fusedNodes.push(fusedNode);
        
        // Mark nodes as processed
        group.forEach(nodeId => processedNodeIds.add(nodeId));
      }
    }
    
    // Add remaining nodes that weren't fused
    for (const node of compiledGraph.nodes) {
      if (!processedNodeIds.has(node.id)) {
        fusedNodes.push(node);
      }
    }
    
    // Return new compiled graph with fused nodes
    return {
      nodes: fusedNodes,
      inputNodes: compiledGraph.inputNodes,
      outputNodes: compiledGraph.outputNodes
    };
  }
  
  /**
   * Identify groups of nodes that can be fused together
   */
  private static identifyFusionCandidates(compiledGraph: CompiledGraph): string[][] {
    const fusionGroups: string[][] = [];
    
    // Build a node map for quick access
    const nodeMap = new Map<string, CompiledNode>();
    compiledGraph.nodes.forEach(node => {
      nodeMap.set(node.id, node);
    });
    
    // Build adjacency list for the graph
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();
    
    compiledGraph.nodes.forEach(node => {
      outgoing.set(node.id, []);
      incoming.set(node.id, []);
    });
    
    // Populate adjacency lists
    compiledGraph.nodes.forEach(node => {
      node.inputs.forEach(inputId => {
        outgoing.get(inputId)?.push(node.id);
        incoming.get(node.id)?.push(inputId);
      });
    });
    
    // Function to check if a node can be part of a fusion chain
    const canFuse = (nodeId: string): boolean => {
      const node = nodeMap.get(nodeId);
      if (!node) return false;
      
      // Image nodes typically can't be fused (they need to load textures)
      if (node.parameters.imageUrl) return false;
      
      // Nodes with multiple inputs are harder to fuse
      if (node.inputs.length > 1) return false;
      
      // Nodes with multiple outputs are harder to fuse
      const outputs = outgoing.get(nodeId) || [];
      if (outputs.length > 1) return false;
      
      return true;
    };
    
    // Start from input nodes
    const visited = new Set<string>();
    
    // Function to trace a chain of fusible nodes
    const traceChain = (startNodeId: string): string[] => {
      const chain: string[] = [];
      let currentId = startNodeId;
      
      // Add first node if it can be fused
      if (canFuse(currentId)) {
        chain.push(currentId);
        visited.add(currentId);
      } else {
        return chain;
      }
      
      // Follow chain of fusible nodes
      while (true) {
        const outputs = outgoing.get(currentId) || [];
        if (outputs.length !== 1) break;
        
        const nextId = outputs[0];
        if (visited.has(nextId) || !canFuse(nextId)) break;
        
        chain.push(nextId);
        visited.add(nextId);
        currentId = nextId;
      }
      
      return chain;
    };
    
    // Identify fusion chains starting from input nodes
    compiledGraph.inputNodes.forEach(nodeId => {
      if (!visited.has(nodeId)) {
        const chain = traceChain(nodeId);
        if (chain.length > 1) {
          fusionGroups.push(chain);
        }
      }
    });
    
    // Identify fusion chains starting from remaining nodes
    compiledGraph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const chain = traceChain(node.id);
        if (chain.length > 1) {
          fusionGroups.push(chain);
        }
      }
    });
    
    return fusionGroups;
  }
  
  /**
   * Generate a fused shader node from a group of nodes
   */
  private static generateFusedNode(
    nodeIds: string[], 
    compiledGraph: CompiledGraph
  ): CompiledNode | null {
    if (nodeIds.length === 0) return null;
    
    // Get nodes in the group
    const nodes = nodeIds.map(id => {
      return compiledGraph.nodes.find(n => n.id === id);
    }).filter(Boolean) as CompiledNode[];
    
    if (nodes.length === 0) return null;
    
    // Extract the shader code blocks for each node
    const codeBlocks: ShaderCodeBlock[] = [];
    
    for (const node of nodes) {
      const shader = node.shader;
      
      // Extract shader source
      const fragmentSource = shader.getFragmentSource();
      
      // Parse shader to extract different sections
      const uniformSection = this.extractSection(fragmentSource, 'uniform', 'in');
      const functionSection = this.extractSection(fragmentSource, 'float|vec4|vec3|vec2', 'void main');
      const mainSection = this.extractSection(fragmentSource, 'void main\\(\\)', '');
      
      // Get main code body from between braces
      const mainBody = this.extractBetweenBraces(mainSection);
      
      codeBlocks.push({
        id: node.id,
        uniformDeclarations: uniformSection || '',
        functionDeclarations: functionSection || '',
        mainCode: mainBody || '',
        inputs: node.inputs,
        output: node.output,
        parameters: node.parameters
      });
    }
    
    // Generate the fused shader
    return this.createFusedNode(nodes[0].id, codeBlocks, nodes);
  }
  
  /**
   * Extract a section of shader code between specified patterns
   */
  private static extractSection(
    source: string, 
    startPattern: string, 
    endPattern: string
  ): string {
    const startRegex = new RegExp(startPattern);
    const startMatch = startRegex.exec(source);
    if (!startMatch) return '';
    
    const startIdx = startMatch.index;
    
    // If no end pattern, return rest of source
    if (!endPattern) {
      return source.substring(startIdx);
    }
    
    const endRegex = new RegExp(endPattern);
    const endMatch = endRegex.exec(source.substring(startIdx));
    if (!endMatch) return '';
    
    const endIdx = startIdx + endMatch.index;
    
    return source.substring(startIdx, endIdx);
  }
  
  /**
   * Extract code between the innermost set of braces
   */
  private static extractBetweenBraces(source: string): string {
    const braceStart = source.indexOf('{');
    if (braceStart === -1) return '';
    
    // Find matching closing brace
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
    
    if (braceCount !== 0) return '';
    
    // Return content between braces
    return source.substring(braceStart + 1, position - 1).trim();
  }
  
  /**
   * Create a fused node from code blocks
   */
  private static createFusedNode(
    fusedId: string,
    codeBlocks: ShaderCodeBlock[],
    originalNodes: CompiledNode[]
  ): CompiledNode {
    // Generate a unique name for the fused shader
    const fusedName = `fused_${fusedId}`;
    
    // Collect all unique uniform declarations
    const uniqueUniforms = new Map<string, string>();
    const uniqueFunctions = new Set<string>();
    
    // Collect uniform declarations
    codeBlocks.forEach(block => {
      // Split uniforms by semicolon
      const uniforms = block.uniformDeclarations.split(';');
      
      // Add each uniform to the map
      uniforms.forEach(uniform => {
        const trimmed = uniform.trim();
        if (trimmed) {
          // Extract uniform name
          const parts = trimmed.split(' ');
          if (parts.length >= 3) {
            const name = parts[parts.length - 1];
            // Use name as key to de-duplicate
            uniqueUniforms.set(name, trimmed);
          }
        }
      });
      
      // Add functions
      if (block.functionDeclarations) {
        uniqueFunctions.add(block.functionDeclarations);
      }
    });
    
    // Build the fused shader source
    let fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Output color
out vec4 fragColor;

// Fused uniforms
${Array.from(uniqueUniforms.values()).join(';\n')};

// Fused functions
${Array.from(uniqueFunctions).join('\n\n')}

void main() {
  // Sample input texture
  vec4 color = texture(u_inputTexture, v_texCoord);
  
  // Fused filter chain
`;
    
    // Add main code from each block, replacing variable references as needed
    for (let i = 0; i < codeBlocks.length; i++) {
      const block = codeBlocks[i];
      
      fragmentSource += `
  // Block ${i + 1}: ${block.id}
  {
    ${block.mainCode}
  }
`;
    }
    
    // Close main function
    fragmentSource += `
  // Output final color
  fragColor = color;
}
`;
    
    // Create new fused shader
    const fusedShader = new GLShader(fusedName, fragmentSource, `Fused shader from ${codeBlocks.length} filters`);
    
    // Add uniforms from original shaders
    originalNodes.forEach(node => {
      node.shader.getUniforms().forEach((uniform, name) => {
        fusedShader.addUniform({
          name,
          type: uniform.type,
          value: uniform.value,
          description: uniform.description
        });
      });
    });
    
    // Get inputs and parameters from first node in chain
    const inputs = originalNodes[0].inputs;
    const parameters = originalNodes.reduce((params, node) => {
      return { ...params, ...node.parameters };
    }, {});
    
    // Use the output of the last node
    const output = originalNodes[originalNodes.length - 1].output;
    
    // Return the fused node
    return {
      id: fusedId,
      shader: fusedShader,
      inputs,
      output,
      parameters
    };
  }
}