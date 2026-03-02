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
  private uniformTypes = new Map<string, Map<string, number>>(); // programName -> uniformName -> GL type
  private textures = new Map<string, ManagedTexture>();
  private supportsFloat16 = false;
  private supportsFloat32 = false;
  private contextLost = false;
  private contextLostHandler: ((e: Event) => void) | null = null;
  private contextRestoredHandler: ((e: Event) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Handle WebGL context loss/restoration to prevent permanently black canvas
    this.contextLostHandler = (e: Event) => {
      e.preventDefault(); // Allow context to be restored
      this.contextLost = true;
      console.warn('WebGL context lost — GPU resources invalidated');
    };
    this.contextRestoredHandler = () => {
      this.contextLost = false;
      // Clear stale references — all GPU objects are invalid after context loss
      this.programs.clear();
      this.uniformTypes.clear();
      this.textures.clear();
      console.info('WebGL context restored — resources will be recreated on next render');
    };
    canvas.addEventListener('webglcontextlost', this.contextLostHandler);
    canvas.addEventListener('webglcontextrestored', this.contextRestoredHandler);

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
  isContextLost(): boolean { return this.contextLost; }

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

    // Introspect uniform types so we can set int/bool uniforms correctly
    const typeMap = new Map<string, number>();
    const numUniforms = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(prog, i);
      if (info) typeMap.set(info.name, info.type);
    }
    this.uniformTypes.set(name, typeMap);

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

    // Clean up existing texture with same name to prevent GPU memory leak
    const existing = this.textures.get(name);
    if (existing) {
      gl.deleteTexture(existing.texture);
      gl.deleteFramebuffer(existing.framebuffer);
      this.textures.delete(name);
    }

    // Choose internal format
    let internalFormat: number;
    let dataFormat: number;
    let dataType: number;

    // Apply fallback before setting GL format parameters
    if (format === 'float32' && !this.supportsFloat32) {
      format = this.supportsFloat16 ? 'float16' : 'uint8';
    }
    if (format === 'float16' && !this.supportsFloat16) {
      format = 'uint8';
    }

    // Now set GL format parameters based on the (possibly fallen-back) format
    switch (format) {
      case 'float32':
        internalFormat = gl.RGBA32F;
        dataFormat = gl.RGBA;
        dataType = gl.FLOAT;
        break;
      case 'float16':
        internalFormat = gl.RGBA16F;
        dataFormat = gl.RGBA;
        dataType = gl.HALF_FLOAT;
        break;
      default:
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

    // Set uniforms (use introspected types for correct int/bool/float dispatch)
    const typeMap = this.uniformTypes.get(programName);
    for (const [name, value] of Object.entries(uniforms)) {
      const loc = gl.getUniformLocation(program, name);
      if (!loc) continue;

      const glType = typeMap?.get(name);

      if (typeof value === 'boolean') {
        gl.uniform1i(loc, value ? 1 : 0);
      } else if (typeof value === 'number') {
        // Use actual GLSL type from program introspection
        if (glType === gl.INT || glType === gl.BOOL || glType === gl.SAMPLER_2D) {
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
   * Blit a managed texture to the screen canvas using a passthrough shader.
   * GPU-only path — no readPixels, no CPU encoding.
   * Used by focus-mode preview to avoid the slow readPixels→toDataURL roundtrip.
   */
  blitTexture(textureId: string): boolean {
    const managed = this.textures.get(textureId);
    if (!managed) return false;

    // Lazily compile a minimal passthrough program
    if (!this.programs.has('_blit')) {
      const frag = `#version 300 es
precision highp float;
uniform sampler2D u_input0;
in vec2 v_texCoord;
out vec4 fragColor;
void main() { fragColor = texture(u_input0, v_texCoord); }`;
      this.createProgram('_blit', frag);
    }

    this.renderPass('_blit', null, [{ name: 'u_input0', textureId }], {}, {
      width: this.canvas.width,
      height: this.canvas.height,
    });
    return true;
  }

  /**
   * Read pixels from a managed texture.
   * Handles float16/float32 textures by reading as FLOAT and converting to uint8.
   */
  readPixels(name: string): Uint8Array {
    const managed = this.textures.get(name);
    if (!managed) return new Uint8Array(0);
    const gl = this.gl;
    const w = managed.width;
    const h = managed.height;
    gl.bindFramebuffer(gl.FRAMEBUFFER, managed.framebuffer);

    let result: Uint8Array;

    if (managed.format === 'float16' || managed.format === 'float32') {
      // Float framebuffers must be read as FLOAT into Float32Array
      const floatPixels = new Float32Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, floatPixels);
      // Convert float [0..1] to uint8 [0..255]
      result = new Uint8Array(w * h * 4);
      for (let i = 0; i < floatPixels.length; i++) {
        result[i] = Math.max(0, Math.min(255, Math.round(floatPixels[i] * 255)));
      }
    } else {
      result = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, result);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return result;
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
    // Remove context loss event listeners
    if (this.contextLostHandler) {
      this.canvas.removeEventListener('webglcontextlost', this.contextLostHandler);
    }
    if (this.contextRestoredHandler) {
      this.canvas.removeEventListener('webglcontextrestored', this.contextRestoredHandler);
    }

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
