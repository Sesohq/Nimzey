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

export const powerShader: ShaderDefinition = {
  id: 'math-power', inputCount: 3, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 base = texture(u_input0, uv);
  vec4 exp = texture(u_input1, uv);
  vec4 err = texture(u_input2, uv);
  vec3 result;
  result.r = base.r >= 0.0 ? pow(base.r, exp.r) : err.r;
  result.g = base.g >= 0.0 ? pow(base.g, exp.g) : err.g;
  result.b = base.b >= 0.0 ? pow(base.b, exp.b) : err.b;
  return vec4(result, base.a);
}`,
};

export const moduloShader: ShaderDefinition = {
  id: 'math-modulo', inputCount: 3, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 dividend = texture(u_input0, uv);
  vec4 divisor = texture(u_input1, uv);
  vec4 err = texture(u_input2, uv);
  vec3 result;
  result.r = abs(divisor.r) > 0.001 ? mod(dividend.r, divisor.r) : err.r;
  result.g = abs(divisor.g) > 0.001 ? mod(dividend.g, divisor.g) : err.g;
  result.b = abs(divisor.b) > 0.001 ? mod(dividend.b, divisor.b) : err.b;
  return vec4(result, dividend.a);
}`,
};

export const ifShader: ShaderDefinition = {
  id: 'math-if', inputCount: 4, isNeighborhood: false,
  uniforms: [{ name: 'u_operation', type: 'int' }],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec4 b = texture(u_input1, uv);
  vec4 thenVal = texture(u_input2, uv);
  vec4 elseVal = texture(u_input3, uv);
  bvec3 cond;
  if (u_operation == 0) cond = lessThan(a.rgb, b.rgb);
  else if (u_operation == 1) cond = greaterThan(a.rgb, b.rgb);
  else if (u_operation == 2) cond = lessThanEqual(a.rgb, b.rgb);
  else if (u_operation == 3) cond = greaterThanEqual(a.rgb, b.rgb);
  else if (u_operation == 4) cond = equal(a.rgb, b.rgb);
  else cond = notEqual(a.rgb, b.rgb);
  vec3 result = mix(elseVal.rgb, thenVal.rgb, vec3(cond));
  return vec4(result, a.a);
}`,
};

export const floorShader: ShaderDefinition = {
  id: 'math-floor', inputCount: 1, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  return vec4(floor(a.rgb), a.a);
}`,
};

export const ceilShader: ShaderDefinition = {
  id: 'math-ceil', inputCount: 1, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  return vec4(ceil(a.rgb), a.a);
}`,
};

export const roundShader: ShaderDefinition = {
  id: 'math-round', inputCount: 1, isNeighborhood: false, uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  return vec4(floor(a.rgb + 0.5), a.a);
}`,
};

export const sineShader: ShaderDefinition = {
  id: 'math-sine', inputCount: 1, isNeighborhood: false,
  uniforms: [{ name: 'u_units', type: 'int' }],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec3 v = a.rgb;
  if (u_units == 0) v = v * 3.14159265 / 180.0;
  else if (u_units == 2) v = v * 6.28318530;
  return vec4(sin(v), a.a);
}`,
};

export const cosineShader: ShaderDefinition = {
  id: 'math-cosine', inputCount: 1, isNeighborhood: false,
  uniforms: [{ name: 'u_units', type: 'int' }],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec3 v = a.rgb;
  if (u_units == 0) v = v * 3.14159265 / 180.0;
  else if (u_units == 2) v = v * 6.28318530;
  return vec4(cos(v), a.a);
}`,
};

export const tangentShader: ShaderDefinition = {
  id: 'math-tangent', inputCount: 1, isNeighborhood: false,
  uniforms: [{ name: 'u_units', type: 'int' }],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec3 v = a.rgb;
  if (u_units == 0) v = v * 3.14159265 / 180.0;
  else if (u_units == 2) v = v * 6.28318530;
  return vec4(tan(v), a.a);
}`,
};

export const arcsineShader: ShaderDefinition = {
  id: 'math-arcsine', inputCount: 1, isNeighborhood: false,
  uniforms: [{ name: 'u_units', type: 'int' }],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec3 v = clamp(a.rgb, -1.0, 1.0);
  v = asin(v);
  if (u_units == 0) v = v * 180.0 / 3.14159265;
  else if (u_units == 2) v = v / 6.28318530;
  return vec4(v, a.a);
}`,
};

export const arccosineShader: ShaderDefinition = {
  id: 'math-arccosine', inputCount: 1, isNeighborhood: false,
  uniforms: [{ name: 'u_units', type: 'int' }],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec3 v = clamp(a.rgb, -1.0, 1.0);
  v = acos(v);
  if (u_units == 0) v = v * 180.0 / 3.14159265;
  else if (u_units == 2) v = v / 6.28318530;
  return vec4(v, a.a);
}`,
};

export const arctangentShader: ShaderDefinition = {
  id: 'math-arctangent', inputCount: 1, isNeighborhood: false,
  uniforms: [{ name: 'u_units', type: 'int' }],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 a = texture(u_input0, uv);
  vec3 v = atan(a.rgb);
  if (u_units == 0) v = v * 180.0 / 3.14159265;
  else if (u_units == 2) v = v / 6.28318530;
  return vec4(v, a.a);
}`,
};
