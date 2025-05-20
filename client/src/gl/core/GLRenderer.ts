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
import { FilterType, FilterNodeData, ImageNodeData } from '@/types';

// Options for different rendering quality levels
export interface RenderOptions {
  quality: 'preview' | 'draft' | 'full';
  tileSize?: number;
  maxDimension?: number;
}

export class GLRenderer {
  private context: GLContext;
  private shaderRegistry: ShaderRegistry;
  private graphCompiler: GraphCompiler;
  private compiledGraph: CompiledGraph | null = null;
  private canvas: HTMLCanvasElement;
  
  // Track loaded images/textures
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private renderInProgress: boolean = false;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = new GLContext(canvas);
    this.shaderRegistry = new ShaderRegistry();
    this.graphCompiler = new GraphCompiler(this.shaderRegistry);
  }
  
  /**
   * Compile a ReactFlow graph into a WebGL shader pipeline
   */
  public compileGraph(nodes: Node[], edges: Edge[]): void {
    // Compile graph
    this.compiledGraph = this.graphCompiler.compile(nodes, edges);
    
    // Apply fusion optimizations for single-pass rendering
    this.compiledGraph = this.graphCompiler.fuseNodes(this.compiledGraph);
    
    console.log('Graph compiled:', this.compiledGraph);
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
  public async render(options: RenderOptions = { quality: 'full' }): Promise<string | null> {
    if (!this.compiledGraph) {
      console.warn('No compiled graph to render');
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
      
      // Create framebuffers for each node
      await this.setupFramebuffers(width, height);
      
      // If using tiles, render in tiles
      if (options.tileSize && options.quality !== 'full') {
        await this.renderTiled(width, height, options.tileSize);
      } else {
        // Otherwise render in a single pass
        await this.renderFullscreen(width, height);
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
  private async renderTiled(width: number, height: number, tileSize: number): Promise<void> {
    if (!this.compiledGraph) return;
    
    const gl = this.context.getGL();
    if (!gl) return;
    
    // Calculate number of tiles
    const tilesX = Math.ceil(width / tileSize);
    const tilesY = Math.ceil(height / tileSize);
    
    // Set viewport to full size
    gl.viewport(0, 0, width, height);
    
    // Process nodes in topological order
    for (const node of this.compiledGraph.nodes) {
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
            uniforms['u_inputTexture'] = this.context.getTexture(`tex_${inputNode}`);
          }
          
          // Set additional parameters specific to filter types
          uniforms['u_resolution'] = [width, height];
          
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
   * Render full graph in a single pass (optimized)
   */
  private async renderFullscreen(width: number, height: number): Promise<void> {
    if (!this.compiledGraph) return;
    
    const gl = this.context.getGL();
    if (!gl) return;
    
    // Set viewport to full size
    gl.viewport(0, 0, width, height);
    
    // Process nodes in topological order
    for (const node of this.compiledGraph.nodes) {
      // Setup uniforms for this shader
      const uniforms = { ...node.shader.getUniformValues() };
      
      // Set input textures
      if (node.inputs.length > 0) {
        const inputNode = node.inputs[0]; // Just use first input for now
        uniforms['u_inputTexture'] = this.context.getTexture(`tex_${inputNode}`);
      }
      
      // Set additional parameters specific to filter types
      uniforms['u_resolution'] = [width, height];
      
      // Draw quad with shader
      this.context.drawQuad(
        node.shader.getName(),
        `fbo_${node.id}`,
        uniforms
      );
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
   * Clean up WebGL resources
   */
  public dispose(): void {
    this.context.dispose();
  }
}