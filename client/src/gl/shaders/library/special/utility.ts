import { ShaderDefinition } from '../../ShaderDefinition';

export const passthroughShader: ShaderDefinition = {
  id: 'passthrough',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  return texture(u_input0, uv);
}`,
};

export const solidColorShader: ShaderDefinition = {
  id: 'solid-color',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [{ name: 'u_color', type: 'vec3' }],
  glsl: `
vec4 processPixel(vec2 uv) {
  return vec4(u_color, 1.0);
}`,
};

export const resultShader: ShaderDefinition = {
  id: 'result',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  return texture(u_input0, uv);
}`,
};

export const numericOutputShader: ShaderDefinition = {
  id: 'numeric-output',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [{ name: 'u_value', type: 'float' }],
  glsl: `
vec4 processPixel(vec2 uv) {
  float v = u_value / 100.0;
  return vec4(v, v, v, 1.0);
}`,
};
