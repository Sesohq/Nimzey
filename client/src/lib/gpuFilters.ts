import { FilterType } from '@/types';

// Vertex shader for all filters - simply passes coordinates
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shader for blur filter
const blurFragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_radius;
  varying vec2 v_texCoord;
  
  void main() {
    vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
    float radius = max(1.0, u_radius);
    float divisor = radius * radius;
    vec4 sum = vec4(0.0);
    
    for (float y = -radius; y <= radius; y += 1.0) {
      for (float x = -radius; x <= radius; x += 1.0) {
        vec2 offset = vec2(x, y) * onePixel;
        sum += texture2D(u_image, v_texCoord + offset);
      }
    }
    
    gl_FragColor = sum / (divisor * 4.0);
  }
`;

// Fragment shader for sharpen filter
const sharpenFragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_amount;
  varying vec2 v_texCoord;
  
  void main() {
    vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
    float amount = u_amount / 100.0;
    
    vec4 center = texture2D(u_image, v_texCoord);
    vec4 top = texture2D(u_image, v_texCoord + vec2(0, -1.0) * onePixel);
    vec4 bottom = texture2D(u_image, v_texCoord + vec2(0, 1.0) * onePixel);
    vec4 left = texture2D(u_image, v_texCoord + vec2(-1.0, 0) * onePixel);
    vec4 right = texture2D(u_image, v_texCoord + vec2(1.0, 0) * onePixel);
    
    // Apply unsharp mask
    vec4 result = center * (1.0 + 4.0 * amount) - (top + bottom + left + right) * amount;
    gl_FragColor = clamp(result, 0.0, 1.0);
  }
`;

// Fragment shader for noise filter
const noiseFragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_amount;
  uniform float u_seed;
  varying vec2 v_texCoord;
  
  // Simple pseudo-random function
  float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233)) + u_seed) * 43758.5453);
  }
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float amount = u_amount / 100.0;
    
    // Generate noise and add it to the original color
    float noise = random(v_texCoord) * 2.0 - 1.0;
    
    gl_FragColor = clamp(color + vec4(noise * amount), 0.0, 1.0);
  }
`;

// Utility function to create and compile a shader
function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  // Check if shader compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

// Utility function to create a shader program from vertex and fragment shaders
function createShaderProgram(
  gl: WebGLRenderingContext, 
  vertexSource: string, 
  fragmentSource: string
): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  
  if (!vertexShader || !fragmentShader) return null;
  
  const program = gl.createProgram();
  if (!program) return null;
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  // Check if program linked successfully
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
}

// Setup WebGL context and buffers
function setupWebGL(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  image: HTMLImageElement
): boolean {
  // Set up position and texture coordinate attributes
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Define the corners of a rectangle that covers the entire canvas
  const positions = [
    -1, -1,  // bottom left
     1, -1,  // bottom right
    -1,  1,  // top left
     1,  1,  // top right
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  
  // Set up texture coordinates
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  const texCoords = [
    0, 0,  // bottom left
    1, 0,  // bottom right
    0, 1,  // top left
    1, 1,  // top right
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  
  const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  
  // Create and set up the texture
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  // Upload the image into the texture
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
  return true;
}

// Apply filter using WebGL
export function applyFilterGPU(
  filterType: FilterType,
  sourceImage: HTMLImageElement,
  canvas: HTMLCanvasElement,
  params: any[] = []
): boolean {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.error('WebGL not supported');
    return false;
  }
  
  // Set canvas dimensions to match the image
  canvas.width = sourceImage.width;
  canvas.height = sourceImage.height;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
  // Choose the right shader based on filter type
  let fragmentShaderSource = '';
  switch (filterType) {
    case 'blur':
      fragmentShaderSource = blurFragmentShaderSource;
      break;
    case 'sharpen':
      fragmentShaderSource = sharpenFragmentShaderSource;
      break;
    case 'noise':
      fragmentShaderSource = noiseFragmentShaderSource;
      break;
    default:
      // If we don't have a GPU implementation for this filter, return false
      return false;
  }
  
  // Create and use the shader program
  const program = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
  if (!program) return false;
  
  gl.useProgram(program);
  
  // Set up WebGL context
  if (!setupWebGL(gl, program, sourceImage)) return false;
  
  // Set filter-specific uniforms
  const textureSizeLocation = gl.getUniformLocation(program, 'u_textureSize');
  gl.uniform2f(textureSizeLocation, sourceImage.width, sourceImage.height);
  
  switch (filterType) {
    case 'blur': {
      const radiusParam = params.find(p => p.name === 'radius');
      const radius = radiusParam ? parseFloat(radiusParam.value as string) : 5.0;
      const radiusLocation = gl.getUniformLocation(program, 'u_radius');
      gl.uniform1f(radiusLocation, radius);
      break;
    }
    case 'sharpen': {
      const amountParam = params.find(p => p.name === 'amount');
      const amount = amountParam ? parseFloat(amountParam.value as string) : 50.0;
      const amountLocation = gl.getUniformLocation(program, 'u_amount');
      gl.uniform1f(amountLocation, amount);
      break;
    }
    case 'noise': {
      const amountParam = params.find(p => p.name === 'amount');
      const amount = amountParam ? parseFloat(amountParam.value as string) : 25.0;
      const amountLocation = gl.getUniformLocation(program, 'u_amount');
      gl.uniform1f(amountLocation, amount);
      
      // Add a random seed for noise variation
      const seedLocation = gl.getUniformLocation(program, 'u_seed');
      gl.uniform1f(seedLocation, Math.random() * 1000);
      break;
    }
  }
  
  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  
  return true;
}

// Helper to check if GPU acceleration is available
export function isGPUAccelerationAvailable(): boolean {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  return !!gl;
}

// List of filters that support GPU acceleration
export const gpuAcceleratedFilters: FilterType[] = ['blur', 'sharpen', 'noise'];