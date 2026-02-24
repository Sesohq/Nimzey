import { ShaderDefinition } from '../../ShaderDefinition';

export const extractRGBShader: ShaderDefinition = {
  id: 'extract-rgb',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_channel', type: 'int' },
    { name: 'u_invert', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 color = texture(u_input0, uv);
  float v;
  if (u_channel == 0) v = color.r;
  else if (u_channel == 1) v = color.g;
  else v = color.b;
  if (u_invert == 1) v = 1.0 - v;
  return vec4(vec3(v), 1.0);
}`,
};

export const assembleRGBShader: ShaderDefinition = {
  id: 'assemble-rgb',
  inputCount: 3,
  isNeighborhood: false,
  uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  float r = luminance(texture(u_input0, uv).rgb);
  float g = luminance(texture(u_input1, uv).rgb);
  float b = luminance(texture(u_input2, uv).rgb);
  return vec4(r, g, b, 1.0);
}`,
};

export const extractHSBShader: ShaderDefinition = {
  id: 'extract-hsb',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_channel', type: 'int' },
    { name: 'u_invert', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 color = texture(u_input0, uv);
  vec3 hsb = rgb2hsb(color.rgb);
  float v;
  if (u_channel == 0) v = hsb.x;
  else if (u_channel == 1) v = hsb.y;
  else v = hsb.z;
  if (u_invert == 1) v = 1.0 - v;
  return vec4(vec3(v), 1.0);
}`,
};

export const assembleHSBShader: ShaderDefinition = {
  id: 'assemble-hsb',
  inputCount: 3,
  isNeighborhood: false,
  uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  float h = luminance(texture(u_input0, uv).rgb);
  float s = luminance(texture(u_input1, uv).rgb);
  float b = luminance(texture(u_input2, uv).rgb);
  return vec4(hsb2rgb(vec3(h, s, b)), 1.0);
}`,
};

export const getAlphaShader: ShaderDefinition = {
  id: 'get-alpha',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  float a = texture(u_input0, uv).a;
  return vec4(vec3(a), 1.0);
}`,
};

export const setAlphaShader: ShaderDefinition = {
  id: 'set-alpha',
  inputCount: 2,
  isNeighborhood: false,
  uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 source = texture(u_input0, uv);
  float alpha = luminance(texture(u_input1, uv).rgb);
  return vec4(source.rgb, alpha);
}`,
};
