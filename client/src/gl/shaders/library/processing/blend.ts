import { ShaderDefinition } from '../../ShaderDefinition';

export const blendShader: ShaderDefinition = {
  id: 'blend',
  inputCount: 2,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_mode', type: 'int' },
    { name: 'u_opacity', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 fg = texture(u_input0, uv); // foreground
  vec4 bg = texture(u_input1, uv); // background
  float opacity = u_opacity / 100.0;

  vec3 blended = blendMode(bg.rgb, fg.rgb, u_mode);
  float alpha = mix(bg.a, fg.a, opacity);
  vec3 result = mix(bg.rgb, blended, opacity * fg.a);
  return vec4(result, alpha);
}`,
};
