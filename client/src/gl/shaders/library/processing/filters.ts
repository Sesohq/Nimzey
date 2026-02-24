import { ShaderDefinition } from '../../ShaderDefinition';

export const blurShader: ShaderDefinition = {
  id: 'blur',
  inputCount: 1,
  isNeighborhood: true,
  uniforms: [
    { name: 'u_radius', type: 'float' },
    { name: 'u_gaussian', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float radius = u_radius / 100.0 * u_resolution.x * 0.1;
  if (radius < 0.5) return texture(u_input0, uv);

  vec2 texelSize = 1.0 / u_resolution;
  vec4 sum = vec4(0.0);
  float totalWeight = 0.0;
  int samples = int(min(radius * 2.0, 64.0));
  float sigma = radius / 3.0;

  for (int x = -32; x <= 32; x++) {
    if (abs(x) > samples) continue;
    for (int y = -32; y <= 32; y++) {
      if (abs(y) > samples) continue;
      vec2 offset = vec2(float(x), float(y)) * texelSize;
      float weight;
      if (u_gaussian == 1) {
        float d = float(x * x + y * y);
        weight = exp(-d / (2.0 * sigma * sigma));
      } else {
        weight = 1.0; // Box blur
      }
      sum += texture(u_input0, uv + offset) * weight;
      totalWeight += weight;
    }
  }
  return sum / totalWeight;
}`,
};

export const sharpenShader: ShaderDefinition = {
  id: 'sharpen',
  inputCount: 1,
  isNeighborhood: true,
  uniforms: [
    { name: 'u_amount', type: 'float' },
    { name: 'u_radius', type: 'float' },
    { name: 'u_preserveColor', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 texelSize = u_radius / u_resolution;
  vec4 center = texture(u_input0, uv);
  vec4 blur = (
    texture(u_input0, uv + vec2(-texelSize.x, 0.0)) +
    texture(u_input0, uv + vec2( texelSize.x, 0.0)) +
    texture(u_input0, uv + vec2(0.0, -texelSize.y)) +
    texture(u_input0, uv + vec2(0.0,  texelSize.y))
  ) * 0.25;

  float amount = u_amount / 100.0;
  vec4 sharpened = center + (center - blur) * amount * 2.0;

  if (u_preserveColor == 1) {
    float origLum = luminance(center.rgb);
    float sharpLum = luminance(sharpened.rgb);
    if (sharpLum > 0.001) {
      sharpened.rgb *= origLum / sharpLum;
    }
  }

  return vec4(clamp(sharpened.rgb, 0.0, 1.0), center.a);
}`,
};

export const edgeDetectorShader: ShaderDefinition = {
  id: 'edge-detector',
  inputCount: 1,
  isNeighborhood: true,
  uniforms: [
    { name: 'u_formula', type: 'int' },
    { name: 'u_mode', type: 'int' },
    { name: 'u_radius', type: 'float' },
    { name: 'u_amplitude', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 texel = u_radius / u_resolution;
  vec4 center = texture(u_input0, uv);

  // Sample neighbors
  vec4 tl = texture(u_input0, uv + vec2(-texel.x, -texel.y));
  vec4 tc = texture(u_input0, uv + vec2(0.0, -texel.y));
  vec4 tr = texture(u_input0, uv + vec2( texel.x, -texel.y));
  vec4 ml = texture(u_input0, uv + vec2(-texel.x, 0.0));
  vec4 mr = texture(u_input0, uv + vec2( texel.x, 0.0));
  vec4 bl = texture(u_input0, uv + vec2(-texel.x,  texel.y));
  vec4 bc = texture(u_input0, uv + vec2(0.0,  texel.y));
  vec4 br = texture(u_input0, uv + vec2( texel.x,  texel.y));

  vec3 gx, gy;

  if (u_formula == 0) { // Sobel
    gx = -tl.rgb - 2.0 * ml.rgb - bl.rgb + tr.rgb + 2.0 * mr.rgb + br.rgb;
    gy = -tl.rgb - 2.0 * tc.rgb - tr.rgb + bl.rgb + 2.0 * bc.rgb + br.rgb;
  } else if (u_formula == 1) { // Roberts
    gx = center.rgb - br.rgb;
    gy = mr.rgb - bc.rgb;
  } else { // Gradient
    gx = mr.rgb - ml.rgb;
    gy = bc.rgb - tc.rgb;
  }

  vec3 edge;
  if (u_mode == 0) { // Grayscale
    float ex = luminance(gx);
    float ey = luminance(gy);
    float e = sqrt(ex * ex + ey * ey);
    edge = vec3(e);
  } else if (u_mode == 1) { // Channel-wise
    edge = sqrt(gx * gx + gy * gy);
  } else if (u_mode == 2) { // Min
    edge = min(abs(gx), abs(gy));
  } else { // Max
    edge = max(abs(gx), abs(gy));
  }

  return vec4(clamp(edge * u_amplitude, 0.0, 1.0), center.a);
}`,
};

export const highPassShader: ShaderDefinition = {
  id: 'high-pass',
  inputCount: 1,
  isNeighborhood: true,
  uniforms: [
    { name: 'u_radius', type: 'float' },
    { name: 'u_contrast', type: 'float' },
    { name: 'u_monochrome', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 center = texture(u_input0, uv);
  vec2 texelSize = 1.0 / u_resolution;
  float radius = u_radius;

  // Simple box blur for low-pass
  vec4 sum = vec4(0.0);
  float count = 0.0;
  int r = int(radius);
  for (int x = -16; x <= 16; x++) {
    if (abs(x) > r) continue;
    for (int y = -16; y <= 16; y++) {
      if (abs(y) > r) continue;
      sum += texture(u_input0, uv + vec2(float(x), float(y)) * texelSize);
      count += 1.0;
    }
  }
  vec4 lowPass = sum / count;

  vec3 highPass = center.rgb - lowPass.rgb + 0.5;
  float contrast = u_contrast / 100.0;
  highPass = mix(vec3(0.5), highPass, contrast);

  if (u_monochrome == 1) {
    float gray = luminance(highPass);
    highPass = vec3(gray);
  }

  return vec4(clamp(highPass, 0.0, 1.0), center.a);
}`,
};

export const motionBlurShader: ShaderDefinition = {
  id: 'motion-blur',
  inputCount: 1,
  isNeighborhood: true,
  uniforms: [
    { name: 'u_radius', type: 'float' },
    { name: 'u_angle', type: 'float' },
    { name: 'u_directional', type: 'float' },
    { name: 'u_gaussian', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float radius = u_radius / 100.0 * u_resolution.x * 0.1;
  if (radius < 0.5) return texture(u_input0, uv);

  float rad = u_angle * 3.14159265 / 180.0;
  vec2 dir = vec2(cos(rad), sin(rad));
  vec2 texelSize = 1.0 / u_resolution;
  float directional = u_directional / 100.0;

  vec4 sum = vec4(0.0);
  float totalWeight = 0.0;
  int samples = int(min(radius * 2.0, 64.0));
  float sigma = radius / 3.0;

  for (int i = -32; i <= 32; i++) {
    if (abs(i) > samples) continue;
    vec2 offset = dir * float(i) * texelSize;
    // Add perpendicular component for non-directional
    if (directional < 1.0) {
      vec2 perp = vec2(-dir.y, dir.x);
      offset += perp * float(i) * texelSize * (1.0 - directional);
    }
    float weight = u_gaussian == 1 ? exp(-float(i * i) / (2.0 * sigma * sigma)) : 1.0;
    sum += texture(u_input0, uv + offset) * weight;
    totalWeight += weight;
  }

  return sum / totalWeight;
}`,
};
