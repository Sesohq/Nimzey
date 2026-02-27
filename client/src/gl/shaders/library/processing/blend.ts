import { ShaderDefinition } from '../../ShaderDefinition';

export const blendShader: ShaderDefinition = {
  id: 'blend',
  inputCount: 3,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_mode', type: 'int' },
    { name: 'u_opacity', type: 'float' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 fg = texture(u_input0, uv); // foreground
  vec4 bg = texture(u_input1, uv); // background
  float baseOpacity = u_opacity / 100.0;

  // If an opacity map is connected (3rd input), use its luminance
  // to control per-pixel blending. Light = show foreground, Dark = show background.
  float mapOpacity = 1.0;
  if (u_inputCount >= 3) {
    vec4 opMap = texture(u_input2, uv);
    mapOpacity = dot(opMap.rgb, vec3(0.299, 0.587, 0.114));
  }

  float opacity = baseOpacity * mapOpacity;
  vec3 blended = blendMode(bg.rgb, fg.rgb, u_mode);
  float alpha = mix(bg.a, fg.a, opacity);
  vec3 result = mix(bg.rgb, blended, opacity * fg.a);
  return vec4(result, alpha);
}`,
};
