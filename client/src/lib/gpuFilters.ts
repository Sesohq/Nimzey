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

// Fragment shader for basic noise filter
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

// Fragment shader for Perlin noise
const perlinNoiseShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_amount;
  uniform float u_scale;
  uniform float u_seed;
  uniform vec2 u_textureSize;
  varying vec2 v_texCoord;
  
  // GLSL Perlin noise implementation (based on a popular algorithm)
  // Credit: https://github.com/ashima/webgl-noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float amount = u_amount / 100.0;
    float scale = max(1.0, u_scale);
    
    // Generate Perlin noise using properly scaled coordinates
    vec2 scaledCoord = v_texCoord * scale + u_seed;
    float noise = snoise(scaledCoord);
    
    // Normalize to 0-1 range
    noise = (noise + 1.0) * 0.5;
    
    // Apply as offset to color
    gl_FragColor = clamp(color + vec4(vec3(noise - 0.5) * amount, 0.0), 0.0, 1.0);
  }
`;

// Fragment shader for colorized Simplex noise
const simplexNoiseShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_amount;
  uniform float u_scale;
  uniform float u_seed;
  uniform float u_colorize;
  uniform vec2 u_textureSize;
  varying vec2 v_texCoord;

  // Simplex noise implementation
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                     + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                           dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  // Function to convert HSV to RGB
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float amount = u_amount / 100.0;
    float scale = max(1.0, u_scale);
    float colorize = u_colorize; // 0 = grayscale, 1 = full color
    
    // Add seed to coordinates for animation/variation
    vec2 scaledCoord = v_texCoord * scale + u_seed;
    
    // Generate simplex noise
    float noise = snoise(scaledCoord);
    
    // Normalize to 0-1 range
    noise = (noise + 1.0) * 0.5;
    
    // Create color from noise
    vec3 noiseColor;
    if (colorize > 0.5) {
      // Create colorful noise using HSV color space
      // Use the noise value as hue, with full saturation and value
      noiseColor = hsv2rgb(vec3(noise, 0.8, 0.9));
    } else {
      // Grayscale noise
      noiseColor = vec3(noise);
    }
    
    // Blend with original image
    gl_FragColor = mix(color, vec4(noiseColor, 1.0), amount);
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
  
  // Choose the right shader based on filter type and parameters
  let fragmentShaderSource = '';
  
  // Get specific parameters
  const noiseTypeParam = params.find(p => p.name === 'noiseType');
  const noiseType = noiseTypeParam ? noiseTypeParam.value as string : 'random';
  
  // Select shader based on filter and subtype
  if (filterType === 'blur') {
    fragmentShaderSource = blurFragmentShaderSource;
  } 
  else if (filterType === 'sharpen') {
    fragmentShaderSource = sharpenFragmentShaderSource;
  }
  else if (filterType === 'noise') {
    // Choose noise shader based on the noiseType parameter
    switch (noiseType) {
      case 'perlin':
        fragmentShaderSource = perlinNoiseShaderSource;
        break;
      case 'simplex':
        fragmentShaderSource = simplexNoiseShaderSource;
        break;
      default:
        // Default to basic noise
        fragmentShaderSource = noiseFragmentShaderSource;
    }
  }
  else if (filterType === 'halftone') {
    // Use the halftone shader
    fragmentShaderSource = halftoneFragmentShaderSource;
  }
  else if (filterType === 'glow') {
    // Use the glow shader for highlight glow
    fragmentShaderSource = glowFragmentShaderSource;
  }
  else {
    // If we don't have a GPU implementation for this filter, return false
    console.log(`No GPU implementation for filter type: ${filterType}`);
    return false;
  }
  
  // Create and use the shader program
  const program = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
  if (!program) return false;
  
  gl.useProgram(program);
  
  // Set up WebGL context
  if (!setupWebGL(gl, program, sourceImage)) return false;
  
  // Set common uniforms
  const textureSizeLocation = gl.getUniformLocation(program, 'u_textureSize');
  if (textureSizeLocation) {
    gl.uniform2f(textureSizeLocation, sourceImage.width, sourceImage.height);
  }
  
  // Generate a random seed value for noise variations
  const randomSeed = Math.random() * 1000;
  
  // Set filter-specific uniforms
  switch (filterType) {
    case 'blur': {
      const radiusParam = params.find(p => p.name === 'radius');
      const radius = radiusParam ? parseFloat(radiusParam.value as string) : 5.0;
      const radiusLocation = gl.getUniformLocation(program, 'u_radius');
      if (radiusLocation) gl.uniform1f(radiusLocation, radius);
      break;
    }
    case 'sharpen': {
      const amountParam = params.find(p => p.name === 'amount');
      const amount = amountParam ? parseFloat(amountParam.value as string) : 50.0;
      const amountLocation = gl.getUniformLocation(program, 'u_amount');
      if (amountLocation) gl.uniform1f(amountLocation, amount);
      break;
    }
    case 'noise': {
      // Common noise parameters
      const amountParam = params.find(p => p.name === 'amount');
      const amount = amountParam ? parseFloat(amountParam.value as string) : 25.0;
      const amountLocation = gl.getUniformLocation(program, 'u_amount');
      if (amountLocation) gl.uniform1f(amountLocation, amount);
      
      // Add a random seed for noise variation
      const seedLocation = gl.getUniformLocation(program, 'u_seed');
      if (seedLocation) gl.uniform1f(seedLocation, randomSeed);
      
      // Advanced noise parameters - these will be ignored if the shader doesn't use them
      if (noiseType === 'perlin' || noiseType === 'simplex') {
        // Scale parameter affects noise frequency
        const scaleParam = params.find(p => p.name === 'scale');
        const scale = scaleParam ? parseFloat(scaleParam.value as string) : 10.0;
        const scaleLocation = gl.getUniformLocation(program, 'u_scale');
        if (scaleLocation) gl.uniform1f(scaleLocation, scale);
        
        // Colorize parameter (only for simplex noise)
        if (noiseType === 'simplex') {
          const colorizeParam = params.find(p => p.name === 'colorize');
          const colorize = colorizeParam ? (colorizeParam.value === 'true' ? 1.0 : 0.0) : 0.0;
          const colorizeLocation = gl.getUniformLocation(program, 'u_colorize');
          if (colorizeLocation) gl.uniform1f(colorizeLocation, colorize);
        }
      }
      break;
    }
    case 'halftone': {
      // Set halftone parameters
      // Size of dots
      const dotSizeParam = params.find(p => p.name === 'dotSize');
      const dotSize = dotSizeParam ? parseFloat(dotSizeParam.value as string) : 50.0;
      const dotSizeLocation = gl.getUniformLocation(program, 'u_dotSize');
      if (dotSizeLocation) gl.uniform1f(dotSizeLocation, dotSize);
      
      // Grid spacing
      const spacingParam = params.find(p => p.name === 'gridSize');
      const spacing = spacingParam ? parseFloat(spacingParam.value as string) : 8.0;
      const spacingLocation = gl.getUniformLocation(program, 'u_spacing');
      if (spacingLocation) gl.uniform1f(spacingLocation, spacing);
      
      // Rotation angle
      const angleParam = params.find(p => p.name === 'angle');
      const angle = angleParam ? parseFloat(angleParam.value as string) : 45.0;
      const angleLocation = gl.getUniformLocation(program, 'u_angle');
      if (angleLocation) gl.uniform1f(angleLocation, angle);
      
      // Brightness adjustment
      const brightnessParam = params.find(p => p.name === 'brightnessAdjust');
      const brightness = brightnessParam ? parseFloat(brightnessParam.value as string) : 0.0;
      const brightnessLocation = gl.getUniformLocation(program, 'u_brightness');
      if (brightnessLocation) gl.uniform1f(brightnessLocation, brightness);
      
      break;
    }
    case 'glow': {
      // Set glow parameters
      // Intensity of the glow
      const intensityParam = params.find(p => p.name === 'intensity');
      const intensity = intensityParam ? parseFloat(intensityParam.value as string) / 100.0 : 0.5;
      const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
      if (intensityLocation) gl.uniform1f(intensityLocation, intensity);
      
      // Threshold to determine highlights (0-1)
      const thresholdParam = params.find(p => p.name === 'threshold');
      const threshold = thresholdParam ? parseFloat(thresholdParam.value as string) / 100.0 : 0.6;
      const thresholdLocation = gl.getUniformLocation(program, 'u_threshold');
      if (thresholdLocation) gl.uniform1f(thresholdLocation, threshold);
      
      // Blur radius for the glow
      const radiusParam = params.find(p => p.name === 'radius');
      const radius = radiusParam ? parseFloat(radiusParam.value as string) : 10.0;
      const radiusLocation = gl.getUniformLocation(program, 'u_radius');
      if (radiusLocation) gl.uniform1f(radiusLocation, radius);
      
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

// Fragment shader for halftone filter
const halftoneFragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_dotSize;
  uniform float u_spacing;
  uniform float u_angle;
  uniform float u_brightness;
  varying vec2 v_texCoord;
  
  // Function to convert RGB to grayscale
  float toGrayscale(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }
  
  void main() {
    // Get original pixel color
    vec4 texColor = texture2D(u_image, v_texCoord);
    
    // Convert to grayscale and apply brightness adjustment
    float brightness = toGrayscale(texColor.rgb);
    brightness = clamp(brightness + u_brightness / 100.0 - 0.5, 0.0, 1.0);
    
    // Calculate grid coordinates
    float spacing = max(2.0, u_spacing);
    float angle = radians(u_angle);
    
    // Rotate coordinates
    vec2 rotatedCoord = vec2(
      v_texCoord.x * cos(angle) - v_texCoord.y * sin(angle),
      v_texCoord.x * sin(angle) + v_texCoord.y * cos(angle)
    );
    
    // Scale to grid
    vec2 scaledCoord = rotatedCoord * u_textureSize / spacing;
    
    // Calculate grid cell center
    vec2 cell = floor(scaledCoord) + 0.5;
    
    // Distance from center
    float dist = distance(scaledCoord, cell);
    
    // Calculate dot size based on brightness and max dot size
    float maxRadius = u_dotSize / 100.0 * spacing / 2.0;
    float radius = maxRadius * brightness;
    
    // Determine if we're inside a dot
    float inDot = step(dist, radius);
    
    // Final color
    gl_FragColor = mix(vec4(0.0, 0.0, 0.0, 1.0), texColor, inDot);
  }
`;

// Fragment shader for glow filter
const glowFragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_intensity;
  uniform float u_threshold;
  uniform float u_radius;
  varying vec2 v_texCoord;
  
  // Function to convert RGB to luminance
  float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }
  
  // Gaussian blur function
  vec4 blur(sampler2D image, vec2 uv, vec2 resolution, float radius) {
    vec4 color = vec4(0.0);
    float total = 0.0;
    
    // Blur size in pixels
    float blurSize = radius / 2.0;
    
    // Number of samples for a reasonable quality
    float samples = 9.0;
    
    for (float x = -samples; x <= samples; x++) {
      for (float y = -samples; y <= samples; y++) {
        vec2 offset = vec2(x, y) * blurSize / resolution;
        // Calculate Gaussian weight
        float weight = exp(-(x*x + y*y) / (2.0 * radius * radius));
        color += texture2D(image, uv + offset) * weight;
        total += weight;
      }
    }
    
    return color / total;
  }
  
  void main() {
    // Get original pixel color
    vec4 originalColor = texture2D(u_image, v_texCoord);
    
    // Calculate luminance for threshold check
    float lum = luminance(originalColor.rgb);
    
    // Create a blurred version of the image for the glow
    vec4 blurredColor = blur(u_image, v_texCoord, u_textureSize, u_radius);
    
    // Only apply glow to highlights above threshold
    float highlightMask = smoothstep(u_threshold, 1.0, lum);
    
    // Calculate the glow color - make it stronger in highlights
    vec4 glowColor = blurredColor * highlightMask * u_intensity;
    
    // Combine original color with glow
    gl_FragColor = originalColor + glowColor;
  }
`;

// List of filters that support GPU acceleration
export const gpuAcceleratedFilters: FilterType[] = [
  'blur',
  'sharpen',
  'noise',
  'halftone',
  'glow',
  // We'll expand this list as we add more GPU-accelerated filters
];