import { ShaderDefinition } from '../../ShaderDefinition';

export const perlinNoiseShader: ShaderDefinition = {
  id: 'perlin-noise',
  inputCount: 1, // background only (map inputs auto-counted by getEffectiveInputs)
  isNeighborhood: false,
  uniforms: [
    { name: 'u_scale', type: 'float' },
    { name: 'u_stretch', type: 'float' },
    { name: 'u_angle', type: 'float' },
    { name: 'u_octaves', type: 'int' },
    { name: 'u_roughness', type: 'float' },
    { name: 'u_contrast', type: 'float' },
    { name: 'u_seed', type: 'int' },
    { name: 'u_color', type: 'vec3' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  // Apply rotation — u_angle auto-resolved from map or slider via #define
  float rad = u_angle * 3.14159265 / 180.0;
  vec2 centered = uv - 0.5;
  vec2 rotated = vec2(
    centered.x * cos(rad) - centered.y * sin(rad),
    centered.x * sin(rad) + centered.y * cos(rad)
  );

  // Apply stretch — u_stretch auto-resolved
  float stretchFactor = 1.0 + u_stretch * 0.01;
  rotated.x *= stretchFactor;

  // u_scale auto-resolved from map or slider via #define
  vec2 p = (rotated + 0.5) * u_scale + float(u_seed) * 17.31;

  // u_roughness auto-resolved from map or slider via #define
  float roughness = u_roughness;

  // FBM
  float value = fbm(p, u_octaves, roughness);

  // Normalize from [-0.5, 0.5] to [0, 1]
  value = value * 0.5 + 0.5;

  // u_contrast auto-resolved from map or slider via #define
  float contrastVal = u_contrast;

  // Apply contrast
  if (contrastVal != 0.0) {
    float c = contrastVal / 100.0;
    if (c > 0.0) {
      value = mix(value, smoothstep(0.0, 1.0, value), c);
    } else {
      value = mix(value, 0.5, -c);
    }
  }

  value = clamp(value, 0.0, 1.0);
  vec4 noiseColor = vec4(u_color * value, 1.0);

  // Composite over background if connected (regular input, checked via u_inputCount)
  if (u_inputCount >= 1) {
    vec4 bg = texture(u_input0, uv);
    return vec4(mix(bg.rgb, noiseColor.rgb, value), max(bg.a, value));
  }
  return noiseColor;
}`,
};
