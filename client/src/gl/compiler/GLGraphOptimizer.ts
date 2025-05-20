/**
 * GLGraphOptimizer.ts
 * 
 * Handles optimization of the filter graph for GPU-accelerated rendering.
 * This includes graph pruning, shader fusion, and execution planning.
 */

import { Node, Edge } from 'reactflow';
import { CompiledGraph, CompiledNode } from './GraphCompiler';
import { ShaderFusion } from './ShaderFusion';
import { GLShader } from '../core/GLShader';

export class GLGraphOptimizer {
  /**
   * Optimize a compiled graph for GPU rendering
   */
  public optimizeGraph(compiledGraph: CompiledGraph): CompiledGraph {
    // First, apply shader fusion for compatible node chains
    const fusedGraph = ShaderFusion.fuseNodes(compiledGraph);
    
    // Then apply other optimizations
    const prunedGraph = this.pruneDisabledNodes(fusedGraph);
    const reorderedGraph = this.reorderForEfficiency(prunedGraph);
    
    return reorderedGraph;
  }
  
  /**
   * Remove disabled nodes from the execution path
   */
  private pruneDisabledNodes(graph: CompiledGraph): CompiledGraph {
    // Get nodes that are enabled (or don't have an enabled property)
    const enabledNodes = graph.nodes.filter(node => {
      return node.parameters.enabled !== false;
    });
    
    // Get IDs of enabled nodes
    const enabledNodeIds = new Set(enabledNodes.map(node => node.id));
    
    // Update input/output mappings
    const updateNodeInputs = (node: CompiledNode): string[] => {
      // Filter inputs to only include enabled nodes
      const enabledInputs = node.inputs.filter(inputId => 
        enabledNodeIds.has(inputId)
      );
      
      // If this node has no enabled inputs but should have inputs,
      // use the first enabled input node in the graph as fallback
      if (enabledInputs.length === 0 && node.inputs.length > 0) {
        const potentialInputs = graph.inputNodes.filter(id => enabledNodeIds.has(id));
        if (potentialInputs.length > 0) {
          return [potentialInputs[0]];
        }
      }
      
      return enabledInputs;
    };
    
    // Update inputs for all enabled nodes
    const updatedNodes = enabledNodes.map(node => ({
      ...node,
      inputs: updateNodeInputs(node)
    }));
    
    // Update input nodes list (only include enabled input nodes)
    const updatedInputNodes = graph.inputNodes.filter(id => 
      enabledNodeIds.has(id)
    );
    
    // Update output nodes list (only include enabled output nodes)
    const updatedOutputNodes = graph.outputNodes.filter(id => 
      enabledNodeIds.has(id)
    );
    
    return {
      nodes: updatedNodes,
      inputNodes: updatedInputNodes,
      outputNodes: updatedOutputNodes
    };
  }
  
  /**
   * Reorder nodes for more efficient execution
   */
  private reorderForEfficiency(graph: CompiledGraph): CompiledGraph {
    // Create an adjacency list representation of the graph
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    // Initialize the maps
    graph.nodes.forEach(node => {
      adjList.set(node.id, []);
      inDegree.set(node.id, 0);
    });
    
    // Build the adjacency list and in-degree counts
    graph.nodes.forEach(node => {
      node.inputs.forEach(inputId => {
        // This node depends on inputId
        const outNodes = adjList.get(inputId) || [];
        outNodes.push(node.id);
        adjList.set(inputId, outNodes);
        
        // Increment in-degree for this node
        inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1);
      });
    });
    
    // Perform topological sort for execution order
    const queue: string[] = [];
    const executionOrder: string[] = [];
    
    // Start with nodes that have no dependencies (in-degree = 0)
    graph.nodes.forEach(node => {
      if ((inDegree.get(node.id) || 0) === 0) {
        queue.push(node.id);
      }
    });
    
    // Process the queue
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      executionOrder.push(nodeId);
      
      // Reduce in-degree of all dependent nodes
      const dependents = adjList.get(nodeId) || [];
      for (const depId of dependents) {
        const newDegree = (inDegree.get(depId) || 0) - 1;
        inDegree.set(depId, newDegree);
        
        // If the dependent has no more dependencies, add to queue
        if (newDegree === 0) {
          queue.push(depId);
        }
      }
    }
    
    // Reorder nodes based on execution order
    const nodeMap = new Map<string, CompiledNode>();
    graph.nodes.forEach(node => {
      nodeMap.set(node.id, node);
    });
    
    const orderedNodes = executionOrder
      .map(id => nodeMap.get(id))
      .filter((node): node is CompiledNode => node !== undefined);
    
    return {
      ...graph,
      nodes: orderedNodes
    };
  }
  
  /**
   * Find all possible execution paths through the graph
   */
  public findExecutionPaths(graph: CompiledGraph): string[][] {
    const paths: string[][] = [];
    
    // Start from each output node
    graph.outputNodes.forEach(outputId => {
      const visited = new Set<string>();
      const currentPath: string[] = [];
      
      const dfs = (nodeId: string) => {
        // Skip if already visited (avoid cycles)
        if (visited.has(nodeId)) return;
        
        // Mark as visited
        visited.add(nodeId);
        currentPath.push(nodeId);
        
        // Find the node
        const node = graph.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        // If this is an input node, we found a complete path
        if (graph.inputNodes.includes(nodeId)) {
          // Save the path (reverse it to get source → target order)
          paths.push([...currentPath].reverse());
        } else {
          // Continue DFS with inputs
          node.inputs.forEach(inputId => {
            dfs(inputId);
          });
        }
        
        // Backtrack
        currentPath.pop();
      };
      
      // Start DFS from this output node
      dfs(outputId);
    });
    
    return paths;
  }
  
  /**
   * Generate a fused shader for a specific execution path
   */
  public generatePathShader(
    path: string[], 
    graph: CompiledGraph,
    fragmentTemplate: string
  ): GLShader | null {
    // Get nodes in the path
    const pathNodes = path
      .map(id => graph.nodes.find(n => n.id === id))
      .filter((node): node is CompiledNode => node !== undefined);
    
    if (pathNodes.length === 0) return null;
    
    // Extract the shader code from each node
    const shaderSegments: string[] = [];
    const uniformDeclarations: string[] = [];
    const parameters: Record<string, any> = {};
    
    // Process each node in the path
    pathNodes.forEach(node => {
      // Get shader source
      const shader = node.shader;
      const source = shader.getFragmentSource();
      
      // Extract main function body
      const mainStart = source.indexOf('void main()');
      if (mainStart !== -1) {
        const braceStart = source.indexOf('{', mainStart);
        const braceEnd = findMatchingBrace(source, braceStart);
        
        if (braceStart !== -1 && braceEnd !== -1) {
          // Extract code between braces
          const mainBody = source.substring(braceStart + 1, braceEnd).trim();
          shaderSegments.push(`// Code from node ${node.id}\n${mainBody}`);
        }
      }
      
      // Extract uniform declarations
      const lines = source.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('uniform') && line.includes(';')) {
          uniformDeclarations.push(line.trim());
        }
      }
      
      // Collect parameters
      Object.assign(parameters, node.parameters);
    });
    
    // Remove duplicate uniform declarations
    const uniqueUniforms = Array.from(new Set(uniformDeclarations));
    
    // Build the fused shader source
    const fusedSource = fragmentTemplate
      .replace('/* UNIFORM_DECLARATIONS */', uniqueUniforms.join('\n'))
      .replace('/* MAIN_FUNCTION_BODY */', shaderSegments.join('\n\n'));
    
    // Create the fused shader
    const fusedShader = new GLShader(
      `fused_path_${path.join('_')}`,
      fusedSource,
      `Fused shader for path ${path.join(' → ')}`
    );
    
    // Add parameters as uniforms
    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined) {
        const uniformName = `u_${key}`;
        let uniformType: 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'bool' | 'sampler2D' = 'float';
        
        // Determine uniform type based on value
        if (typeof value === 'boolean') {
          uniformType = 'bool';
        } else if (typeof value === 'number') {
          uniformType = Number.isInteger(value) ? 'int' : 'float';
        } else if (Array.isArray(value)) {
          if (value.length === 2) uniformType = 'vec2';
          else if (value.length === 3) uniformType = 'vec3';
          else if (value.length === 4) uniformType = 'vec4';
        } else if (value instanceof WebGLTexture) {
          uniformType = 'sampler2D';
        }
        
        fusedShader.addUniform({
          name: uniformName,
          type: uniformType,
          value: value,
          description: `Parameter ${key} from path`
        });
      }
    }
    
    return fusedShader;
  }
}

/**
 * Helper function to find a matching closing brace
 */
function findMatchingBrace(source: string, openBracePos: number): number {
  let depth = 1;
  let pos = openBracePos + 1;
  
  while (pos < source.length && depth > 0) {
    if (source[pos] === '{') {
      depth++;
    } else if (source[pos] === '}') {
      depth--;
    }
    pos++;
  }
  
  return depth === 0 ? pos - 1 : -1;
}