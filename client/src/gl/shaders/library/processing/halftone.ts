import { ShaderDefinition } from '../../ShaderDefinition';

export const halftoneShader: ShaderDefinition = {
  id: 'halftone',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_algorithm', type: 'int' },
    { name: 'u_scale', type: 'float' },
    { name: 'u_angle', type: 'float' },
    { name: 'u_softness', type: 'float' },
    { name: 'u_invert', type: 'bool' },
    { name: 'u_colorMode', type: 'int' },
    { name: 'u_dotGain', type: 'float' },
    { name: 'u_crosshatchLevels', type: 'int' },
  ],
  helpers: `
// ---- Halftone Helpers ----

// 2x2 rotation matrix from angle in degrees
mat2 htRot2D(float angleDeg) {
  float a = angleDeg * 3.14159265 / 180.0;
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

// Hash for stochastic/FM screening
float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Reusable halftone grid: returns smoothed dot value (0=black, 1=white)
// given UV, rotation angle (degrees), source luminance, cell scale, and edge softness
float halftoneGrid(vec2 uv, float angleDeg, float value, float scale, float softness) {
  vec2 ruv = htRot2D(angleDeg) * uv;
  vec2 cell = ruv * scale;
  vec2 cellId = floor(cell);
  vec2 cellUv = fract(cell) - 0.5;
  float dist = length(cellUv);
  float radius = sqrt(1.0 - value) * 0.5;
  float edge = softness * 0.01 * 0.1;
  return smoothstep(radius - edge, radius + edge, dist);
}

// RGB to CMYK
vec4 rgb2cmyk(vec3 rgb) {
  float k = 1.0 - max(rgb.r, max(rgb.g, rgb.b));
  if (k >= 1.0) return vec4(0.0, 0.0, 0.0, 1.0);
  float invK = 1.0 / (1.0 - k);
  float c = (1.0 - rgb.r - k) * invK;
  float m = (1.0 - rgb.g - k) * invK;
  float y = (1.0 - rgb.b - k) * invK;
  return vec4(c, m, y, k);
}

// CMYK to RGB
vec3 cmyk2rgb(vec4 cmyk) {
  float invK = 1.0 - cmyk.w;
  float r = (1.0 - cmyk.x) * invK;
  float g = (1.0 - cmyk.y) * invK;
  float b = (1.0 - cmyk.z) * invK;
  return vec3(r, g, b);
}

// Apply dot gain: darkens midtones to simulate ink spread
float applyDotGain(float value, float gain) {
  float g = gain * 0.01;
  return value - g * sin(value * 3.14159265);
}

// Simple 2D Perlin-like noise for dot perturbation
float htNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Voronoi/Worley distance for stippling
float voronoiDist(vec2 p, out vec2 cellCenter) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float minDist = 1e10;
  cellCenter = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = vec2(
        hash21(i + neighbor),
        hash21(i + neighbor + vec2(7.0, 13.0))
      );
      vec2 diff = neighbor + point - f;
      float d = dot(diff, diff);
      if (d < minDist) {
        minDist = d;
        cellCenter = i + neighbor + point;
      }
    }
  }
  return sqrt(minDist);
}
`,
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 src = texture(u_input0, uv);
  vec3 color = src.rgb;
  float lum = luminance(color);
  float scale = u_scale;
  float angleDeg = u_angle;
  float softness = u_softness;
  float dotGain = u_dotGain;
  int algo = u_algorithm;
  int colorMode = u_colorMode;

  // If color mode is CMYK, force CMYK separation algorithm
  if (colorMode == 2) {
    algo = 5;
  }

  // Apply dot gain to luminance
  float lumGained = applyDotGain(lum, dotGain);

  vec2 pixUv = uv * u_resolution;
  float result = 1.0;
  vec3 cmykResult = vec3(1.0);

  // ---- Algorithm 0: Circle Dot ----
  if (algo == 0) {
    result = halftoneGrid(pixUv, angleDeg, lumGained, scale / u_resolution.x * 50.0, softness);
  }

  // ---- Algorithm 1: Square Dot ----
  else if (algo == 1) {
    vec2 ruv = htRot2D(angleDeg) * pixUv;
    float s = scale / u_resolution.x * 50.0;
    vec2 cell = ruv * s;
    vec2 cellUv = fract(cell) - 0.5;
    float dist = max(abs(cellUv.x), abs(cellUv.y)); // Chebyshev distance
    float radius = sqrt(1.0 - lumGained) * 0.5;
    float edge = softness * 0.01 * 0.1;
    result = smoothstep(radius - edge, radius + edge, dist);
  }

  // ---- Algorithm 2: Diamond Dot ----
  else if (algo == 2) {
    vec2 ruv = htRot2D(angleDeg) * pixUv;
    float s = scale / u_resolution.x * 50.0;
    vec2 cell = ruv * s;
    vec2 cellUv = fract(cell) - 0.5;
    float dist = abs(cellUv.x) + abs(cellUv.y); // Manhattan distance
    float radius = sqrt(1.0 - lumGained) * 0.7;
    float edge = softness * 0.01 * 0.1;
    result = smoothstep(radius - edge, radius + edge, dist);
  }

  // ---- Algorithm 3: Ellipse Dot ----
  else if (algo == 3) {
    vec2 ruv = htRot2D(angleDeg) * pixUv;
    float s = scale / u_resolution.x * 50.0;
    vec2 cell = ruv * s;
    vec2 cellUv = fract(cell) - 0.5;
    // Scale one axis to create elliptical shape
    vec2 scaled = cellUv * vec2(1.0, 1.6);
    float dist = length(scaled);
    float radius = sqrt(1.0 - lumGained) * 0.5;
    float edge = softness * 0.01 * 0.1;
    result = smoothstep(radius - edge, radius + edge, dist);
  }

  // ---- Algorithm 4: Line Screen ----
  else if (algo == 4) {
    vec2 ruv = htRot2D(angleDeg) * pixUv;
    float s = scale / u_resolution.x * 50.0;
    float line = fract(ruv.x * s);
    float dist = abs(line - 0.5);
    float width = (1.0 - lumGained) * 0.5;
    float edge = softness * 0.01 * 0.1;
    result = smoothstep(width - edge, width + edge, dist);
  }

  // ---- Algorithm 5: CMYK Separation ----
  else if (algo == 5) {
    vec4 cmyk = rgb2cmyk(color);

    // Apply dot gain per channel
    float cVal = applyDotGain(cmyk.x, dotGain);
    float mVal = applyDotGain(cmyk.y, dotGain);
    float yVal = applyDotGain(cmyk.z, dotGain);
    float kVal = applyDotGain(cmyk.w, dotGain);

    float s = scale / u_resolution.x * 50.0;

    // Each channel at a different angle: C=105, M=75, Y=90, K=45
    float cDot = halftoneGrid(pixUv, 105.0, 1.0 - cVal, s, softness);
    float mDot = halftoneGrid(pixUv, 75.0, 1.0 - mVal, s, softness);
    float yDot = halftoneGrid(pixUv, 90.0, 1.0 - yVal, s, softness);
    float kDot = halftoneGrid(pixUv, 45.0, 1.0 - kVal, s, softness);

    // Subtractive blending: each dot absorbs color
    vec3 paper = vec3(1.0);
    // C absorbs red, M absorbs green, Y absorbs blue, K absorbs all
    paper *= mix(vec3(0.0, 1.0, 1.0), vec3(1.0), cDot);
    paper *= mix(vec3(1.0, 0.0, 1.0), vec3(1.0), mDot);
    paper *= mix(vec3(1.0, 1.0, 0.0), vec3(1.0), yDot);
    paper *= mix(vec3(0.0), vec3(1.0), kDot);

    cmykResult = paper;
    // For CMYK, we handle output directly below
  }

  // ---- Algorithm 6: Crosshatch ----
  else if (algo == 6) {
    float s = scale / u_resolution.x * 50.0;
    float edge = softness * 0.01 * 0.15;
    int levels = u_crosshatchLevels;
    float val = 1.0;

    // Each level adds lines at a different angle for darker tones
    float thresholds[6];
    thresholds[0] = 0.8;
    thresholds[1] = 0.6;
    thresholds[2] = 0.4;
    thresholds[3] = 0.3;
    thresholds[4] = 0.2;
    thresholds[5] = 0.1;

    float angles[6];
    angles[0] = 0.0;
    angles[1] = 90.0;
    angles[2] = 45.0;
    angles[3] = 135.0;
    angles[4] = 22.5;
    angles[5] = 67.5;

    for (int i = 0; i < 6; i++) {
      if (i >= levels) break;
      if (lumGained < thresholds[i]) {
        vec2 ruv = htRot2D(angles[i]) * pixUv;
        float line = fract(ruv.x * s);
        float d = abs(line - 0.5);
        float lineWidth = 0.15 + 0.15 * (1.0 - lumGained / thresholds[i]);
        val *= smoothstep(lineWidth - edge, lineWidth + edge, d);
      }
    }
    result = val;
  }

  // ---- Algorithm 7: Stochastic/FM ----
  else if (algo == 7) {
    float s = scale * 2.0;
    float noise = hash21(floor(pixUv / s) * s);
    float edge = softness * 0.01 * 0.3;
    result = smoothstep(lumGained - edge, lumGained + edge, noise);
  }

  // ---- Algorithm 8: Voronoi Stipple ----
  else if (algo == 8) {
    float s = scale / u_resolution.x * 50.0;
    vec2 scaledUv = pixUv * s;
    vec2 cellCenter;
    float dist = voronoiDist(scaledUv, cellCenter);

    // Sample luminance at cell center for dot size
    vec2 centerUv = cellCenter / (u_resolution * s);
    float centerLum = luminance(texture(u_input0, centerUv).rgb);
    centerLum = applyDotGain(centerLum, dotGain);

    float radius = (1.0 - centerLum) * 0.45;
    float edge = softness * 0.01 * 0.1;
    result = smoothstep(radius - edge, radius + edge, dist);
  }

  // ---- Algorithm 9: Newsprint ----
  else if (algo == 9) {
    vec4 cmyk = rgb2cmyk(color);

    // Heavy dot gain for newsprint look
    float heavyGain = dotGain + 30.0;
    float cVal = applyDotGain(cmyk.x, heavyGain);
    float mVal = applyDotGain(cmyk.y, heavyGain);
    float yVal = applyDotGain(cmyk.z, heavyGain);
    float kVal = applyDotGain(cmyk.w, heavyGain);

    float s = scale / u_resolution.x * 50.0;

    // All at same angle for classic newsprint look
    float sameAngle = angleDeg;
    float cDot = halftoneGrid(pixUv, sameAngle + 15.0, 1.0 - cVal, s, softness);
    float mDot = halftoneGrid(pixUv, sameAngle + 75.0, 1.0 - mVal, s, softness);
    float yDot = halftoneGrid(pixUv, sameAngle, 1.0 - yVal, s, softness);
    float kDot = halftoneGrid(pixUv, sameAngle + 45.0, 1.0 - kVal, s, softness);

    // Subtractive blending on yellowed paper
    vec3 paper = vec3(0.95, 0.92, 0.82); // Yellowed newsprint
    paper *= mix(vec3(0.0, 1.0, 1.0), vec3(1.0), cDot);
    paper *= mix(vec3(1.0, 0.0, 1.0), vec3(1.0), mDot);
    paper *= mix(vec3(1.0, 1.0, 0.0), vec3(1.0), yDot);
    paper *= mix(vec3(0.0), vec3(1.0), kDot);

    cmykResult = paper;
    algo = 5; // flag to use cmykResult path
  }

  // ---- Algorithm 10: Dot with Noise ----
  else if (algo == 10) {
    vec2 ruv = htRot2D(angleDeg) * pixUv;
    float s = scale / u_resolution.x * 50.0;
    vec2 cell = ruv * s;
    vec2 cellId = floor(cell);
    vec2 cellUv = fract(cell) - 0.5;
    float dist = length(cellUv);

    // Perturb edge with noise
    float noiseVal = htNoise(pixUv * 0.1) * 2.0 - 1.0;
    float perturbation = noiseVal * 0.08;

    float radius = sqrt(1.0 - lumGained) * 0.5 + perturbation;
    float edge = softness * 0.01 * 0.1;
    result = smoothstep(radius - edge, radius + edge, dist);
  }

  // ---- Algorithm 11: Multi-Angle ----
  else if (algo == 11) {
    float s = scale / u_resolution.x * 50.0;
    // Two screens at different angles, multiplied for moire
    float screen1 = halftoneGrid(pixUv, angleDeg, lumGained, s, softness);
    float screen2 = halftoneGrid(pixUv, angleDeg + 30.0, lumGained, s * 1.1, softness);
    result = screen1 * screen2;
  }

  // ---- Compose final output ----
  vec3 outColor;

  if (algo == 5) {
    // CMYK path (algorithms 5 and 9)
    outColor = cmykResult;
  } else if (colorMode == 0) {
    // Mono: black and white
    outColor = vec3(result);
  } else if (colorMode == 1) {
    // Preserve Color: use halftone as mask over original color
    outColor = color * (1.0 - result) + result * vec3(1.0);
    // Actually multiply: darker dots show original color, lighter areas become white
    outColor = mix(vec3(1.0), color, 1.0 - result);
  } else {
    outColor = vec3(result);
  }

  // Invert
  if (u_invert == 1) {
    outColor = 1.0 - outColor;
  }

  return vec4(outColor, src.a);
}`,
};
