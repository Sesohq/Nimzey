import { ShaderDefinition } from '../../ShaderDefinition';

export const cellsNoiseShader: ShaderDefinition = {
  id: 'cells-noise',
  inputCount: 2,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_scale', type: 'float' },
    { name: 'u_formula', type: 'int' },
    { name: 'u_octaves', type: 'int' },
    { name: 'u_roughness', type: 'float' },
    { name: 'u_smooth', type: 'float' },
    { name: 'u_seed', type: 'int' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 p = uv * u_scale + float(u_seed) * 7.13;

  // Read roughness from map input if connected, otherwise use uniform
  float roughness = u_roughness;
  if (u_inputCount >= 2) {
    roughness = luminance(texture(u_input1, uv).rgb);
  }

  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  float maxVal = 0.0;

  for (int i = 0; i < 8; i++) {
    if (i >= u_octaves) break;
    float w = worleyNoise(p * frequency, u_formula);
    value += w * amplitude;
    maxVal += amplitude;
    amplitude *= roughness;
    frequency *= 2.0;
  }

  value /= maxVal;
  value = clamp(value, 0.0, 1.0);

  // Smooth
  if (u_smooth > 0.0) {
    float s = u_smooth / 100.0;
    value = mix(value, smoothstep(0.0, 1.0, value), s);
  }

  vec4 noiseColor = vec4(vec3(value), 1.0);

  // Composite over background if connected
  if (u_inputCount >= 1) {
    vec4 bg = texture(u_input0, uv);
    return vec4(mix(bg.rgb, noiseColor.rgb, value), max(bg.a, value));
  }
  return noiseColor;
}`,
};

export const blocksNoiseShader: ShaderDefinition = {
  id: 'blocks-noise',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_scale', type: 'float' },
    { name: 'u_octaves', type: 'int' },
    { name: 'u_roughness', type: 'float' },
    { name: 'u_seed', type: 'int' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 p = uv * u_scale + float(u_seed) * 11.7;
  vec2 cell = floor(p);
  vec2 f = fract(p);

  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  float maxVal = 0.0;

  for (int i = 0; i < 8; i++) {
    if (i >= u_octaves) break;
    vec2 cp = p * frequency;
    vec2 ci = floor(cp);
    vec2 cf = fract(cp);
    // Block pattern: hash determines height, rectangular regions
    float h = hash(ci + float(u_seed));
    float blockVal = h * (1.0 - smoothstep(0.0, 0.1, min(cf.x, min(cf.y, min(1.0 - cf.x, 1.0 - cf.y)))));
    value += blockVal * amplitude;
    maxVal += amplitude;
    amplitude *= u_roughness;
    frequency *= 2.0;
  }

  value /= maxVal;
  float v = clamp(value, 0.0, 1.0);
  vec4 noiseColor = vec4(vec3(v), 1.0);

  // Composite over background if connected
  if (u_inputCount >= 1) {
    vec4 bg = texture(u_input0, uv);
    return vec4(mix(bg.rgb, noiseColor.rgb, v), max(bg.a, v));
  }
  return noiseColor;
}`,
};

export const pyramidsNoiseShader: ShaderDefinition = {
  id: 'pyramids-noise',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_scale', type: 'float' },
    { name: 'u_octaves', type: 'int' },
    { name: 'u_roughness', type: 'float' },
    { name: 'u_seed', type: 'int' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 p = uv * u_scale + float(u_seed) * 5.31;

  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  float maxVal = 0.0;

  for (int i = 0; i < 8; i++) {
    if (i >= u_octaves) break;
    vec2 cp = p * frequency;
    vec2 ci = floor(cp);
    vec2 cf = fract(cp);
    // Pyramid shape: 1 at center, 0 at edges
    float pyramid = (1.0 - 2.0 * abs(cf.x - 0.5)) * (1.0 - 2.0 * abs(cf.y - 0.5));
    float h = hash(ci + float(u_seed));
    value += pyramid * h * amplitude;
    maxVal += amplitude;
    amplitude *= u_roughness;
    frequency *= 2.0;
  }

  value /= maxVal;
  float v = clamp(value, 0.0, 1.0);
  vec4 noiseColor = vec4(vec3(v), 1.0);

  // Composite over background if connected
  if (u_inputCount >= 1) {
    vec4 bg = texture(u_input0, uv);
    return vec4(mix(bg.rgb, noiseColor.rgb, v), max(bg.a, v));
  }
  return noiseColor;
}`,
};
