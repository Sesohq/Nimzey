/**
 * GraphCompiler.ts
 * 
 * The graph compiler analyzes the ReactFlow graph and compiles it into an
 * optimized WebGL shader pipeline. It walks the DAG, detects filter chains,
 * and generates combined shaders where possible to minimize texture reads/writes.
 */

import { Node, Edge } from 'reactflow';
import { FilterType, FilterNodeData, ImageNodeData } from '@/types';
import { GLShader } from '../core/GLShader';
import { ShaderRegistry } from '../compiler/ShaderRegistry';

// Types for compiled filter chains
export interface CompiledNode {
  id: string;
  shader: GLShader;
  inputs: string[];
  output: string;
  parameters: Record<string, any>;
}

export interface CompiledGraph {
  nodes: CompiledNode[];
  inputNodes: string[];
  outputNodes: string[];
}

export class GraphCompiler {
  private shaderRegistry: ShaderRegistry;
  
  constructor(shaderRegistry: ShaderRegistry) {
    this.shaderRegistry = shaderRegistry;
  }
  
  /**
   * Compile a ReactFlow graph into an optimized shader pipeline
   */
  public compile(nodes: Node[], edges: Edge[]): CompiledGraph {
    // Track input and output nodes
    const inputNodes: string[] = [];
    const outputNodes: string[] = [];
    
    // Create a node map for quick lookup
    const nodeMap = new Map<string, Node>();
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
      
      // Identify source nodes (no incoming edges)
      if (edges.findIndex(edge => edge.target === node.id) === -1) {
        inputNodes.push(node.id);
      }
      
      // Identify output nodes (no outgoing edges)
      if (edges.findIndex(edge => edge.source === node.id) === -1) {
        outputNodes.push(node.id);
      }
    });
    
    // Create edge maps for faster traversal
    const outgoingEdges = new Map<string, Edge[]>();
    const incomingEdges = new Map<string, Edge[]>();
    
    edges.forEach(edge => {
      // Track outgoing edges for each node
      if (!outgoingEdges.has(edge.source)) {
        outgoingEdges.set(edge.source, []);
      }
      outgoingEdges.get(edge.source)?.push(edge);
      
      // Track incoming edges for each node
      if (!incomingEdges.has(edge.target)) {
        incomingEdges.set(edge.target, []);
      }
      incomingEdges.get(edge.target)?.push(edge);
    });
    
    // Compile individual nodes
    const compiledNodes: CompiledNode[] = [];
    
    // Process nodes in topological order
    const visited = new Set<string>();
    const compileNode = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      
      const node = nodeMap.get(nodeId);
      if (!node) return;
      
      // Process inputs first
      const incoming = incomingEdges.get(nodeId) || [];
      incoming.forEach(edge => {
        compileNode(edge.source);
      });
      
      // Create compiled node
      const compiled = this.compileNode(node, nodeMap, edges);
      if (compiled) {
        compiledNodes.push(compiled);
      }
      
      visited.add(nodeId);
    };
    
    // Start compilation from output nodes
    outputNodes.forEach(nodeId => {
      compileNode(nodeId);
    });
    
    // Handle isolated nodes (no connections)
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        compileNode(node.id);
      }
    });
    
    // Return compiled graph
    return {
      nodes: compiledNodes,
      inputNodes,
      outputNodes
    };
  }
  
  /**
   * Compile a single node into a shader
   */
  private compileNode(
    node: Node, 
    nodeMap: Map<string, Node>,
    edges: Edge[]
  ): CompiledNode | null {
    // Handle different node types
    switch (node.type) {
      case 'filterNode': {
        return this.compileFilterNode(node as Node<FilterNodeData>, nodeMap, edges);
      }
      case 'imageNode': {
        return this.compileImageNode(node as Node<ImageNodeData>);
      }
      case 'outputNode': {
        return this.compileOutputNode(node, nodeMap, edges);
      }
      case 'imageFilterNode': {
        return this.compileImageFilterNode(node as Node<FilterNodeData>, nodeMap, edges);
      }
      default:
        console.warn(`Unknown node type: ${node.type}`);
        return null;
    }
  }
  
  /**
   * Compile a filter node
   */
  private compileFilterNode(
    node: Node<FilterNodeData>,
    nodeMap: Map<string, Node>,
    edges: Edge[]
  ): CompiledNode | null {
    if (!node.data) return null;
    
    // Get the filter type
    const filterType = node.data.filter?.type as FilterType;
    if (!filterType) return null;
    
    // Get shader for the filter
    const shader = this.shaderRegistry.getShader(filterType);
    if (!shader) {
      console.warn(`No shader found for filter type: ${filterType}`);
      return null;
    }
    
    // Extract parameters from node data
    const parameters: Record<string, any> = {};
    if (node.data.filter?.params) {
      node.data.filter.params.forEach(param => {
        parameters[param.id] = param.value;
      });
    }
    
    // Add blend mode and opacity if available
    if (node.data.blendMode) {
      parameters['blendMode'] = node.data.blendMode;
    }
    if (node.data.opacity !== undefined) {
      parameters['opacity'] = node.data.opacity / 100; // Convert from percentage
    }
    
    // Find input nodes
    const inputs: string[] = [];
    const incomingEdges = edges.filter(edge => edge.target === node.id);
    incomingEdges.forEach(edge => {
      inputs.push(edge.source);
    });
    
    return {
      id: node.id,
      shader,
      inputs,
      output: node.id,
      parameters
    };
  }
  
  /**
   * Compile an image node
   */
  private compileImageNode(node: Node<ImageNodeData>): CompiledNode | null {
    if (!node.data) return null;
    
    // Get pass-through shader
    const shader = this.shaderRegistry.getShader('passthrough');
    if (!shader) {
      console.warn('No pass-through shader found');
      return null;
    }
    
    // Image nodes have no inputs, they are sources
    return {
      id: node.id,
      shader,
      inputs: [],
      output: node.id,
      parameters: {
        // Store image URL as a parameter
        imageUrl: node.data.imageUrl || null
      }
    };
  }
  
  /**
   * Compile an output node
   */
  private compileOutputNode(
    node: Node,
    nodeMap: Map<string, Node>,
    edges: Edge[]
  ): CompiledNode | null {
    // Get pass-through shader
    const shader = this.shaderRegistry.getShader('passthrough');
    if (!shader) {
      console.warn('No pass-through shader found');
      return null;
    }
    
    // Find input nodes
    const inputs: string[] = [];
    const incomingEdges = edges.filter(edge => edge.target === node.id);
    incomingEdges.forEach(edge => {
      inputs.push(edge.source);
    });
    
    return {
      id: node.id,
      shader,
      inputs,
      output: node.id,
      parameters: {}
    };
  }
  
  /**
   * Compile an image filter node
   */
  private compileImageFilterNode(
    node: Node<FilterNodeData>,
    nodeMap: Map<string, Node>,
    edges: Edge[]
  ): CompiledNode | null {
    // Image filter nodes are similar to regular filter nodes but always include an image
    const baseNode = this.compileFilterNode(node, nodeMap, edges);
    if (!baseNode) return null;
    
    // Add image URL as a parameter if available
    if (node.data && node.data.imageUrl) {
      baseNode.parameters['imageUrl'] = node.data.imageUrl;
    }
    
    return baseNode;
  }
  
  /**
   * Attempt to fuse multiple nodes into a single shader
   * This is an optimization to reduce texture reads/writes
   */
  public fuseNodes(compiledGraph: CompiledGraph): CompiledGraph {
    // This is a complex optimization task that would generate combined shaders
    // For now, we'll return the original graph, but this is where the magic happens
    // for performance optimization
    
    // TODO: Implement shader fusion logic
    // 1. Identify chains of filters (nodes with single input/output)
    // 2. Fuse compatible filters into a single shader
    // 3. Update graph with fused nodes
    
    return compiledGraph;
  }
}