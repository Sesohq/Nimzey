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

float bayer2(ivec2 p) {
  int idx = (p.x & 1) + (p.y & 1) * 2;
  // Matrix: [0, 2, 3, 1] / 4.0
  if (idx == 0) return 0.0 / 4.0;
  if (idx == 1) return 2.0 / 4.0;
  if (idx == 2) return 3.0 / 4.0;
  return 1.0 / 4.0;
}

float bayer4(ivec2 p) {
  int x = p.x & 3;
  int y = p.y & 3;
  int idx = x + y * 4;
  // 4x4 Bayer matrix normalized to 0-1
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
  // Full 8x8 Bayer matrix normalized to 0-1
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

// ---- Hash & Noise ----

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float interleavedGradientNoise(vec2 pos) {
  return fract(52.9829189 * fract(0.06711056 * pos.x + 0.00583715 * pos.y));
}

// ---- Quantization ----

float quantize(float val, float levels) {
  return floor(val * levels + 0.5) / levels;
}

// ---- Clustered Dot Matrix (4x4) ----

float clusteredDot4(ivec2 p) {
  int x = p.x & 3;
  int y = p.y & 3;
  int idx = x + y * 4;
  // Clustered dot ordering: center pixels fill first for round dots
  float m[16];
  m[0]  = 12.0; m[1]  =  5.0; m[2]  =  6.0; m[3]  = 13.0;
  m[4]  =  4.0; m[5]  =  0.0; m[6]  =  1.0; m[7]  =  7.0;
  m[8]  = 11.0; m[9]  =  3.0; m[10] =  2.0; m[11] =  8.0;
  m[12] = 15.0; m[13] = 10.0; m[14] =  9.0; m[15] = 14.0;
  return m[idx] / 16.0;
}

// ---- Pattern Dither (4x4 tile) ----

float patternThreshold(ivec2 p, float val) {
  // Map gray level to a fill pattern in a 4x4 tile
  // Each level turns on additional pixels in a spiral from center
  int x = p.x & 3;
  int y = p.y & 3;
  int idx = x + y * 4;
  // Ordered fill sequence for pattern dither
  float order[16];
  order[0]  = 15.0; order[1]  =  7.0; order[2]  =  8.0; order[3]  = 14.0;
  order[4]  =  6.0; order[5]  =  0.0; order[6]  =  1.0; order[7]  =  9.0;
  order[8]  =  5.0; order[9]  =  3.0; order[10] =  2.0; order[11] = 10.0;
  order[12] = 13.0; order[13] =  4.0; order[14] = 11.0; order[15] = 12.0;
  float threshold = order[idx] / 16.0;
  return step(threshold, val);
}

// ---- Error Diffusion GPU Approximations ----
// These sample neighbors' original values to estimate propagated error

float getErrorDiffusionThreshold(vec2 uv, vec2 texel, float levels, int algo) {
  // Sample original values of previously-processed neighbors
  // In a left-to-right, top-to-bottom scanline, previously processed
  // pixels are: left (-1,0), up-left (-1,-1), up (0,-1), up-right (1,-1)
  float origLeft   = luminance(texture(u_input0, uv + vec2(-texel.x, 0.0)).rgb);
  float origUp     = luminance(texture(u_input0, uv + vec2(0.0, -texel.y)).rgb);
  float origUpLeft = luminance(texture(u_input0, uv + vec2(-texel.x, -texel.y)).rgb);
  float origUpRight= luminance(texture(u_input0, uv + vec2(texel.x, -texel.y)).rgb);
  float origLeft2  = luminance(texture(u_input0, uv + vec2(-2.0 * texel.x, 0.0)).rgb);
  float origUpLeft2= luminance(texture(u_input0, uv + vec2(-2.0 * texel.x, -texel.y)).rgb);
  float origUpRight2=luminance(texture(u_input0, uv + vec2(2.0 * texel.x, -texel.y)).rgb);
  float origDown   = luminance(texture(u_input0, uv + vec2(0.0, texel.y)).rgb);

  // Compute quantization errors of neighbors
  float errLeft    = origLeft    - quantize(origLeft, levels);
  float errUp      = origUp      - quantize(origUp, levels);
  float errUpLeft  = origUpLeft  - quantize(origUpLeft, levels);
  float errUpRight = origUpRight - quantize(origUpRight, levels);
  float errLeft2   = origLeft2   - quantize(origLeft2, levels);
  float errUpLeft2 = origUpLeft2 - quantize(origUpLeft2, levels);
  float errUpRight2= origUpRight2- quantize(origUpRight2, levels);

  float accumulated = 0.0;

  if (algo == 6) {
    // Floyd-Steinberg: 7/16 from left, 3/16 from up-left, 5/16 from up, 1/16 from up-right
    accumulated = errLeft * (7.0 / 16.0)
                + errUpLeft * (3.0 / 16.0)
                + errUp * (5.0 / 16.0)
                + errUpRight * (1.0 / 16.0);
  } else if (algo == 7) {
    // Atkinson: distributes 6/8 of error (75%) across 6 neighbors
    // Left, Up, UpLeft, UpRight each get 1/8, plus Left2 and Down approximation
    accumulated = errLeft * (1.0 / 8.0)
                + errUp * (1.0 / 8.0)
                + errUpLeft * (1.0 / 8.0)
                + errUpRight * (1.0 / 8.0)
                + errLeft2 * (1.0 / 8.0);
    // 6th neighbor (below-left) not available in single pass, approximate
    accumulated += errUp * (1.0 / 8.0);
  } else if (algo == 11) {
    // Stucki: wider kernel with 5 neighbors visible
    accumulated = errLeft * (8.0 / 42.0)
                + errLeft2 * (4.0 / 42.0)
                + errUp * (8.0 / 42.0)
                + errUpLeft * (4.0 / 42.0)
                + errUpRight * (4.0 / 42.0)
                + errUpLeft2 * (2.0 / 42.0)
                + errUpRight2 * (2.0 / 42.0);
  } else if (algo == 12) {
    // Burkes: similar to Stucki but different weights
    accumulated = errLeft * (8.0 / 32.0)
                + errLeft2 * (4.0 / 32.0)
                + errUp * (8.0 / 32.0)
                + errUpLeft * (4.0 / 32.0)
                + errUpRight * (4.0 / 32.0);
  } else if (algo == 13) {
    // Sierra Lite: simple 3-neighbor kernel
    accumulated = errLeft * (2.0 / 4.0)
                + errUp * (1.0 / 4.0)
                + errUpLeft * (1.0 / 4.0);
  }

  return accumulated;
}

vec3 getErrorDiffusionThresholdRGB(vec2 uv, vec2 texel, float levels, int algo) {
  vec3 origLeft    = texture(u_input0, uv + vec2(-texel.x, 0.0)).rgb;
  vec3 origUp      = texture(u_input0, uv + vec2(0.0, -texel.y)).rgb;
  vec3 origUpLeft  = texture(u_input0, uv + vec2(-texel.x, -texel.y)).rgb;
  vec3 origUpRight = texture(u_input0, uv + vec2(texel.x, -texel.y)).rgb;
  vec3 origLeft2   = texture(u_input0, uv + vec2(-2.0 * texel.x, 0.0)).rgb;
  vec3 origUpLeft2 = texture(u_input0, uv + vec2(-2.0 * texel.x, -texel.y)).rgb;
  vec3 origUpRight2= texture(u_input0, uv + vec2(2.0 * texel.x, -texel.y)).rgb;

  vec3 errLeft    = origLeft    - vec3(quantize(origLeft.r, levels), quantize(origLeft.g, levels), quantize(origLeft.b, levels));
  vec3 errUp      = origUp      - vec3(quantize(origUp.r, levels), quantize(origUp.g, levels), quantize(origUp.b, levels));
  vec3 errUpLeft  = origUpLeft  - vec3(quantize(origUpLeft.r, levels), quantize(origUpLeft.g, levels), quantize(origUpLeft.b, levels));
  vec3 errUpRight = origUpRight - vec3(quantize(origUpRight.r, levels), quantize(origUpRight.g, levels), quantize(origUpRight.b, levels));
  vec3 errLeft2   = origLeft2   - vec3(quantize(origLeft2.r, levels), quantize(origLeft2.g, levels), quantize(origLeft2.b, levels));
  vec3 errUpLeft2 = origUpLeft2 - vec3(quantize(origUpLeft2.r, levels), quantize(origUpLeft2.g, levels), quantize(origUpLeft2.b, levels));
  vec3 errUpRight2= origUpRight2- vec3(quantize(origUpRight2.r, levels), quantize(origUpRight2.g, levels), quantize(origUpRight2.b, levels));

  vec3 accumulated = vec3(0.0);

  if (algo == 6) {
    accumulated = errLeft * (7.0 / 16.0)
                + errUpLeft * (3.0 / 16.0)
                + errUp * (5.0 / 16.0)
                + errUpRight * (1.0 / 16.0);
  } else if (algo == 7) {
    accumulated = errLeft * (1.0 / 8.0)
                + errUp * (1.0 / 8.0)
                + errUpLeft * (1.0 / 8.0)
                + errUpRight * (1.0 / 8.0)
                + errLeft2 * (1.0 / 8.0)
                + errUp * (1.0 / 8.0);
  } else if (algo == 11) {
    accumulated = errLeft * (8.0 / 42.0)
                + errLeft2 * (4.0 / 42.0)
                + errUp * (8.0 / 42.0)
                + errUpLeft * (4.0 / 42.0)
                + errUpRight * (4.0 / 42.0)
                + errUpLeft2 * (2.0 / 42.0)
                + errUpRight2 * (2.0 / 42.0);
  } else if (algo == 12) {
    accumulated = errLeft * (8.0 / 32.0)
                + errLeft2 * (4.0 / 32.0)
                + errUp * (8.0 / 32.0)
                + errUpLeft * (4.0 / 32.0)
                + errUpRight * (4.0 / 32.0);
  } else if (algo == 13) {
    accumulated = errLeft * (2.0 / 4.0)
                + errUp * (1.0 / 4.0)
                + errUpLeft * (1.0 / 4.0);
  }

  return accumulated;
}

// ---- Dither Threshold for ordered methods ----

float getDitherThreshold(ivec2 pixelCoord, int algo) {
  if (algo == 0) return bayer2(pixelCoord);
  if (algo == 1) return bayer4(pixelCoord);
  if (algo == 2) return bayer8(pixelCoord);
  if (algo == 3) {
    // Blue noise approximation: combine multiple octaves of hash
    vec2 p = vec2(pixelCoord);
    float n = hash21(p * 1.0) * 0.5
            + hash21(p * 0.5 + 113.0) * 0.25
            + hash21(p * 0.25 + 237.0) * 0.125
            + hash21(p * 0.125 + 471.0) * 0.0625;
    return fract(n * 1.7);
  }
  if (algo == 4) return hash21(vec2(pixelCoord));
  if (algo == 5) return interleavedGradientNoise(vec2(pixelCoord));
  if (algo == 8) return -1.0; // Pattern handled separately
  if (algo == 9) return clusteredDot4(pixelCoord);
  if (algo == 10) return 0.5; // Fixed threshold
  return 0.0; // Error diffusion algorithms return 0 (handled separately)
}
`,
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 src = texture(u_input0, uv);
  float levels = float(u_levels);
  float intensity = u_intensity / 100.0;
  vec2 texel = 1.0 / u_resolution;

  // Compute scaled pixel coordinate for pattern tiling
  ivec2 pixelCoord = ivec2(floor(uv * u_resolution / u_scale));

  int algo = u_algorithm;
  bool isErrorDiffusion = (algo == 6 || algo == 7 || algo == 11 || algo == 12 || algo == 13);

  vec3 result;

  if (u_colorMode == 0) {
    // ---- Mono Mode ----
    float lum = luminance(src.rgb);

    if (isErrorDiffusion) {
      float errAccum = getErrorDiffusionThreshold(uv, texel, levels, algo);
      float adjusted = lum + errAccum * intensity;
      float dithered = quantize(clamp(adjusted, 0.0, 1.0), levels);
      if (u_invert == 1) dithered = 1.0 - dithered;
      result = vec3(dithered);
    } else if (algo == 8) {
      // Pattern dither
      float patterned = patternThreshold(pixelCoord, lum);
      float blended = mix(quantize(lum, levels), patterned, intensity);
      if (u_invert == 1) blended = 1.0 - blended;
      result = vec3(blended);
    } else {
      float threshold = getDitherThreshold(pixelCoord, algo);
      // Remap threshold to [-0.5, 0.5] range and scale by intensity
      float ditherOffset = (threshold - 0.5) * intensity / levels;
      float dithered = quantize(clamp(lum + ditherOffset, 0.0, 1.0), levels);
      if (u_invert == 1) dithered = 1.0 - dithered;
      result = vec3(dithered);
    }

  } else if (u_colorMode == 1) {
    // ---- Per Channel RGB Mode ----
    if (isErrorDiffusion) {
      vec3 errAccum = getErrorDiffusionThresholdRGB(uv, texel, levels, algo);
      vec3 adjusted = src.rgb + errAccum * intensity;
      adjusted = clamp(adjusted, 0.0, 1.0);
      result = vec3(
        quantize(adjusted.r, levels),
        quantize(adjusted.g, levels),
        quantize(adjusted.b, levels)
      );
      if (u_invert == 1) result = 1.0 - result;
    } else if (algo == 8) {
      result = vec3(
        patternThreshold(pixelCoord, src.r),
        patternThreshold(pixelCoord + ivec2(37, 17), src.g),
        patternThreshold(pixelCoord + ivec2(59, 83), src.b)
      );
      result = mix(vec3(quantize(src.r, levels), quantize(src.g, levels), quantize(src.b, levels)), result, intensity);
      if (u_invert == 1) result = 1.0 - result;
    } else {
      float threshold = getDitherThreshold(pixelCoord, algo);
      float ditherOffset = (threshold - 0.5) * intensity / levels;
      result = vec3(
        quantize(clamp(src.r + ditherOffset, 0.0, 1.0), levels),
        quantize(clamp(src.g + ditherOffset, 0.0, 1.0), levels),
        quantize(clamp(src.b + ditherOffset, 0.0, 1.0), levels)
      );
      if (u_invert == 1) result = 1.0 - result;
    }

  } else {
    // ---- Preserve Hue Mode ----
    vec3 hsl = rgb2hsl(src.rgb);
    float lum = hsl.z;

    if (isErrorDiffusion) {
      float errAccum = getErrorDiffusionThreshold(uv, texel, levels, algo);
      float adjusted = lum + errAccum * intensity;
      float ditheredL = quantize(clamp(adjusted, 0.0, 1.0), levels);
      if (u_invert == 1) ditheredL = 1.0 - ditheredL;
      result = hsl2rgb(vec3(hsl.x, hsl.y, ditheredL));
    } else if (algo == 8) {
      float patterned = patternThreshold(pixelCoord, lum);
      float blended = mix(quantize(lum, levels), patterned, intensity);
      if (u_invert == 1) blended = 1.0 - blended;
      result = hsl2rgb(vec3(hsl.x, hsl.y, blended));
    } else {
      float threshold = getDitherThreshold(pixelCoord, algo);
      float ditherOffset = (threshold - 0.5) * intensity / levels;
      float ditheredL = quantize(clamp(lum + ditherOffset, 0.0, 1.0), levels);
      if (u_invert == 1) ditheredL = 1.0 - ditheredL;
      result = hsl2rgb(vec3(hsl.x, hsl.y, ditheredL));
    }
  }

  return vec4(result, src.a);
}`,
};
