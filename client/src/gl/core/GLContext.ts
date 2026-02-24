/**
 * GLContext - WebGL2 context manager with HDR float texture support.
 * Manages textures, framebuffers, shader programs, and a texture pool
 * for efficient ping-pong rendering.
 */

import { ManagedTexture } from '@/types';
import { STANDARD_VERTEX_SHADER } from '../shaders/ShaderDefinition';

export type TextureFormat = 'uint8' | 'float16' | 'float32';

export class GLContext {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private quadBuffer: WebGLBuffer;
  private programs = new Map<string, WebGLProgram>();
  private textures = new Map<string, ManagedTexture>();
  private supportsFloat16 = false;
  private supportsFloat32 = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
      stencil: false,
    });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    // Detect float texture support
    const floatExt = gl.getExtension('EXT_color_buffer_float');
    if (floatExt) {
      this.supportsFloat16 = true;
      this.supportsFloat32 = true;
    } else {
      const halfFloatExt = gl.getExtension('EXT_color_buffer_half_float');
      if (halfFloatExt) this.supportsFloat16 = true;
    }
    // Ensure float textures are filterable
    gl.getExtension('OES_texture_float_linear');

    // Global state
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    // Full-screen quad
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1,
    ]), gl.STATIC_DRAW);
    this.quadBuffer = buf;
  }

  // ---- Accessors ----

  getGL(): WebGL2RenderingContext { return this.gl; }
  getCanvas(): HTMLCanvasElement { return this.canvas; }
  hasFloat16(): boolean { return this.supportsFloat16; }
  hasFloat32(): boolean { return this.supportsFloat32; }

  /**
   * Get the best available HDR format, falling back gracefully.
   */
  getBestFormat(): TextureFormat {
    if (this.supportsFloat16) return 'float16';
    return 'uint8';
  }

  // ---- Shader Programs ----

  createProgram(name: string, fragmentSource: string, vertexSource?: string): WebGLProgram | null {
    if (this.programs.has(name)) return this.programs.get(name)!;

    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertexSource || STANDARD_VERTEX_SHADER);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('Vertex shader error:', gl.getShaderInfoLog(vs));
      gl.deleteShader(vs);
      return null;
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fragmentSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fs));
      console.error('Source:\n', fragmentSource.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n'));
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return null;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Link error:', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return null;
    }

    gl.detachShader(prog, vs);
    gl.detachShader(prog, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    this.programs.set(name, prog);
    return prog;
  }

  getProgram(name: string): WebGLProgram | undefined {
    return this.programs.get(name);
  }

  // ---- Textures ----

  /**
   * Create a managed texture (with associated framebuffer for render targets).
   */
  createManagedTexture(
    name: string,
    width: number,
    height: number,
    format: TextureFormat = 'uint8',
    source?: HTMLImageElement | HTMLCanvasElement | ImageData | null
  ): ManagedTexture | null {
    const gl = this.gl;

    // Choose internal format
    let internalFormat: number;
    let dataFormat: number;
    let dataType: number;

    switch (format) {
      case 'float32':
        if (!this.supportsFloat32) format = this.supportsFloat16 ? 'float16' : 'uint8';
        internalFormat = gl.RGBA32F;
        dataFormat = gl.RGBA;
        dataType = gl.FLOAT;
        break;
      case 'float16':
        if (!this.supportsFloat16) format = 'uint8';
        internalFormat = gl.RGBA16F;
        dataFormat = gl.RGBA;
        dataType = gl.HALF_FLOAT;
        break;
      default:
        internalFormat = gl.RGBA8;
        dataFormat = gl.RGBA;
        dataType = gl.UNSIGNED_BYTE;
    }

    // Recheck after fallback
    if (format === 'uint8') {
      internalFormat = gl.RGBA8;
      dataFormat = gl.RGBA;
      dataType = gl.UNSIGNED_BYTE;
    }

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, dataFormat, dataType, source);
    } else if (source instanceof ImageData) {
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, source.width, source.height, 0, dataFormat, dataType, source.data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, dataFormat, dataType, null);
    }

    // Create framebuffer
    const framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.warn(`Framebuffer incomplete (${format}), falling back to uint8`);
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
      if (format !== 'uint8') {
        return this.createManagedTexture(name, width, height, 'uint8', source);
      }
      return null;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const managed: ManagedTexture = { texture, framebuffer, width, height, format, inUse: false };
    this.textures.set(name, managed);
    return managed;
  }

  /**
   * Upload an image source into an existing managed texture.
   */
  uploadToTexture(name: string, source: HTMLImageElement | HTMLCanvasElement | ImageData): void {
    const managed = this.textures.get(name);
    if (!managed) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, managed.texture);
    if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      managed.width = source.width;
      managed.height = source.height;
    } else if (source instanceof ImageData) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, source.width, source.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source.data);
      managed.width = source.width;
      managed.height = source.height;
    }
  }

  getTexture(name: string): ManagedTexture | undefined {
    return this.textures.get(name);
  }

  // ---- Rendering ----

  /**
   * Render a full-screen quad with a program, binding inputs and setting uniforms.
   */
  renderPass(
    programName: string,
    outputName: string | null,
    inputs: { name: string; textureId: string }[],
    uniforms: Record<string, number | number[] | boolean | string>,
    viewport: { width: number; height: number }
  ): void {
    const gl = this.gl;
    const program = this.programs.get(programName);
    if (!program) {
      console.error('Program not found:', programName);
      return;
    }

    // Bind output framebuffer (null = canvas)
    if (outputName) {
      const output = this.textures.get(outputName);
      if (!output) {
        console.error('Output texture not found:', outputName);
        return;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer);
      gl.viewport(0, 0, output.width, output.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, viewport.width, viewport.height);
    }

    gl.useProgram(program);

    // Bind input textures
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const managed = this.textures.get(input.textureId);
      if (!managed) continue;
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, managed.texture);
      const loc = gl.getUniformLocation(program, input.name);
      if (loc) gl.uniform1i(loc, i);
    }

    // Set uniforms
    for (const [name, value] of Object.entries(uniforms)) {
      const loc = gl.getUniformLocation(program, name);
      if (!loc) continue;

      if (typeof value === 'boolean') {
        gl.uniform1i(loc, value ? 1 : 0);
      } else if (typeof value === 'number') {
        // Detect integer uniforms by name convention (u_mode, u_formula, etc.)
        if (Number.isInteger(value) && (name.includes('mode') || name.includes('formula') ||
            name.includes('octaves') || name.includes('channel') || name.includes('method') ||
            name.includes('units') || name.includes('operation') || name.includes('type') ||
            name.includes('vertices') || name.includes('repeat') || name.includes('seed') ||
            name.includes('bond'))) {
          gl.uniform1i(loc, value);
        } else {
          gl.uniform1f(loc, value);
        }
      } else if (Array.isArray(value)) {
        if (value.length === 2) gl.uniform2fv(loc, value);
        else if (value.length === 3) gl.uniform3fv(loc, value);
        else if (value.length === 4) gl.uniform4fv(loc, value);
      }
    }

    // Set resolution uniform
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    if (resLoc) gl.uniform2fv(resLoc, [viewport.width, viewport.height]);

    // Draw quad
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(posLoc);
  }

  /**
   * Read pixels from a managed texture.
   */
  readPixels(name: string): Uint8Array {
    const managed = this.textures.get(name);
    if (!managed) return new Uint8Array(0);
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, managed.framebuffer);
    const pixels = new Uint8Array(managed.width * managed.height * 4);
    gl.readPixels(0, 0, managed.width, managed.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return pixels;
  }

  /**
   * Read pixels from canvas.
   */
  readCanvasPixels(): Uint8Array {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const pixels = new Uint8Array(this.canvas.width * this.canvas.height * 4);
    gl.readPixels(0, 0, this.canvas.width, this.canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return pixels;
  }

  // ---- Lifecycle ----

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  clear(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  dispose(): void {
    const gl = this.gl;
    this.programs.forEach(p => gl.deleteProgram(p));
    this.programs.clear();
    this.textures.forEach(t => {
      gl.deleteTexture(t.texture);
      gl.deleteFramebuffer(t.framebuffer);
    });
    this.textures.clear();
    if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
  }
}

/**
 * TexturePool - manages a pool of reusable render targets for ping-pong rendering.
 */
export class TexturePool {
  private ctx: GLContext;
  private pool: ManagedTexture[] = [];
  private inUse = new Map<string, ManagedTexture>();
  private counter = 0;

  constructor(ctx: GLContext) {
    this.ctx = ctx;
  }

  /**
   * Acquire a render target from the pool.
   */
  acquire(width: number, height: number, format?: TextureFormat): string {
    const fmt = format || this.ctx.getBestFormat();

    // Try to find a matching unused texture in the pool
    for (let i = 0; i < this.pool.length; i++) {
      const t = this.pool[i];
      if (!t.inUse && t.width === width && t.height === height && t.format === fmt) {
        t.inUse = true;
        const id = `pool_${this.counter++}`;
        this.inUse.set(id, t);
        return id;
      }
    }

    // Create new managed texture
    const id = `pool_${this.counter++}`;
    const managed = this.ctx.createManagedTexture(id, width, height, fmt);
    if (managed) {
      managed.inUse = true;
      this.pool.push(managed);
      this.inUse.set(id, managed);
    }
    return id;
  }

  /**
   * Release a render target back to the pool.
   */
  release(id: string): void {
    const t = this.inUse.get(id);
    if (t) {
      t.inUse = false;
      this.inUse.delete(id);
    }
  }

  /**
   * Release all textures.
   */
  releaseAll(): void {
    for (const t of this.inUse.values()) {
      t.inUse = false;
    }
    this.inUse.clear();
  }

  /**
   * Get a managed texture by pool ID.
   */
  get(id: string): ManagedTexture | undefined {
    return this.inUse.get(id) || this.ctx.getTexture(id);
  }
}
