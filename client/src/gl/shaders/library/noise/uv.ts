import { ShaderDefinition } from '../../ShaderDefinition';

export const uvCoordinatesShader: ShaderDefinition = {
  id: 'uv-coordinates',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_tilingX', type: 'float' },
    { name: 'u_tilingY', type: 'float' },
    { name: 'u_offsetX', type: 'float' },
    { name: 'u_offsetY', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 p = fract(uv * vec2(u_tilingX, u_tilingY) + vec2(u_offsetX, u_offsetY));
  return vec4(p.x, p.y, 0.0, 1.0);
}`,
};
