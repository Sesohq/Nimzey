import { UniformDefinition, PassDefinition } from '@/types';

/**
 * Declarative shader definition. Each node type has one of these.
 * The render pipeline uses this to compile, combine, and execute shaders.
 */
export interface ShaderDefinition {
  /** Unique ID matching NodeDefinition.shaderId */
  id: string;

  /**
   * GLSL fragment shader body. Should define a `processPixel` function:
   *
   * ```glsl
   * vec4 processPixel(vec2 uv) {
   *   // Sample inputs via: texture(u_input0, uv), texture(u_input1, uv), etc.
   *   // Access parameters via uniforms: u_paramName
   *   return outputColor;
   * }
   * ```
   *
   * The pipeline wraps this in a full shader with proper #version, precision,
   * vertex shader output, and main() function.
   */
  glsl: string;

  /** Uniforms this shader needs (auto-mapped from node parameters) */
  uniforms: UniformDefinition[];

  /** Number of input textures (sampler2D) this shader requires */
  inputCount: number;

  /**
   * If true, this shader samples neighbors (blur, edge detect, etc.)
   * Neighborhood shaders CANNOT be fused with other shaders.
   */
  isNeighborhood: boolean;

  /**
   * For multi-pass operations (e.g., separable blur: H pass + V pass).
   * If defined, the pipeline executes each pass in sequence.
   * If undefined, the shader is single-pass.
   */
  passes?: PassDefinition[];

  /**
   * Optional helper GLSL functions that should be included before processPixel.
   * Useful for noise functions, color space conversions, etc.
   */
  helpers?: string;
}

/** Standard vertex shader shared by ALL fragment shaders */
export const STANDARD_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_texCoord;

void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/** Common GLSL utility functions available to all shaders */
export const COMMON_GLSL_HELPERS = `
// ---- Color Space Conversions ----

vec3 rgb2hsl(vec3 c) {
  float maxC = max(c.r, max(c.g, c.b));
  float minC = min(c.r, min(c.g, c.b));
  float l = (maxC + minC) * 0.5;
  if (maxC == minC) return vec3(0.0, 0.0, l);
  float d = maxC - minC;
  float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
  float h;
  if (maxC == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
  else if (maxC == c.g) h = (c.b - c.r) / d + 2.0;
  else h = (c.r - c.g) / d + 4.0;
  h /= 6.0;
  return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 0.5) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 hsl) {
  if (hsl.y == 0.0) return vec3(hsl.z);
  float q = hsl.z < 0.5 ? hsl.z * (1.0 + hsl.y) : hsl.z + hsl.y - hsl.z * hsl.y;
  float p = 2.0 * hsl.z - q;
  return vec3(
    hue2rgb(p, q, hsl.x + 1.0 / 3.0),
    hue2rgb(p, q, hsl.x),
    hue2rgb(p, q, hsl.x - 1.0 / 3.0)
  );
}

vec3 rgb2hsb(vec3 c) {
  float maxC = max(c.r, max(c.g, c.b));
  float minC = min(c.r, min(c.g, c.b));
  float d = maxC - minC;
  float s = maxC == 0.0 ? 0.0 : d / maxC;
  float h = 0.0;
  if (d > 0.0) {
    if (maxC == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    else if (maxC == c.g) h = (c.b - c.r) / d + 2.0;
    else h = (c.r - c.g) / d + 4.0;
    h /= 6.0;
  }
  return vec3(h, s, maxC);
}

vec3 hsb2rgb(vec3 hsb) {
  vec3 rgb = clamp(abs(mod(hsb.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return hsb.z * mix(vec3(1.0), rgb, hsb.y);
}

// HSY color model (perceptual luminance weights)
float luminanceHSY(vec3 c) {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

// Standard luminance
float luminance(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

// ---- Noise Functions ----

// Hash function for noise generation
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453123);
}

// 2D Perlin noise (single octave)
vec2 perlinGrad(vec2 p) {
  float h = hash(p) * 6.28318530718;
  return vec2(cos(h), sin(h));
}

float perlinNoise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // Hermite interpolation

  float n00 = dot(perlinGrad(i), f);
  float n10 = dot(perlinGrad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float n01 = dot(perlinGrad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float n11 = dot(perlinGrad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

  return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
}

// Fractal Brownian Motion
float fbm(vec2 p, int octaves, float roughness) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  float maxValue = 0.0;

  for (int i = 0; i < 11; i++) {
    if (i >= octaves) break;
    value += perlinNoise2D(p * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= roughness;
    frequency *= 2.0;
  }

  return value / maxValue;
}

// Worley (cellular) noise
float worleyNoise(vec2 p, int formula) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float d1 = 1e10;
  float d2 = 1e10;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = vec2(hash(i + neighbor), hash(i + neighbor + vec2(31.0, 17.0)));
      vec2 diff = neighbor + point - f;

      float dist;
      if (formula < 3) {
        dist = length(diff); // Euclidean
      } else if (formula < 6) {
        dist = abs(diff.x) + abs(diff.y); // Manhattan
      } else {
        dist = max(abs(diff.x), abs(diff.y)); // Chebyshev
      }

      if (dist < d1) { d2 = d1; d1 = dist; }
      else if (dist < d2) { d2 = dist; }
    }
  }

  int f_idx = formula % 3;
  if (f_idx == 0) return d1;
  if (f_idx == 1) return d2;
  return d2 - d1;
}

// ---- Blend Modes (19 modes) ----

vec3 blendMode(vec3 base, vec3 blend, int mode) {
  if (mode == 0) return blend; // Normal
  if (mode == 1) return min(base, blend); // Darken
  if (mode == 2) return base * blend; // Multiply
  if (mode == 3) return max(vec3(0.0), 1.0 - (1.0 - base) / max(blend, vec3(0.001))); // Color Burn
  if (mode == 4) return max(vec3(0.0), base + blend - 1.0); // Linear Burn
  if (mode == 5) return max(base, blend); // Lighten
  if (mode == 6) return 1.0 - (1.0 - base) * (1.0 - blend); // Screen
  if (mode == 7) return min(vec3(1.0), base / max(1.0 - blend, vec3(0.001))); // Color Dodge
  if (mode == 8) return min(vec3(1.0), base + blend); // Linear Dodge
  if (mode == 9) { // Overlay
    return mix(
      2.0 * base * blend,
      1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
      step(0.5, base)
    );
  }
  if (mode == 10) { // Soft Light
    return mix(
      2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
      sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
      step(0.5, blend)
    );
  }
  if (mode == 11) { // Hard Light
    return mix(
      2.0 * base * blend,
      1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
      step(0.5, blend)
    );
  }
  if (mode == 12) { // Vivid Light
    return mix(
      max(vec3(0.0), 1.0 - (1.0 - base) / max(2.0 * blend, vec3(0.001))),
      min(vec3(1.0), base / max(2.0 * (1.0 - blend), vec3(0.001))),
      step(0.5, blend)
    );
  }
  if (mode == 13) return clamp(base + 2.0 * blend - 1.0, 0.0, 1.0); // Linear Light
  if (mode == 14) return abs(base - blend); // Difference
  if (mode == 15) return base + blend - 2.0 * base * blend; // Exclusion
  // HSY-based modes
  if (mode >= 16) {
    vec3 baseHSL = rgb2hsl(base);
    vec3 blendHSL = rgb2hsl(blend);
    if (mode == 16) return hsl2rgb(vec3(blendHSL.x, baseHSL.y, baseHSL.z)); // Hue
    if (mode == 17) return hsl2rgb(vec3(baseHSL.x, blendHSL.y, baseHSL.z)); // Saturation
    if (mode == 18) return hsl2rgb(vec3(blendHSL.x, blendHSL.y, baseHSL.z)); // Color
    if (mode == 19) return hsl2rgb(vec3(baseHSL.x, baseHSL.y, blendHSL.z)); // Luminosity
  }
  return blend;
}

// ---- Utility ----

vec3 hexToRgb(float r, float g, float b) {
  return vec3(r, g, b);
}

// Rotation matrix
mat2 rot2D(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

// Smooth step with configurable width
float smoothEdge(float edge, float x, float width) {
  return smoothstep(edge - width, edge + width, x);
}
`;

/**
 * Wraps a ShaderDefinition's GLSL into a complete fragment shader.
 * This is the main compilation step.
 */
export function compileFragmentShader(def: ShaderDefinition, inputCount: number): string {
  const uniformDecls = def.uniforms.map(u => {
    const glslType = u.type === 'bool' ? 'int' : u.type;
    return `uniform ${glslType} ${u.name};`;
  }).join('\n');

  const samplerDecls = Array.from({ length: inputCount }, (_, i) =>
    `uniform sampler2D u_input${i};`
  ).join('\n');

  return `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform vec2 u_resolution;

${samplerDecls}
${uniformDecls}

${COMMON_GLSL_HELPERS}

${def.helpers || ''}

${def.glsl}

void main() {
  fragColor = processPixel(v_texCoord);
}
`;
}

/**
 * Creates a ShaderDefinition from a node definition's parameters.
 * Auto-generates uniform declarations from parameter types.
 */
export function parametersToUniforms(parameters: { id: string; type: string }[]): UniformDefinition[] {
  return parameters.map(p => {
    let type: UniformDefinition['type'];
    switch (p.type) {
      case 'float': case 'angle': type = 'float'; break;
      case 'int': case 'option': type = 'int'; break;
      case 'bool': type = 'bool'; break;
      case 'color': case 'hdrColor': type = 'vec3'; break;
      case 'vec2': type = 'vec2'; break;
      default: type = 'float';
    }
    return { name: `u_${p.id}`, type };
  });
}
