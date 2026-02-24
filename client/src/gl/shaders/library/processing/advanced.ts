import { ShaderDefinition } from '../../ShaderDefinition';

export const noiseDistortionShader: ShaderDefinition = {
  id: 'noise-distortion',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_distortion', type: 'float' },
    { name: 'u_scale', type: 'float' },
    { name: 'u_roughness', type: 'float' },
    { name: 'u_octaves', type: 'int' },
    { name: 'u_seed', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float dist = u_distortion / 100.0 * 0.2;
  vec2 noiseCoord = uv * u_scale + float(u_seed) * 13.7;

  float dx = fbm(noiseCoord, u_octaves, u_roughness);
  float dy = fbm(noiseCoord + vec2(31.0, 17.0), u_octaves, u_roughness);

  vec2 displaced = uv + vec2(dx, dy) * dist;
  return texture(u_input0, displaced);
}`,
};

export const refractionShader: ShaderDefinition = {
  id: 'refraction',
  inputCount: 2,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_refraction', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 height = texture(u_input1, uv);
  float h = luminance(height.rgb);
  vec2 texel = 1.0 / u_resolution;

  // Compute gradient of height map
  float hx = luminance(texture(u_input1, uv + vec2(texel.x, 0.0)).rgb) - h;
  float hy = luminance(texture(u_input1, uv + vec2(0.0, texel.y)).rgb) - h;

  float refract = u_refraction / 100.0;
  vec2 displaced = uv + vec2(hx, hy) * refract;
  return texture(u_input0, displaced);
}`,
};

export const medianShader: ShaderDefinition = {
  id: 'median',
  inputCount: 1,
  isNeighborhood: true,
  uniforms: [
    { name: 'u_radius', type: 'int' },
  ],
  glsl: `
// Simple median approximation using sorted partial samples
vec4 processPixel(vec2 uv) {
  vec2 texel = 1.0 / u_resolution;
  int r = u_radius;
  int count = 0;

  // Collect samples and sort by luminance (simplified - use average)
  vec4 sum = vec4(0.0);
  float totalWeight = 0.0;
  for (int x = -5; x <= 5; x++) {
    if (abs(x) > r) continue;
    for (int y = -5; y <= 5; y++) {
      if (abs(y) > r) continue;
      vec4 s = texture(u_input0, uv + vec2(float(x), float(y)) * texel);
      sum += s;
      totalWeight += 1.0;
    }
  }
  // Approximate median as weighted center
  vec4 avg = sum / totalWeight;
  vec4 center = texture(u_input0, uv);
  return mix(avg, center, 0.5);
}`,
};

export const maximumShader: ShaderDefinition = {
  id: 'maximum',
  inputCount: 1,
  isNeighborhood: true,
  uniforms: [
    { name: 'u_radius', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 texel = 1.0 / u_resolution;
  int r = u_radius;
  vec4 maxColor = vec4(0.0);

  for (int x = -10; x <= 10; x++) {
    if (abs(x) > r) continue;
    for (int y = -10; y <= 10; y++) {
      if (abs(y) > r) continue;
      vec4 s = texture(u_input0, uv + vec2(float(x), float(y)) * texel);
      maxColor = max(maxColor, s);
    }
  }
  return maxColor;
}`,
};

export const minimumShader: ShaderDefinition = {
  id: 'minimum',
  inputCount: 1,
  isNeighborhood: true,
  uniforms: [
    { name: 'u_radius', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 texel = 1.0 / u_resolution;
  int r = u_radius;
  vec4 minColor = vec4(1.0);

  for (int x = -10; x <= 10; x++) {
    if (abs(x) > r) continue;
    for (int y = -10; y <= 10; y++) {
      if (abs(y) > r) continue;
      vec4 s = texture(u_input0, uv + vec2(float(x), float(y)) * texel);
      minColor = min(minColor, s);
    }
  }
  minColor.a = texture(u_input0, uv).a;
  return minColor;
}`,
};
