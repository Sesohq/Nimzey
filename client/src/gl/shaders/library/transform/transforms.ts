import { ShaderDefinition } from '../../ShaderDefinition';

export const flipShader: ShaderDefinition = {
  id: 'flip',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_horizontal', type: 'bool' },
    { name: 'u_vertical', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 p = uv;
  if (u_horizontal == 1) p.x = 1.0 - p.x;
  if (u_vertical == 1) p.y = 1.0 - p.y;
  return texture(u_input0, p);
}`,
};

export const rotateShader: ShaderDefinition = {
  id: 'rotate',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_rotation', type: 'float' },
    { name: 'u_originX', type: 'float' },
    { name: 'u_originY', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 origin = vec2(u_originX, u_originY);
  float rad = u_rotation * 3.14159265 / 180.0;
  vec2 p = rot2D(-rad) * (uv - origin) + origin;

  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) {
    return vec4(0.0);
  }
  return texture(u_input0, p);
}`,
};

export const scaleShader: ShaderDefinition = {
  id: 'scale',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_scale', type: 'float' },
    { name: 'u_squash', type: 'float' },
    { name: 'u_originX', type: 'float' },
    { name: 'u_originY', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 origin = vec2(u_originX, u_originY);
  float s = u_scale;
  if (abs(s) < 0.001) return vec4(0.0);
  float squash = u_squash / 100.0;
  vec2 scale = vec2(s * (1.0 + squash), s * (1.0 - squash));
  vec2 p = (uv - origin) / scale + origin;

  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) {
    return vec4(0.0);
  }
  return texture(u_input0, p);
}`,
};

export const offsetShader: ShaderDefinition = {
  id: 'offset',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_offsetX', type: 'float' },
    { name: 'u_offsetY', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 p = fract(uv - vec2(u_offsetX, u_offsetY));
  return texture(u_input0, p);
}`,
};

export const lookupShader: ShaderDefinition = {
  id: 'lookup',
  inputCount: 3,
  isNeighborhood: false,
  uniforms: [],
  glsl: `
vec4 processPixel(vec2 uv) {
  float x = luminance(texture(u_input1, uv).rgb);
  float y = luminance(texture(u_input2, uv).rgb);
  return texture(u_input0, vec2(x, y));
}`,
};
