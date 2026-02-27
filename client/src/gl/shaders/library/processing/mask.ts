import { ShaderDefinition } from '../../ShaderDefinition';

export const maskShader: ShaderDefinition = {
  id: 'mask',
  inputCount: 3,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_channel', type: 'int' },
    { name: 'u_invert', type: 'bool' },
    { name: 'u_softness', type: 'float' },
    { name: 'u_threshold', type: 'float' },
    { name: 'u_range_low', type: 'float' },
    { name: 'u_range_high', type: 'float' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 src = texture(u_input0, uv);
  vec4 maskSample = texture(u_input1, uv);

  // Extract the selected channel from the mask
  float m;
  if (u_channel == 1) {
    m = maskSample.r;       // Red
  } else if (u_channel == 2) {
    m = maskSample.g;       // Green
  } else if (u_channel == 3) {
    m = maskSample.b;       // Blue
  } else if (u_channel == 4) {
    m = maskSample.a;       // Alpha
  } else {
    m = luminance(maskSample.rgb); // Luminance (default)
  }

  // Apply range remapping: map [rangeLow, rangeHigh] to [0, 1]
  float lo = u_range_low / 100.0;
  float hi = u_range_high / 100.0;
  m = clamp((m - lo) / max(hi - lo, 0.001), 0.0, 1.0);

  // Apply threshold with softness via smoothstep
  float thresh = u_threshold / 100.0;
  float soft = u_softness / 100.0 * 0.5; // half-width for smoothstep
  m = smoothstep(thresh - soft, thresh + soft, m);

  // Invert the mask if requested
  if (u_invert == 1) {
    m = 1.0 - m;
  }

  // Composite: if background is connected, blend source over background
  if (u_inputCount >= 3) {
    vec4 bg = texture(u_input2, uv);
    vec3 color = mix(bg.rgb, src.rgb, m * src.a);
    float alpha = mix(bg.a, 1.0, m * src.a);
    return vec4(color, alpha);
  }

  // No background: output source with mask as alpha
  return vec4(src.rgb, src.a * m);
}`,
};
