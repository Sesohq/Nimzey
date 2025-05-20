/**
 * GLContext.ts
 * 
 * Core WebGL context manager for the filter engine.
 * Handles creation of WebGL context, framebuffers, textures, and shaders.
 */

export class GLContext {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private framebuffers: Map<string, WebGLFramebuffer> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private programs: Map<string, WebGLProgram> = new Map();
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.initGL();
    this.initQuad();
  }
  
  /**
   * Initialize WebGL context
   */
  private initGL(): void {
    try {
      // Try to grab the standard WebGL2 context
      this.gl = this.canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        antialias: false,
        stencil: false
      });
      
      if (!this.gl) {
        throw new Error('WebGL2 not supported');
      }
      
      // Configure global WebGL settings
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.clearColor(0, 0, 0, 0);
      
      console.log('WebGL2 initialized successfully');
    } catch (err) {
      console.error('Failed to initialize WebGL2 context:', err);
      throw err;
    }
  }
  
  /**
   * Initialize a full-screen quad for rendering
   */
  private initQuad(): void {
    if (!this.gl) return;
    
    // Create a buffer for a full-screen quad (two triangles)
    const positions = new Float32Array([
      -1, -1,  // Bottom left
       1, -1,  // Bottom right
      -1,  1,  // Top left
       1,  1   // Top right
    ]);
    
    // Create and configure buffer
    this.quadBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
  }
  
  /**
   * Compile and link a shader program
   */
  public createProgram(
    name: string, 
    vsSource: string, 
    fsSource: string
  ): WebGLProgram | null {
    if (!this.gl) return null;
    
    // Create and compile vertex shader
    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (!vertexShader) {
      console.error('Failed to create vertex shader');
      return null;
    }
    
    this.gl.shaderSource(vertexShader, vsSource);
    this.gl.compileShader(vertexShader);
    
    // Check for compilation errors
    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation failed:', 
        this.gl.getShaderInfoLog(vertexShader));
      this.gl.deleteShader(vertexShader);
      return null;
    }
    
    // Create and compile fragment shader
    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
      console.error('Failed to create fragment shader');
      return null;
    }
    
    this.gl.shaderSource(fragmentShader, fsSource);
    this.gl.compileShader(fragmentShader);
    
    // Check for compilation errors
    if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation failed:', 
        this.gl.getShaderInfoLog(fragmentShader));
      this.gl.deleteShader(vertexShader);
      this.gl.deleteShader(fragmentShader);
      return null;
    }
    
    // Create shader program and link shaders
    const program = this.gl.createProgram();
    if (!program) {
      console.error('Failed to create shader program');
      return null;
    }
    
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    // Check for linking errors
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Shader program linking failed:', 
        this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }
    
    // Store program in cache
    this.programs.set(name, program);
    
    // Clean up shaders (they're now linked to the program)
    this.gl.detachShader(program, vertexShader);
    this.gl.detachShader(program, fragmentShader);
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);
    
    return program;
  }
  
  /**
   * Create a texture from an image
   */
  public createTexture(
    name: string, 
    source: HTMLImageElement | HTMLCanvasElement | ImageData | null,
    width?: number, 
    height?: number
  ): WebGLTexture | null {
    if (!this.gl) return null;
    
    // Create and bind texture
    const texture = this.gl.createTexture();
    if (!texture) {
      console.error('Failed to create texture');
      return null;
    }
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    
    // Configure texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    
    // Upload texture data
    if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
      // Upload image or canvas
      this.gl.texImage2D(
        this.gl.TEXTURE_2D, 
        0, 
        this.gl.RGBA, 
        this.gl.RGBA, 
        this.gl.UNSIGNED_BYTE, 
        source
      );
    } else if (source instanceof ImageData) {
      // Upload image data
      this.gl.texImage2D(
        this.gl.TEXTURE_2D, 
        0, 
        this.gl.RGBA, 
        source.width, 
        source.height, 
        0, 
        this.gl.RGBA, 
        this.gl.UNSIGNED_BYTE, 
        source.data
      );
    } else if (width && height) {
      // Create empty texture with specified dimensions
      this.gl.texImage2D(
        this.gl.TEXTURE_2D, 
        0, 
        this.gl.RGBA, 
        width, 
        height, 
        0, 
        this.gl.RGBA, 
        this.gl.UNSIGNED_BYTE, 
        null
      );
    }
    
    // Store in cache
    this.textures.set(name, texture);
    
    return texture;
  }
  
  /**
   * Create a framebuffer with attached texture
   */
  public createFramebuffer(
    name: string, 
    textureName: string,
    width: number, 
    height: number
  ): WebGLFramebuffer | null {
    if (!this.gl) return null;
    
    // Create texture for the framebuffer if it doesn't exist
    if (!this.textures.has(textureName)) {
      this.createTexture(textureName, null, width, height);
    }
    
    // Get the texture
    const texture = this.textures.get(textureName);
    if (!texture) {
      console.error('Texture not found');
      return null;
    }
    
    // Create and bind framebuffer
    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) {
      console.error('Failed to create framebuffer');
      return null;
    }
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    
    // Attach texture to framebuffer
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, 
      this.gl.COLOR_ATTACHMENT0, 
      this.gl.TEXTURE_2D, 
      texture, 
      0
    );
    
    // Check if framebuffer is complete
    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer not complete:', status);
      return null;
    }
    
    // Unbind framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    
    // Store in cache
    this.framebuffers.set(name, framebuffer);
    
    return framebuffer;
  }
  
  /**
   * Draw a full-screen quad using the specified program
   */
  public drawQuad(
    programName: string, 
    framebufferName: string | null = null,
    uniforms: Record<string, any> = {}
  ): void {
    if (!this.gl) return;
    
    // Get program
    const program = this.programs.get(programName);
    if (!program) {
      console.error('Program not found:', programName);
      return;
    }
    
    // Bind framebuffer if specified
    if (framebufferName) {
      const framebuffer = this.framebuffers.get(framebufferName);
      if (!framebuffer) {
        console.error('Framebuffer not found:', framebufferName);
        return;
      }
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    } else {
      // Draw to canvas
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
    
    // Set viewport
    if (framebufferName) {
      // Get the texture name associated with the framebuffer
      const textureName = Array.from(this.textures.entries())
        .find(([_, texture]) => {
          // This is simplified; we'd need a proper mapping
          return framebufferName.includes(String(_));
        })?.[0];
      
      if (textureName) {
        // This would need more structure to properly track texture dimensions
        // Here we're assuming the framebuffer is full canvas size
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      }
    } else {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Use program
    this.gl.useProgram(program);
    
    // Set uniforms
    for (const [name, value] of Object.entries(uniforms)) {
      const location = this.gl.getUniformLocation(program, name);
      if (location === null) {
        console.warn(`Uniform not found: ${name}`);
        continue;
      }
      
      // Set uniform based on value type
      if (typeof value === 'number') {
        this.gl.uniform1f(location, value);
      } else if (Array.isArray(value)) {
        switch (value.length) {
          case 2:
            this.gl.uniform2fv(location, value);
            break;
          case 3:
            this.gl.uniform3fv(location, value);
            break;
          case 4:
            this.gl.uniform4fv(location, value);
            break;
          default:
            console.warn(`Unsupported uniform length: ${value.length}`);
        }
      } else if (value instanceof WebGLTexture) {
        // Handle texture uniforms
        const textureIndex = uniforms._textureMap?.[name] || 0;
        this.gl.activeTexture(this.gl.TEXTURE0 + textureIndex);
        this.gl.bindTexture(this.gl.TEXTURE_2D, value);
        this.gl.uniform1i(location, textureIndex);
      }
    }
    
    // Set up vertex attribute
    const positionLocation = this.gl.getAttribLocation(program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    
    // Draw the quad
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    
    // Disable vertex attribute
    this.gl.disableVertexAttribArray(positionLocation);
  }
  
  /**
   * Get a texture from the cache
   */
  public getTexture(name: string): WebGLTexture | null {
    return this.textures.get(name) || null;
  }
  
  /**
   * Read pixels from framebuffer
   */
  public readPixels(
    framebufferName: string,
    width: number,
    height: number
  ): Uint8Array {
    if (!this.gl) {
      return new Uint8Array(width * height * 4);
    }
    
    const framebuffer = this.framebuffers.get(framebufferName);
    if (!framebuffer) {
      console.error('Framebuffer not found:', framebufferName);
      return new Uint8Array(width * height * 4);
    }
    
    // Bind the framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    
    // Read pixels
    const pixels = new Uint8Array(width * height * 4);
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
    
    // Unbind framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    
    return pixels;
  }
  
  /**
   * Clean up WebGL resources
   */
  public dispose(): void {
    if (!this.gl) return;
    
    // Delete programs
    this.programs.forEach(program => {
      this.gl?.deleteProgram(program);
    });
    this.programs.clear();
    
    // Delete textures
    this.textures.forEach(texture => {
      this.gl?.deleteTexture(texture);
    });
    this.textures.clear();
    
    // Delete framebuffers
    this.framebuffers.forEach(framebuffer => {
      this.gl?.deleteFramebuffer(framebuffer);
    });
    this.framebuffers.clear();
    
    // Delete quad buffer
    if (this.quadBuffer) {
      this.gl.deleteBuffer(this.quadBuffer);
      this.quadBuffer = null;
    }
  }
  
  /**
   * Get the WebGL context
   */
  public getGL(): WebGL2RenderingContext | null {
    return this.gl;
  }
  
  /**
   * Resize canvas and update viewport
   */
  public resize(width: number, height: number): void {
    if (!this.gl) return;
    
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }
}