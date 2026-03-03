import { ShaderDefinition } from '../../ShaderDefinition';

export const ditherShader: ShaderDefinition = {
  id: 'dither',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_algorithm', type: 'int' },
    { name: 'u_levels', type: 'int' },
    { name: 'u_intensity', type: 'float' },
    { name: 'u_scale', type: 'float' },
    { name: 'u_colorMode', type: 'int' },
    { name: 'u_invert', type: 'bool' },
  ],
  helpers: `
// ---- Bayer Matrices ----
// All return values in [0, 1) range, normalized

float bayer2(ivec2 p) {
  int idx = (p.x & 1) + (p.y & 1) * 2;
  if (idx == 0) return 0.0 / 4.0;
  if (idx == 1) return 2.0 / 4.0;
  if (idx == 2) return 3.0 / 4.0;
  return 1.0 / 4.0;
}

float bayer4(ivec2 p) {
  int x = p.x & 3;
  int y = p.y & 3;
  int idx = x + y * 4;
  float m[16];
  m[0]  =  0.0; m[1]  =  8.0; m[2]  =  2.0; m[3]  = 10.0;
  m[4]  = 12.0; m[5]  =  4.0; m[6]  = 14.0; m[7]  =  6.0;
  m[8]  =  3.0; m[9]  = 11.0; m[10] =  1.0; m[11] =  9.0;
  m[12] = 15.0; m[13] =  7.0; m[14] = 13.0; m[15] =  5.0;
  return m[idx] / 16.0;
}

float bayer8(ivec2 p) {
  int x = p.x & 7;
  int y = p.y & 7;
  int idx = x + y * 8;
  float m[64];
  m[0]  =  0.0; m[1]  = 32.0; m[2]  =  8.0; m[3]  = 40.0; m[4]  =  2.0; m[5]  = 34.0; m[6]  = 10.0; m[7]  = 42.0;
  m[8]  = 48.0; m[9]  = 16.0; m[10] = 56.0; m[11] = 24.0; m[12] = 50.0; m[13] = 18.0; m[14] = 58.0; m[15] = 26.0;
  m[16] = 12.0; m[17] = 44.0; m[18] =  4.0; m[19] = 36.0; m[20] = 14.0; m[21] = 46.0; m[22] =  6.0; m[23] = 38.0;
  m[24] = 60.0; m[25] = 28.0; m[26] = 52.0; m[27] = 20.0; m[28] = 62.0; m[29] = 30.0; m[30] = 54.0; m[31] = 22.0;
  m[32] =  3.0; m[33] = 35.0; m[34] = 11.0; m[35] = 43.0; m[36] =  1.0; m[37] = 33.0; m[38] =  9.0; m[39] = 41.0;
  m[40] = 51.0; m[41] = 19.0; m[42] = 59.0; m[43] = 27.0; m[44] = 49.0; m[45] = 17.0; m[46] = 57.0; m[47] = 25.0;
  m[48] = 15.0; m[49] = 47.0; m[50] =  7.0; m[51] = 39.0; m[52] = 13.0; m[53] = 45.0; m[54] =  5.0; m[55] = 37.0;
  m[56] = 63.0; m[57] = 31.0; m[58] = 55.0; m[59] = 23.0; m[60] = 61.0; m[61] = 29.0; m[62] = 53.0; m[63] = 21.0;
  return m[idx] / 64.0;
}

// ---- Hash ----

float ditherHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// ---- Clustered Dot Matrix (8x8) ----
// Fills from center outward to create round dot clusters

float clusteredDot8(ivec2 p) {
  int x = p.x & 7;
  int y = p.y & 7;
  int idx = x + y * 8;
  // 8x8 clustered dot: fills radially from center of each 4x4 quadrant
  float m[64];
  m[0]  = 24.0; m[1]  = 10.0; m[2]  = 12.0; m[3]  = 26.0; m[4]  = 35.0; m[5]  = 47.0; m[6]  = 49.0; m[7]  = 37.0;
  m[8]  =  8.0; m[9]  =  0.0; m[10] =  2.0; m[11] = 14.0; m[12] = 45.0; m[13] = 59.0; m[14] = 61.0; m[15] = 51.0;
  m[16] = 22.0; m[17] =  6.0; m[18] =  4.0; m[19] = 16.0; m[20] = 43.0; m[21] = 57.0; m[22] = 63.0; m[23] = 53.0;
  m[24] = 30.0; m[25] = 20.0; m[26] = 18.0; m[27] = 28.0; m[28] = 33.0; m[29] = 41.0; m[30] = 55.0; m[31] = 39.0;
  m[32] = 34.0; m[33] = 46.0; m[34] = 48.0; m[35] = 36.0; m[36] = 25.0; m[37] = 11.0; m[38] = 13.0; m[39] = 27.0;
  m[40] = 44.0; m[41] = 58.0; m[42] = 60.0; m[43] = 50.0; m[44] =  9.0; m[45] =  1.0; m[46] =  3.0; m[47] = 15.0;
  m[48] = 42.0; m[49] = 56.0; m[50] = 62.0; m[51] = 52.0; m[52] = 23.0; m[53] =  7.0; m[54] =  5.0; m[55] = 17.0;
  m[56] = 32.0; m[57] = 40.0; m[58] = 54.0; m[59] = 38.0; m[60] = 31.0; m[61] = 21.0; m[62] = 19.0; m[63] = 29.0;
  return m[idx] / 64.0;
}

// ---- Line Screen Dither ----
// Creates horizontal line patterns within each cell

float lineScreen(ivec2 p, int matrixSize) {
  int y = p.y % matrixSize;
  return float(y) / float(matrixSize);
}

// ---- Dither Threshold Lookup ----
// Returns threshold value in [0, 1) for ordered dither methods.
// algo: 0=Bayer8x8, 1=Bayer4x4, 2=Bayer2x2, 3=Clustered Dot,
//       4=Line Screen, 5=Noise/Random, 6=Halftone Dot

float getDitherThreshold(ivec2 pixelCoord, int algo) {
  if (algo == 0) return bayer8(pixelCoord);
  if (algo == 1) return bayer4(pixelCoord);
  if (algo == 2) return bayer2(pixelCoord);
  if (algo == 3) return clusteredDot8(pixelCoord);
  if (algo == 4) return lineScreen(pixelCoord, 8);
  if (algo == 5) return ditherHash(vec2(pixelCoord));
  // algo == 6 (halftone dot) is handled separately in processPixel
  return 0.0;
}

// ---- Quantize to N levels ----

float ditherQuantize(float val, float levels) {
  return floor(val * (levels - 1.0) + 0.5) / (levels - 1.0);
}
`,
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 src = texture(u_input0, uv);
  float intensity = u_intensity / 100.0;

  // Bypass: no dithering at 0% intensity
  if (intensity < 0.001) return src;

  float levels = float(u_levels);
  float cellSize = u_scale;

  // ---- Cell-based sampling ----
  // When scale > 1, we downsample by reading from the center of each cell.
  // This creates the chunky/blocky "dither tone" look where the dither
  // pattern is visibly large.
  vec2 pixelPos = uv * u_resolution;

  // Compute which cell this pixel belongs to, and sample from cell center
  vec2 cellIndex = floor(pixelPos / cellSize);
  vec2 cellCenter = (cellIndex + 0.5) * cellSize / u_resolution;
  // Clamp to valid UV range
  cellCenter = clamp(cellCenter, vec2(0.0), vec2(1.0));

  // Sample the source from the cell center (creates the blockified look)
  vec4 cellSrc = texture(u_input0, cellCenter);

  // Position within the cell for dither pattern tiling
  ivec2 cellPixel = ivec2(mod(pixelPos, cellSize));

  int algo = u_algorithm;

  // ---- Halftone Dot Mode (algo 6) ----
  // Circular dots whose size varies with luminance
  if (algo == 6) {
    float val;
    vec3 cellColor = cellSrc.rgb;

    if (u_colorMode == 0) {
      // Mono: compute luminance
      val = luminance(cellColor);
    } else {
      val = luminance(cellColor);
    }

    // Position within cell normalized to [-0.5, 0.5]
    vec2 cellUV = (vec2(cellPixel) + 0.5) / cellSize - 0.5;
    float dist = length(cellUV) * 2.0; // 0 at center, ~1.414 at corners

    // Radius based on darkness: darker = bigger dot
    // intensity controls how aggressively dots fill
    float darkness = 1.0 - val;
    float radius = sqrt(darkness * intensity) * 1.2;

    // Hard edge for clean dots
    float dot = 1.0 - step(radius, dist);

    if (u_colorMode == 0) {
      // Mono halftone
      float out_val = dot;
      if (u_invert == 1) out_val = 1.0 - out_val;
      return vec4(vec3(out_val), src.a);
    } else if (u_colorMode == 1) {
      // Per-channel halftone dots
      vec3 result;
      for (int ch = 0; ch < 3; ch++) {
        float chVal = ch == 0 ? cellColor.r : (ch == 1 ? cellColor.g : cellColor.b);
        float chDark = 1.0 - chVal;
        float chRadius = sqrt(chDark * intensity) * 1.2;
        float chDot = 1.0 - step(chRadius, dist);
        if (ch == 0) result.r = chDot;
        else if (ch == 1) result.g = chDot;
        else result.b = chDot;
      }
      if (u_invert == 1) result = 1.0 - result;
      return vec4(result, src.a);
    } else {
      // Preserve hue: dot shows original color, background is white (or black if inverted)
      float out_val = dot;
      if (u_invert == 1) out_val = 1.0 - out_val;
      vec3 bg = vec3(1.0 - float(u_invert));
      vec3 result = mix(bg, cellColor, out_val);
      return vec4(result, src.a);
    }
  }

  // ---- Ordered Dither Modes (algos 0-5) ----
  // Classic ordered dithering: compare luminance against Bayer/pattern threshold

  // Get the dither threshold for this pixel's position within the cell
  float threshold = getDitherThreshold(cellPixel, algo);

  // The threshold is in [0, 1). We use it to decide which quantized level
  // each pixel gets. This is the core ordered dithering algorithm:
  //   quantized = floor((value * (levels-1) + threshold * intensity) ) / (levels-1)
  // This properly distributes pixels across quantization levels based on the
  // Bayer pattern, creating the characteristic dither texture.

  vec3 result;

  if (u_colorMode == 0) {
    // ---- Mono Mode ----
    float lum = luminance(cellSrc.rgb);
    // Ordered dither: add threshold offset before quantizing
    float dithered = lum + (threshold - 0.5) * intensity / (levels - 1.0);
    dithered = ditherQuantize(clamp(dithered, 0.0, 1.0), levels);
    if (u_invert == 1) dithered = 1.0 - dithered;
    result = vec3(dithered);

  } else if (u_colorMode == 1) {
    // ---- Per Channel RGB Mode ----
    vec3 color = cellSrc.rgb;
    float offset = (threshold - 0.5) * intensity / (levels - 1.0);
    result = vec3(
      ditherQuantize(clamp(color.r + offset, 0.0, 1.0), levels),
      ditherQuantize(clamp(color.g + offset, 0.0, 1.0), levels),
      ditherQuantize(clamp(color.b + offset, 0.0, 1.0), levels)
    );
    if (u_invert == 1) result = 1.0 - result;

  } else {
    // ---- Preserve Hue Mode ----
    vec3 hsl = rgb2hsl(cellSrc.rgb);
    float lum = hsl.z;
    float dithered = lum + (threshold - 0.5) * intensity / (levels - 1.0);
    dithered = ditherQuantize(clamp(dithered, 0.0, 1.0), levels);
    if (u_invert == 1) dithered = 1.0 - dithered;
    result = hsl2rgb(vec3(hsl.x, hsl.y, dithered));
  }

  return vec4(result, src.a);
}`,
};
