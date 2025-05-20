/**
 * GLRenderer.ts
 * 
 * Core renderer for the WebGL filter engine. Handles compiling, rendering, and
 * managing the filter graph.
 */

import { Node, Edge } from 'reactflow';
import { GLContext } from './GLContext';
import { GraphCompiler, CompiledGraph, CompiledNode } from '../compiler/GraphCompiler';
import { ShaderRegistry } from '../compiler/ShaderRegistry';
import { GLGraphOptimizer } from '../compiler/GLGraphOptimizer';
import { FUSED_SHADER_TEMPLATE } from '../shaders/fusedShaderTemplate';
import { ShaderPipelineBuilder, ShaderPipeline } from '../compiler/ShaderPipeline';
import { FilterType, FilterNodeData, ImageNodeData } from '@/types';

// Options for different rendering quality levels
export interface RenderOptions {
  quality: 'preview' | 'draft' | 'full';
  tileSize?: number;
  maxDimension?: number;
  useFusion?: boolean; // Whether to use shader fusion optimization
}

export class GLRenderer {
  private context: GLContext;
  private shaderRegistry: ShaderRegistry;
  private graphCompiler: GraphCompiler;
  private graphOptimizer: GLGraphOptimizer;
  private compiledGraph: CompiledGraph | null = null;
  private canvas: HTMLCanvasElement;
  
  // New optimized pipeline properties
  private shaderPipeline: ShaderPipeline | null = null;
  private fusedPipelineShader: any = null; // GLShader from our system
  
  // Track loaded images/textures
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private renderInProgress: boolean = false;
  private lastRenderTime: number = 0;
  private animationTime: number = 0;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = new GLContext(canvas);
    this.shaderRegistry = new ShaderRegistry();
    this.graphCompiler = new GraphCompiler(this.shaderRegistry);
    this.graphOptimizer = new GLGraphOptimizer();
  }
  
  /**
   * Compile a ReactFlow graph into a WebGL shader pipeline
   */
  public compileGraph(nodes: Node[], edges: Edge[]): void {
    // First use the existing graph compiler
    this.compiledGraph = this.graphCompiler.compile(nodes, edges);
    
    // Apply optimizations
    this.compiledGraph = this.graphOptimizer.optimizeGraph(this.compiledGraph);
    
    console.log('Graph compiled with traditional method:', this.compiledGraph);
    
    try {
      // Also use the new ShaderPipeline for more efficient rendering
      const pipeline = ShaderPipelineBuilder.buildPipeline(nodes, edges);
      console.log('Built optimized shader pipeline:', pipeline);
      
      // Try to generate a single fused shader for the entire pipeline
      const fusedShader = ShaderPipelineBuilder.generateFusedShader(pipeline);
      
      if (fusedShader) {
        console.log('Successfully generated a fully fused shader for the entire graph');
        
        // Use this shader for the main render pass
        this.fusedPipelineShader = fusedShader;
        this.shaderPipeline = pipeline;
      } else {
        // Fall back to traditional execution path
        const paths = this.graphOptimizer.findExecutionPaths(this.compiledGraph);
        
        // Try to generate fused shaders for longer paths
        paths.filter(path => path.length > 2).forEach(path => {
          const pathShader = this.graphOptimizer.generatePathShader(
            path, 
            this.compiledGraph!, 
            FUSED_SHADER_TEMPLATE
          );
          
          if (pathShader) {
            console.log(`Generated fused shader for path: ${path.join(' → ')}`);
          }
        });
      }
    } catch (err) {
      console.error('Error building optimized shader pipeline:', err);
      // Continue with traditional approach if shader pipeline fails
    }
  }
  
  /**
   * Preload images used in the filter graph
   */
  public async preloadImages(nodes: Node[]): Promise<void> {
    const imagePromises: Promise<void>[] = [];
    
    for (const node of nodes) {
      if (node.type === 'imageNode' && node.data) {
        const imageNode = node.data as ImageNodeData;
        if (imageNode.imageUrl && !this.imageCache.has(imageNode.imageUrl)) {
          const promise = this.loadImage(imageNode.imageUrl)
            .then(image => {
              this.imageCache.set(imageNode.imageUrl!, image);
            })
            .catch(err => {
              console.error(`Failed to load image ${imageNode.imageUrl}:`, err);
            });
          
          imagePromises.push(promise);
        }
      } else if (node.type === 'imageFilterNode' && node.data) {
        const filterNode = node.data as FilterNodeData;
        if (filterNode.imageUrl && !this.imageCache.has(filterNode.imageUrl)) {
          const promise = this.loadImage(filterNode.imageUrl)
            .then(image => {
              this.imageCache.set(filterNode.imageUrl!, image);
            })
            .catch(err => {
              console.error(`Failed to load image ${filterNode.imageUrl}:`, err);
            });
          
          imagePromises.push(promise);
        }
      }
    }
    
    // Wait for all images to load
    await Promise.all(imagePromises);
  }
  
  /**
   * Load an image from a URL
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = url;
    });
  }
  
  /**
   * Render the compiled graph to the canvas
   */
  public async render(options: RenderOptions = { quality: 'full', useFusion: true }): Promise<string | null> {
    if (!this.compiledGraph && !this.shaderPipeline) {
      console.warn('No compiled graph or shader pipeline to render');
      return null;
    }
    
    if (this.renderInProgress) {
      console.warn('Render already in progress');
      return null;
    }
    
    this.renderInProgress = true;
    
    try {
      // Calculate dimensions based on quality
      let width = this.canvas.width;
      let height = this.canvas.height;
      
      if (options.quality !== 'full' && options.maxDimension) {
        const scale = options.maxDimension / Math.max(width, height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
      
      // Update animation time (for animated shaders)
      const now = performance.now();
      const deltaTime = (now - this.lastRenderTime) / 1000; // Convert to seconds
      this.animationTime += deltaTime;
      this.lastRenderTime = now;
      
      // Check if we can use the optimized shader pipeline
      if (this.fusedPipelineShader && this.shaderPipeline && options.useFusion !== false) {
        console.log('Using optimized fused shader pipeline for rendering');
        
        // Resize the context
        this.context.resize(width, height);
        
        // Create a single framebuffer for the output
        this.context.createFramebuffer('fused_output', 'fused_texture', width, height);
        
        // Prepare uniforms from the pipeline
        const uniforms = { ...this.shaderPipeline.uniforms };
        
        // Add common uniforms
        uniforms['u_resolution'] = [width, height];
        uniforms['u_time'] = this.animationTime;
        
        // Find input texture from source nodes
        if (this.shaderPipeline.entryPoints.length > 0) {
          const sourceId = this.shaderPipeline.entryPoints[0];
          
          // Check if we have this image in cache
          const sourceNode = this.shaderPipeline.nodes.find(node => node.id === sourceId);
          if (sourceNode && sourceNode.uniforms[`u_${sourceId}_texture`]) {
            const sourceImage = this.imageCache.get(sourceNode.uniforms[`u_${sourceId}_texture`]);
            
            if (sourceImage) {
              // Create texture from source image
              this.context.createTexture(`input_texture`, sourceImage);
              
              // Add to uniforms
              uniforms['u_inputTexture'] = this.context.getTexture(`input_texture`);
            }
          }
        }
        
        // Render the entire graph in a single pass
        this.context.drawQuad(
          this.fusedPipelineShader.getName(),
          'fused_output',
          uniforms
        );
        
        // Draw final output to canvas
        this.context.drawQuad(
          'passthrough',
          null, // null means render to canvas
          {
            'u_inputTexture': this.context.getTexture('fused_texture')
          }
        );
      } else {
        // Fall back to traditional rendering approach
        console.log('Using traditional multi-pass rendering');
        
        // Create framebuffers for each node
        await this.setupFramebuffers(width, height);
        
        // If using tiles, render in tiles
        if (options.tileSize && options.quality !== 'full') {
          await this.renderTiled(width, height, options.tileSize, options.useFusion || false);
        } else {
          // Otherwise render in a single pass
          await this.renderFullscreen(width, height, options.useFusion || false);
        }
      }
      
      // Get final image as base64
      return this.canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Error rendering graph:', err);
      return null;
    } finally {
      this.renderInProgress = false;
    }
  }
  
  /**
   * Set up framebuffers for each node in the graph
   */
  private async setupFramebuffers(width: number, height: number): Promise<void> {
    if (!this.compiledGraph) return;
    
    const gl = this.context.getGL();
    if (!gl) return;
    
    // Set canvas size
    this.context.resize(width, height);
    
    // Create framebuffers for each node
    for (const node of this.compiledGraph.nodes) {
      const textureName = `tex_${node.id}`;
      const framebufferName = `fbo_${node.id}`;
      
      // Create framebuffer with attached texture
      this.context.createFramebuffer(framebufferName, textureName, width, height);
    }
    
    // Upload source textures
    for (const nodeId of this.compiledGraph.inputNodes) {
      const node = this.compiledGraph.nodes.find(n => n.id === nodeId);
      if (!node) continue;
      
      // Check if this is an image node
      if (node.parameters.imageUrl) {
        const imageUrl = node.parameters.imageUrl as string;
        const image = this.imageCache.get(imageUrl);
        
        if (image) {
          // Create texture from image
          this.context.createTexture(`img_${node.id}`, image);
          
          // Set image as uniform
          node.shader.setUniformValue('u_inputTexture', this.context.getTexture(`img_${node.id}`));
        }
      }
    }
  }
  
  /**
   * Render graph in tiles for better performance during preview
   */
  private async renderTiled(
    width: number, 
    height: number, 
    tileSize: number,
    useFusion: boolean
  ): Promise<void> {
    if (!this.compiledGraph) return;
    
    const gl = this.context.getGL();
    if (!gl) return;
    
    // Calculate number of tiles
    const tilesX = Math.ceil(width / tileSize);
    const tilesY = Math.ceil(height / tileSize);
    
    // Set viewport to full size
    gl.viewport(0, 0, width, height);
    
    if (useFusion) {
      // If using shader fusion, find the longest execution path
      const paths = this.graphOptimizer.findExecutionPaths(this.compiledGraph);
      
      // Get the longest path (most likely to benefit from fusion)
      const longestPath = paths.reduce((longest, current) => 
        current.length > longest.length ? current : longest, []);
      
      if (longestPath.length > 2) {
        // Generate a fused shader for this path
        const fusedShader = this.graphOptimizer.generatePathShader(
          longestPath, 
          this.compiledGraph, 
          FUSED_SHADER_TEMPLATE
        );
        
        if (fusedShader) {
          // Create a compiled node for the fused path
          const fusedNode: CompiledNode = {
            id: 'fused_' + longestPath.join('_'),
            shader: fusedShader,
            inputs: [longestPath[0]], // The first node in the path
            output: longestPath[longestPath.length - 1], // The last node in the path
            parameters: {} // Will be populated from shader uniforms
          };
          
          // Render the fused shader in tiles
          for (let ty = 0; ty < tilesY; ty++) {
            for (let tx = 0; tx < tilesX; tx++) {
              // Calculate tile position and size
              const tileX = tx * tileSize;
              const tileY = ty * tileSize;
              const tileW = Math.min(tileSize, width - tileX);
              const tileH = Math.min(tileSize, height - tileY);
              
              // Set scissor to only render this tile
              gl.enable(gl.SCISSOR_TEST);
              gl.scissor(tileX, height - tileY - tileH, tileW, tileH);
              
              // Setup uniforms for the fused shader
              const uniforms = fusedShader.getUniformValues();
              
              // Set input texture
              const inputNodeId = longestPath[0];
              const inputTexture = this.context.getTexture(`img_${inputNodeId}`) || 
                                  this.context.getTexture(`tex_${inputNodeId}`);
              
              if (inputTexture) {
                uniforms['u_inputTexture'] = inputTexture;
              }
              
              // Set other common uniforms
              uniforms['u_resolution'] = [width, height];
              uniforms['u_time'] = this.animationTime;
              
              // Render the fused shader directly to the output node's framebuffer
              const outputNodeId = longestPath[longestPath.length - 1];
              
              this.context.drawQuad(
                fusedShader.getName(),
                `fbo_${outputNodeId}`,
                uniforms
              );
            }
          }
          
          // Disable scissor after all tiles are rendered
          gl.disable(gl.SCISSOR_TEST);
          
          // Skip normal rendering for nodes in the fused path
          const skippedNodes = new Set(longestPath);
          
          // Process remaining nodes in topological order
          for (const node of this.compiledGraph.nodes) {
            // Skip nodes that were included in the fusion
            if (skippedNodes.has(node.id)) continue;
            
            // Render remaining nodes as normal
            this.renderNodeTiled(node, width, height, tilesX, tilesY, tileSize);
          }
        } else {
          // If fusion failed, fall back to normal rendering
          this.renderAllNodesTiled(width, height, tilesX, tilesY, tileSize);
        }
      } else {
        // Not enough nodes for fusion, use normal rendering
        this.renderAllNodesTiled(width, height, tilesX, tilesY, tileSize);
      }
    } else {
      // Using normal node-by-node rendering
      this.renderAllNodesTiled(width, height, tilesX, tilesY, tileSize);
    }
    
    // Final render to canvas
    if (this.compiledGraph.outputNodes.length > 0) {
      const outputNode = this.compiledGraph.outputNodes[0]; // Just use first output for now
      const lastNode = this.compiledGraph.nodes.find(n => n.id === outputNode);
      
      if (lastNode) {
        // Draw to canvas
        this.context.drawQuad(
          'passthrough',
          null, // null framebuffer means draw to canvas
          {
            'u_inputTexture': this.context.getTexture(`tex_${lastNode.id}`)
          }
        );
      }
    }
  }
  
  /**
   * Render all nodes in tiles (when fusion is not used)
   */
  private renderAllNodesTiled(
    width: number, 
    height: number, 
    tilesX: number, 
    tilesY: number, 
    tileSize: number
  ): void {
    if (!this.compiledGraph) return;
    
    // Process nodes in topological order
    for (const node of this.compiledGraph.nodes) {
      this.renderNodeTiled(node, width, height, tilesX, tilesY, tileSize);
    }
  }
  
  /**
   * Render a single node in tiles
   */
  private renderNodeTiled(
    node: CompiledNode,
    width: number,
    height: number,
    tilesX: number,
    tilesY: number,
    tileSize: number
  ): void {
    const gl = this.context.getGL();
    if (!gl) return;
    
    // Render this node's shader to its framebuffer
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        // Calculate tile position and size
        const tileX = tx * tileSize;
        const tileY = ty * tileSize;
        const tileW = Math.min(tileSize, width - tileX);
        const tileH = Math.min(tileSize, height - tileY);
        
        // Set scissor to only render this tile
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(tileX, height - tileY - tileH, tileW, tileH);
        
        // Setup uniforms for this shader
        const uniforms = { ...node.shader.getUniformValues() };
        
        // Set input textures
        if (node.inputs.length > 0) {
          const inputNode = node.inputs[0]; // Just use first input for now
          uniforms['u_inputTexture'] = this.context.getTexture(`tex_${inputNode}`) || 
                                      this.context.getTexture(`img_${inputNode}`);
        }
        
        // Set additional parameters specific to filter types
        uniforms['u_resolution'] = [width, height];
        uniforms['u_time'] = this.animationTime;
        
        // Draw quad with shader
        this.context.drawQuad(
          node.shader.getName(),
          `fbo_${node.id}`,
          uniforms
        );
      }
    }
    
    // Disable scissor after all tiles are rendered
    gl.disable(gl.SCISSOR_TEST);
  }
  
  /**
   * Render full graph in a single pass (optimized)
   */
  private async renderFullscreen(
    width: number, 
    height: number,
    useFusion: boolean
  ): Promise<void> {
    if (!this.compiledGraph) return;
    
    const gl = this.context.getGL();
    if (!gl) return;
    
    // Set viewport to full size
    gl.viewport(0, 0, width, height);
    
    if (useFusion) {
      // If using shader fusion, find the longest execution path
      const paths = this.graphOptimizer.findExecutionPaths(this.compiledGraph);
      
      // Get the longest path (most likely to benefit from fusion)
      const longestPath = paths.reduce((longest, current) => 
        current.length > longest.length ? current : longest, []);
      
      if (longestPath.length > 2) {
        // Generate a fused shader for this path
        const fusedShader = this.graphOptimizer.generatePathShader(
          longestPath, 
          this.compiledGraph, 
          FUSED_SHADER_TEMPLATE
        );
        
        if (fusedShader) {
          // Setup uniforms for the fused shader
          const uniforms = fusedShader.getUniformValues();
          
          // Set input texture
          const inputNodeId = longestPath[0];
          const inputTexture = this.context.getTexture(`img_${inputNodeId}`) || 
                              this.context.getTexture(`tex_${inputNodeId}`);
          
          if (inputTexture) {
            uniforms['u_inputTexture'] = inputTexture;
          }
          
          // Set other common uniforms
          uniforms['u_resolution'] = [width, height];
          uniforms['u_time'] = this.animationTime;
          
          // Render the fused shader directly to the output node's framebuffer
          const outputNodeId = longestPath[longestPath.length - 1];
          
          this.context.drawQuad(
            fusedShader.getName(),
            `fbo_${outputNodeId}`,
            uniforms
          );
          
          // Skip normal rendering for nodes in the fused path
          const skippedNodes = new Set(longestPath);
          
          // Process remaining nodes in topological order
          for (const node of this.compiledGraph.nodes) {
            // Skip nodes that were included in the fusion
            if (skippedNodes.has(node.id)) continue;
            
            // Render remaining nodes as normal
            this.renderNode(node, width, height);
          }
        } else {
          // If fusion failed, fall back to normal rendering
          this.renderAllNodes(width, height);
        }
      } else {
        // Not enough nodes for fusion, use normal rendering
        this.renderAllNodes(width, height);
      }
    } else {
      // Using normal node-by-node rendering
      this.renderAllNodes(width, height);
    }
    
    // Final render to canvas
    if (this.compiledGraph.outputNodes.length > 0) {
      const outputNode = this.compiledGraph.outputNodes[0]; // Just use first output for now
      const lastNode = this.compiledGraph.nodes.find(n => n.id === outputNode);
      
      if (lastNode) {
        // Draw to canvas
        this.context.drawQuad(
          'passthrough',
          null, // null framebuffer means draw to canvas
          {
            'u_inputTexture': this.context.getTexture(`tex_${lastNode.id}`)
          }
        );
      }
    }
  }
  
  /**
   * Render all nodes (when fusion is not used)
   */
  private renderAllNodes(width: number, height: number): void {
    if (!this.compiledGraph) return;
    
    // Process nodes in topological order
    for (const node of this.compiledGraph.nodes) {
      this.renderNode(node, width, height);
    }
  }
  
  /**
   * Render a single node
   */
  private renderNode(node: CompiledNode, width: number, height: number): void {
    // Setup uniforms for this shader
    const uniforms = { ...node.shader.getUniformValues() };
    
    // Set input textures
    if (node.inputs.length > 0) {
      const inputNode = node.inputs[0]; // Just use first input for now
      uniforms['u_inputTexture'] = this.context.getTexture(`tex_${inputNode}`) || 
                                  this.context.getTexture(`img_${inputNode}`);
    }
    
    // Set additional parameters specific to filter types
    uniforms['u_resolution'] = [width, height];
    uniforms['u_time'] = this.animationTime;
    
    // Draw quad with shader
    this.context.drawQuad(
      node.shader.getName(),
      `fbo_${node.id}`,
      uniforms
    );
  }
  
  /**
   * Get rendered preview for a specific node
   */
  public async getNodePreview(nodeId: string, maxSize: number = 200): Promise<string | null> {
    if (!this.compiledGraph) return null;
    
    // Find the node
    const node = this.compiledGraph.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    // Temporarily resize render target to preview size
    const originalWidth = this.canvas.width;
    const originalHeight = this.canvas.height;
    
    // Calculate preview size
    const aspect = originalWidth / originalHeight;
    let previewWidth, previewHeight;
    
    if (aspect >= 1) {
      previewWidth = maxSize;
      previewHeight = Math.floor(maxSize / aspect);
    } else {
      previewHeight = maxSize;
      previewWidth = Math.floor(maxSize * aspect);
    }
    
    // Render at preview size
    this.context.resize(previewWidth, previewHeight);
    
    // Get texture for this node
    const texture = this.context.getTexture(`tex_${nodeId}`);
    if (!texture) return null;
    
    // Draw to canvas
    this.context.drawQuad(
      'passthrough',
      null,
      {
        'u_inputTexture': texture
      }
    );
    
    // Get preview as data URL
    const previewUrl = this.canvas.toDataURL('image/png');
    
    // Restore original size
    this.context.resize(originalWidth, originalHeight);
    
    return previewUrl;
  }
  
  /**
   * Get the WebGL context
   */
  public getGL(): WebGL2RenderingContext | null {
    return this.context.getGL();
  }
  
  /**
   * Clean up WebGL resources
   */
  public dispose(): void {
    this.context.dispose();
  }
}