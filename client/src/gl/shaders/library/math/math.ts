import { ShaderDefinition } from '../../ShaderDefinition';

export const addShader: ShaderDefinition = {
  id: 'math-add', inputCount: 2, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec4 b = texture(u_input1, uv);
  return vec4(a.rgb + b.rgb, a.a);
}`,
};

export const subtractShader: ShaderDefinition = {
  id: 'math-subtract', inputCount: 2, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec4 b = texture(u_input1, uv);
  return vec4(a.rgb - b.rgb, a.a);
}`,
};

export const multiplyShader: ShaderDefinition = {
  id: 'math-multiply', inputCount: 2, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec4 b = texture(u_input1, uv);
  return vec4(a.rgb * b.rgb, a.a);
}`,
};

export const divideShader: ShaderDefinition = {
  id: 'math-divide', inputCount: 3, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 dividend = texture(u_input0, uv);
  vec4 divisor = texture(u_input1, uv);
  vec4 error = texture(u_input2, uv);
  vec3 result;
  result.r = abs(divisor.r) > 0.001 ? dividend.r / divisor.r : error.r;
  result.g = abs(divisor.g) > 0.001 ? dividend.g / divisor.g : error.g;
  result.b = abs(divisor.b) > 0.001 ? dividend.b / divisor.b : error.b;
  return vec4(result, dividend.a);
}`,
};

export const negateShader: ShaderDefinition = {
  id: 'math-negate', inputCount: 1, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  return vec4(-a.rgb, a.a);
}`,
};

export const absShader: ShaderDefinition = {
  id: 'math-abs', inputCount: 1, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  return vec4(abs(a.rgb), a.a);
}`,
};

export const minShader: ShaderDefinition = {
  id: 'math-min', inputCount: 2, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec4 b = texture(u_input1, uv);
  return vec4(min(a.rgb, b.rgb), a.a);
}`,
};

export const maxShader: ShaderDefinition = {
  id: 'math-max', inputCount: 2, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec4 b = texture(u_input1, uv);
  return vec4(max(a.rgb, b.rgb), a.a);
}`,
};

export const lerpShader: ShaderDefinition = {
  id: 'math-lerp', inputCount: 2, isNeighborhood: false,
  uniforms: [{ name: 'u_factor', type: 'float' }],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec4 b = texture(u_input1, uv);
  float f = u_factor / 100.0;
  return mix(a, b, f);
}`,
};

export const remapRangeShader: ShaderDefinition = {
  id: 'math-remap-range', inputCount: 1, isNeighborhood: false,
  uniforms: [
    { name: 'u_srcMin', type: 'float' }, { name: 'u_srcMax', type: 'float' },
    { name: 'u_outMin', type: 'float' }, { name: 'u_outMax', type: 'float' },
    { name: 'u_clamp', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 color = texture(u_input0, uv);
  float range = u_srcMax - u_srcMin;
  if (abs(range) < 0.0001) return vec4(u_outMin, u_outMin, u_outMin, color.a);
  vec3 t = (color.rgb - u_srcMin) / range;
  vec3 result = mix(vec3(u_outMin), vec3(u_outMax), t);
  if (u_clamp == 1) result = clamp(result, min(u_outMin, u_outMax), max(u_outMin, u_outMax));
  return vec4(result, color.a);
}`,
};
