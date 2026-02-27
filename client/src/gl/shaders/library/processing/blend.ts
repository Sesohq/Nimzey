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

export const multiblendShader: ShaderDefinition = {
  id: 'multiblend',
  inputCount: 7,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_opacity1', type: 'float' },
    { name: 'u_opacity2', type: 'float' },
    { name: 'u_opacity3', type: 'float' },
    { name: 'u_opacity4', type: 'float' },
    { name: 'u_opacity5', type: 'float' },
    { name: 'u_opacity6', type: 'float' },
    { name: 'u_opacity7', type: 'float' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 result = vec4(0.0);
  float opacities[7];
  opacities[0] = u_opacity1 / 100.0;
  opacities[1] = u_opacity2 / 100.0;
  opacities[2] = u_opacity3 / 100.0;
  opacities[3] = u_opacity4 / 100.0;
  opacities[4] = u_opacity5 / 100.0;
  opacities[5] = u_opacity6 / 100.0;
  opacities[6] = u_opacity7 / 100.0;

  // Composite layers bottom to top (Normal blend mode)
  if (u_inputCount >= 1) { vec4 c = texture(u_input0, uv); result = mix(result, c, opacities[0] * c.a); result.a = max(result.a, opacities[0] * c.a); }
  if (u_inputCount >= 2) { vec4 c = texture(u_input1, uv); result = mix(result, c, opacities[1] * c.a); result.a = max(result.a, opacities[1] * c.a); }
  if (u_inputCount >= 3) { vec4 c = texture(u_input2, uv); result = mix(result, c, opacities[2] * c.a); result.a = max(result.a, opacities[2] * c.a); }
  if (u_inputCount >= 4) { vec4 c = texture(u_input3, uv); result = mix(result, c, opacities[3] * c.a); result.a = max(result.a, opacities[3] * c.a); }
  if (u_inputCount >= 5) { vec4 c = texture(u_input4, uv); result = mix(result, c, opacities[4] * c.a); result.a = max(result.a, opacities[4] * c.a); }
  if (u_inputCount >= 6) { vec4 c = texture(u_input5, uv); result = mix(result, c, opacities[5] * c.a); result.a = max(result.a, opacities[5] * c.a); }
  if (u_inputCount >= 7) { vec4 c = texture(u_input6, uv); result = mix(result, c, opacities[6] * c.a); result.a = max(result.a, opacities[6] * c.a); }

  return result;
}`,
};
