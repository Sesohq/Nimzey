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

// Utility function to create and compile a shader with enhanced error handling
function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  try {
    const shader = gl.createShader(type);
    if (!shader) {
      console.error('Failed to create shader object');
      return null;
    }
    
    // Set the shader source
    gl.shaderSource(shader, source);
    
    // Attempt to compile the shader
    gl.compileShader(shader);
    
    // Check if shader compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const errorLog = gl.getShaderInfoLog(shader);
      const shaderType = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
      console.error(`${shaderType} shader compile error:`, errorLog);
      
      // Log the problematic shader source with line numbers for debugging
      const lines = source.split('\n');
      console.error('Shader source:');
      lines.forEach((line, index) => {
        console.error(`${index + 1}: ${line}`);
      });
      
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  } catch (e) {
    console.error('Exception in compileShader:', e);
    return null;
  }
}

// Utility function to create a shader program from vertex and fragment shaders with better error handling
function createShaderProgram(
  gl: WebGLRenderingContext, 
  vertexSource: string, 
  fragmentSource: string
): WebGLProgram | null {
  try {
    // Compile the shaders
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    if (!vertexShader) {
      console.error('Failed to compile vertex shader');
      return null;
    }
    
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!fragmentShader) {
      console.error('Failed to compile fragment shader');
      gl.deleteShader(vertexShader); // Clean up the vertex shader
      return null;
    }
    
    // Create the program and attach shaders
    const program = gl.createProgram();
    if (!program) {
      console.error('Failed to create WebGL program');
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    
    // Link the program
    gl.linkProgram(program);
    
    // Check if program linked successfully
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const errorLog = gl.getProgramInfoLog(program);
      console.error('Program link error:', errorLog);
      
      // Clean up resources
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }
    
    // Validate the program
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      console.error('Program validation error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }
    
    // Clean up shader objects as they're now linked into the program
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    
    return program;
  } catch (e) {
    console.error('Exception in createShaderProgram:', e);
    return null;
  }
}

// Setup WebGL context and buffers with error handling
function setupWebGL(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  image: HTMLImageElement
): boolean {
  try {
    // Set up position and texture coordinate attributes
    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) {
      console.error('Failed to create position buffer');
      return false;
    }
    
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
    if (positionLocation === -1) {
      console.error('Failed to get attribute location for a_position');
      return false;
    }
    
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Set up texture coordinates
    const texCoordBuffer = gl.createBuffer();
    if (!texCoordBuffer) {
      console.error('Failed to create texture coordinate buffer');
      return false;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    const texCoords = [
      0, 0,  // bottom left
      1, 0,  // bottom right
      0, 1,  // top left
      1, 1,  // top right
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    if (texCoordLocation === -1) {
      console.error('Failed to get attribute location for a_texCoord');
      return false;
    }
    
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Create and set up the texture
    const texture = gl.createTexture();
    if (!texture) {
      console.error('Failed to create texture');
      return false;
    }
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Set texture parameters with error checking
    try {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } catch (e) {
      console.error('Error setting texture parameters:', e);
      return false;
    }
    
    // Upload the image into the texture with error checking
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
      // Check for any WebGL errors
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error('WebGL error when uploading texture:', error);
        return false;
      }
    } catch (e) {
      console.error('Exception uploading texture:', e);
      return false;
    }
    
    // Specific check for Replit environment - some instances might have limited WebGL support
    if (typeof window !== 'undefined' && window.location.hostname.includes('replit')) {
      console.log('Running in Replit environment - checking WebGL limitations');
      
      // Additional validation for Replit environment
      try {
        // Test a small draw operation to ensure rendering works
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        const testError = gl.getError();
        if (testError !== gl.NO_ERROR) {
          console.error('WebGL test draw failed in Replit:', testError);
          // We'll still proceed, but log a warning
          console.warn('WebGL might have limited functionality in this environment');
        }
      } catch (e) {
        console.warn('WebGL test in Replit environment failed:', e);
        // Continue anyway, as this is just a test
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in setupWebGL:', error);
    return false;
  }
}

// Apply filter using WebGL
export function applyFilterGPU(
  filterType: FilterType,
  sourceImage: HTMLImageElement,
  canvas: HTMLCanvasElement,
  params: any[] = []
): boolean {
  try {
    // Enhanced WebGL context acquisition
    let gl: WebGLRenderingContext | null = null;
    try {
      // Try regular webgl first
      gl = canvas.getContext('webgl', { 
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false 
      }) as WebGLRenderingContext;
      
      // If that fails, try webgl2
      if (!gl) {
        gl = canvas.getContext('webgl2', { 
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false 
        }) as WebGLRenderingContext;
      }
      
      // If that also fails, try experimental webgl
      if (!gl) {
        gl = canvas.getContext('experimental-webgl', { 
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false 
        }) as WebGLRenderingContext;
      }
    } catch (e) {
      console.error('Error obtaining WebGL context:', e);
    }
    
    // Final check if WebGL is available
    if (!gl) {
      console.error('WebGL not supported in this environment');
      return false;
    }
    
    // Verify the source image is valid
    if (!sourceImage || !sourceImage.complete || sourceImage.width === 0 || sourceImage.height === 0) {
      console.error('Invalid source image for GPU processing');
      return false;
    }
    
    // Set canvas dimensions to match the image
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    // Choose the right shader based on filter type and parameters
    let fragmentShaderSource = '';
    
    // Extract parameters properly to match our noise filter implementation
    const paramsObj: Record<string, any> = {};
    params.forEach(param => {
      paramsObj[param.name] = param.value;
    });
    
    // Get noise type, respecting the value structure in the actual filter
    const noiseType = paramsObj.noiseType || 'Uniform';
    
    // Map our internal noise types to the actual implementations used
    const mappedNoiseType = noiseType.includes('Perlin') ? 'perlin' : 
                           noiseType.includes('Simplex') ? 'simplex' : 'random';
    
    // Select shader based on filter and subtype
    if (filterType === 'blur') {
      fragmentShaderSource = blurFragmentShaderSource;
    } 
    else if (filterType === 'sharpen') {
      fragmentShaderSource = sharpenFragmentShaderSource;
    }
    else if (filterType === 'noise') {
      // Choose noise shader based on the mapped noise type
      switch (mappedNoiseType) {
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
      
      console.log(`Using ${mappedNoiseType} noise shader for noise type: ${noiseType}`);
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
    
    // Create and use the shader program with detailed error handling
    const program = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) {
      console.error(`Failed to create shader program for ${filterType}`);
      return false;
    }
    
    gl.useProgram(program);
    
    // Set up WebGL context with better error handling
    try {
      if (!setupWebGL(gl, program, sourceImage)) {
        console.error(`Failed to set up WebGL for ${filterType}`);
        return false;
      }
    } catch (err) {
      console.error(`Error setting up WebGL for ${filterType}:`, err);
      return false;
    }
    
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
        if (mappedNoiseType === 'perlin' || mappedNoiseType === 'simplex') {
          // Scale parameter affects noise frequency
          const scaleParam = params.find(p => p.name === 'scale');
          const scale = scaleParam ? parseFloat(scaleParam.value as string) : 10.0;
          const scaleLocation = gl.getUniformLocation(program, 'u_scale');
          if (scaleLocation) gl.uniform1f(scaleLocation, scale);
          
          // Colorize parameter (only for simplex noise)
          if (mappedNoiseType === 'simplex') {
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
  } catch (error) {
    console.error('Error applying GPU filter:', error);
    return false;
  }
}

// Helper to check if GPU acceleration is available
export function isGPUAccelerationAvailable(): boolean {
  try {
    // First check if we're in a browser environment
    if (typeof window === 'undefined' || !window.document) {
      console.warn('Not in browser environment, WebGL not available');
      return false;
    }
    
    // Check if we're in Replit preview mode (iframe)
    const isInIframe = window !== window.top;
    const isReplitDomain = window.location.hostname.includes('replit');
    
    // Detect if we're in Replit preview mode
    if (isInIframe && isReplitDomain) {
      console.warn('Running in Replit preview iframe - WebGL may be limited');
      // We'll still continue with the check, but we'll be more lenient
    }
    
    // Create a canvas element for testing
    const canvas = document.createElement('canvas');
    
    // Try multiple WebGL context variants
    let gl: WebGLRenderingContext | null = null;
    
    // Try different context options with error handling for each
    try {
      gl = canvas.getContext('webgl', {
        failIfMajorPerformanceCaveat: false,
        // Don't preserve the drawing buffer to improve performance
        preserveDrawingBuffer: false,
        // Enable antialiasing for better quality
        antialias: true,
        // Allow premultiplied alpha for better blending
        premultipliedAlpha: true,
        // Use low power mode for better mobile support 
        powerPreference: 'low-power'
      }) as WebGLRenderingContext;
      
      if (!gl) throw new Error('webgl context failed');
    } catch (e1) {
      console.warn('Failed to get webgl context:', e1);
      
      try {
        gl = canvas.getContext('webgl2', {
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false,
          antialias: true,
          premultipliedAlpha: true,
          powerPreference: 'low-power'
        }) as WebGLRenderingContext;
        
        if (!gl) throw new Error('webgl2 context failed');
      } catch (e2) {
        console.warn('Failed to get webgl2 context:', e2);
        
        try {
          gl = canvas.getContext('experimental-webgl', {
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: false,
            antialias: true,
            premultipliedAlpha: true
          }) as WebGLRenderingContext;
          
          if (!gl) throw new Error('experimental-webgl context failed');
        } catch (e3) {
          console.warn('Failed to get experimental-webgl context:', e3);
          return false;
        }
      }
    }
    
    // If we got this far, we have a WebGL context, but let's verify it works
    
    // Special handling for Replit preview mode - in this case we'll do a simplified check
    if (isInIframe && isReplitDomain) {
      if (gl) {
        // Just verify we can get basic information from the context
        try {
          const vendor = gl.getParameter(gl.VENDOR);
          const renderer = gl.getParameter(gl.RENDERER);
          
          console.log('WebGL in Replit iframe - vendor:', vendor);
          console.log('WebGL in Replit iframe - renderer:', renderer);
          
          // Skip further tests to avoid iframe restrictions
          console.warn('Running in Replit preview - using CPU mode for reliability');
          return false; // Force CPU mode in Replit preview for better reliability
        } catch (e) {
          console.warn('Error getting WebGL parameters in Replit iframe:', e);
          return false;
        }
      }
      return false;
    }
    
    // For all other environments, do a full check
    
    // Test if WebGL actually works by creating a simple shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      console.warn('Failed to create vertex shader');
      return false;
    }
    
    // Try a very simple shader
    gl.shaderSource(vertexShader, 'void main() { gl_Position = vec4(0.0, 0.0, 0.0, 1.0); }');
    gl.compileShader(vertexShader);
    
    // If compilation succeeded, WebGL is truly available
    const compileStatus = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    
    // Check for any errors
    if (!compileStatus) {
      const error = gl.getShaderInfoLog(vertexShader);
      console.warn('Shader compilation failed:', error);
      gl.deleteShader(vertexShader);
      return false;
    }
    
    // Clean up
    gl.deleteShader(vertexShader);
    
    // Log WebGL capabilities for debugging
    console.log('WebGL Vendor:', gl.getParameter(gl.VENDOR));
    console.log('WebGL Renderer:', gl.getParameter(gl.RENDERER));
    console.log('WebGL Version:', gl.getParameter(gl.VERSION));
    console.log('WebGL Shading Language Version:', gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
    
    // Additional test - check if we can actually render something
    try {
      // Create a framebuffer to test rendering capability
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      
      // Create a small texture for the framebuffer
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      
      // Attach the texture to the framebuffer
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      
      // Check if the framebuffer is complete
      const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (fbStatus !== gl.FRAMEBUFFER_COMPLETE) {
        console.warn('Framebuffer test failed:', fbStatus);
        return false;
      }
      
      // Clean up
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
    } catch (e) {
      console.warn('Error during framebuffer test:', e);
      // Framebuffer test failed, but we'll still allow WebGL for basic operations
      console.log('Falling back to basic WebGL support without framebuffers');
    }
    
    return true;
  } catch (e) {
    console.warn('Error checking WebGL availability:', e);
    return false;
  }
}

// List of filters that support GPU acceleration
// Temporarily removing noise from GPU acceleration to fix issues
export const gpuAcceleratedFilters: FilterType[] = [
  'blur',
  'sharpen',
  // 'noise', // Disabled due to issues
  'halftone',
  'glow'
];