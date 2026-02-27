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

export const resultPBRShader: ShaderDefinition = {
  id: 'result-pbr',
  inputCount: 7,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_surfaceHeight', type: 'float' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 baseColor = texture(u_input0, uv);
  if (u_inputCount >= 2) {
    float height = luminance(texture(u_input1, uv).rgb);
    float ao = 1.0;
    if (u_inputCount >= 7) {
      ao = luminance(texture(u_input6, uv).rgb);
    }
    baseColor.rgb *= mix(1.0, ao, 0.3);
  }
  return baseColor;
}`,
};
